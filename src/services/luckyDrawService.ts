import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum TokenStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  WINNER = 'winner'
}

export interface LuckyDrawToken {
  id?: string;
  userId: string;
  orderId: string;
  tokenNumber: string;
  status: TokenStatus;
  prize?: string;
  createdAt: Timestamp;
}

export interface LuckyDrawWinner {
  userId: string;
  userName: string;
  userPhone?: string;
  tokenNumber: string;
  prize: string;
  position: number;
}

export interface LuckyDrawConfig {
  status: 'active' | 'inactive';
  startDate?: Timestamp;
  drawDate?: Timestamp;
  winners?: LuckyDrawWinner[];
  announced?: boolean;
}

const TOKENS_COLLECTION = 'lucky_draw_tokens';
const CONFIG_DOC = 'lucky_draw_config/current';

export const luckyDrawService = {
  async getPromotionConfig(): Promise<LuckyDrawConfig | null> {
    try {
      const docRef = doc(db, CONFIG_DOC);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as LuckyDrawConfig;
      }
      
      // Initialize with default config
      const defaultConfig: LuckyDrawConfig = {
        status: 'active',
        startDate: Timestamp.now(),
        drawDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        winners: []
      };
      await this.updatePromotionConfig(defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error('Maison: Error fetching lucky draw config', error);
      return null;
    }
  },

  async updatePromotionConfig(config: LuckyDrawConfig): Promise<void> {
    try {
      await setDoc(doc(db, CONFIG_DOC), config, { merge: true });
    } catch (error) {
      console.error('Maison: Error updating lucky draw config', error);
      throw error;
    }
  },

  async generateToken(userId: string, orderId: string, status: TokenStatus = TokenStatus.ACTIVE): Promise<string | null> {
    try {
      const config = await this.getPromotionConfig();
      if (!config || config.status !== 'active') {
        console.warn('Maison: Lucky draw promotion is not active');
        return null;
      }

      // Generate unique token number format: UFR-LD-XXXXX
      const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
      const tokenNumber = `UFR-LD-${randomPart}`;

      const tokenData: LuckyDrawToken = {
        userId,
        orderId,
        tokenNumber,
        status,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, TOKENS_COLLECTION), tokenData);
      return tokenNumber;
    } catch (error) {
      console.error('Maison: Error generating lucky draw token', error);
      return null;
    }
  },

  async getUserTokens(userId: string): Promise<LuckyDrawToken[]> {
    try {
      const q = query(
        collection(db, TOKENS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LuckyDrawToken));
    } catch (error) {
      console.error('Maison: Error fetching user tokens', error);
      return [];
    }
  },

  async getAllTokens(): Promise<LuckyDrawToken[]> {
    try {
      const querySnapshot = await getDocs(collection(db, TOKENS_COLLECTION));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LuckyDrawToken));
    } catch (error) {
      console.error('Maison: Error fetching all tokens', error);
      return [];
    }
  },

  async runLuckyDraw(): Promise<LuckyDrawWinner[]> {
    try {
      const tokens = await this.getAllTokens();
      const activeTokens = tokens.filter(t => t.status === TokenStatus.ACTIVE);
      
      if (activeTokens.length === 0) return [];

      // Sort and shuffle
      const shuffled = [...activeTokens].sort(() => 0.5 - Math.random());
      
      const prizes = [
        { prize: 'iPhone 17', pos: 1 },
        { prize: 'Honda 70 2026 Model + Cash', pos: 2 },
        { prize: 'Rs. 100,000 Cash', pos: 3 },
        ...Array(7).fill({ prize: 'Rs. 10,000 Cash', pos: 4 })
      ];

      const winners: LuckyDrawWinner[] = [];
      const usedUserIds = new Set<string>();

      for (let i = 0; i < shuffled.length && winners.length < prizes.length; i++) {
        const token = shuffled[i];
        if (!usedUserIds.has(token.userId)) {
          const winnerData: LuckyDrawWinner = {
            userId: token.userId,
            userName: 'Customer', // Would need to fetch user name in real scenario or store in token
            tokenNumber: token.tokenNumber,
            prize: prizes[winners.length].prize,
            position: prizes[winners.length].pos
          };
          winners.push(winnerData);
          usedUserIds.add(token.userId);

          // Update token status in Firestore
          const tokenRef = doc(db, TOKENS_COLLECTION, token.id!);
          await updateDoc(tokenRef, { 
            status: TokenStatus.WINNER,
            prize: prizes[winners.length - 1].prize
          });
        }
      }

      // Update config with winners
      await this.updatePromotionConfig({
        status: 'inactive',
        winners
      });

      return winners;
    } catch (error) {
      console.error('Maison: Error running lucky draw', error);
      throw error;
    }
  },

  async resetPromotion(): Promise<void> {
    try {
      // Clear tokens (optional, or just archive them)
      // For now, we'll just reset the config
      await this.updatePromotionConfig({
        status: 'active',
        startDate: Timestamp.now(),
        drawDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        winners: []
      });
    } catch (error) {
      console.error('Maison: Error resetting promotion', error);
      throw error;
    }
  }
};
