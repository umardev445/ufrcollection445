import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  phoneNumber?: string;
  address?: string;
  createdAt: any;
}

const COLLECTION = 'users';

export const userService = {
  async getAllUsers() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getUserById(id: string) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, id));
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
      return null;
    }
  },

  async updateUserRole(id: string, role: 'user' | 'admin') {
    try {
      await updateDoc(doc(db, COLLECTION, id), { role });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
      return false;
    }
  },

  async toggleUserBlock(id: string, blocked: boolean) {
    try {
      await updateDoc(doc(db, COLLECTION, id), { status: blocked ? 'blocked' : 'active' });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
      return false;
    }
  },

  async deleteUser(id: string) {
    try {
      // Note: This only deletes from Firestore, not Firebase Auth
      // In a real app, you'd need a Cloud Function to delete from Auth too
      await updateDoc(doc(db, COLLECTION, id), { role: 'deleted', deletedAt: new Date() });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
      return false;
    }
  }
};
