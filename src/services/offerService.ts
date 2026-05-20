import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping' | 'seasonal';
  value: number;
  offerLabel: string;
  startDate: any;
  endDate: any;
  status: 'active' | 'inactive';
  productIds: string[];
  categories: string[];
  bannerImage?: string;
  createdAt: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'offers';

export const offerService = {
  async getAllOffers() {
    console.log("Maison: Fetching all offers from collection 'offers'");
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      console.log(`Maison: Successfully fetched ${snapshot.docs.length} offers`);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
    } catch (error) {
      console.error("Maison: getAllOffers failed", error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  async getActiveOffers() {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const allActive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      
      // Filter by dates manually if needed, or by query if possible
      // Firebase doesn't support inequality on multiple fields easily
      return allActive.filter(offer => {
        const start = offer.startDate instanceof Timestamp ? offer.startDate : (offer.startDate ? Timestamp.fromDate(new Date(offer.startDate)) : null);
        const end = offer.endDate instanceof Timestamp ? offer.endDate : (offer.endDate ? Timestamp.fromDate(new Date(offer.endDate)) : null);
        
        const isStarted = !start || start.toMillis() <= now.toMillis();
        const isNotEnded = !end || end.toMillis() >= now.toMillis();
        
        return isStarted && isNotEnded;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  async addOffer(data: Omit<Offer, 'id' | 'createdAt'>) {
    console.log("Maison: Attempting to archive new offer protocol", data);
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log("Maison: Offer successfully archived with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Maison: Archiving failed", error);
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      return null;
    }
  },

  async updateOffer(id: string, data: Partial<Offer>) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...data,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      return false;
    }
  },

  async deleteOffer(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      return false;
    }
  }
};
