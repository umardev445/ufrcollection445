import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface NotificationRequest {
  id?: string;
  email: string;
  productId: string;
  productName: string;
  createdAt: any;
  status: 'pending' | 'notified';
}

const COLLECTION = 'notification_requests';

export const notificationService = {
  async requestNotification(email: string, productId: string, productName: string) {
    try {
      // Check if already requested
      const q = query(
        collection(db, COLLECTION),
        where('email', '==', email),
        where('productId', '==', productId),
        where('status', '==', 'pending')
      );
      const existing = await getDocs(q);
      if (!existing.empty) return { success: true, alreadyExists: true };

      await addDoc(collection(db, COLLECTION), {
        email,
        productId,
        productName,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
      return { success: false };
    }
  }
};
