import { collection, getDocs, query, orderBy, limit, doc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  customer: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
  };
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: any;
  updatedAt?: any;
}

const COLLECTION = 'orders';

export const orderService = {
  async getAllOrders() {
    try {
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getRecentOrders(count: number = 5) {
    try {
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(count));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getUserOrders(userId: string) {
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  }
};
