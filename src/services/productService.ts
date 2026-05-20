import { collection, getDocs, getDoc, doc, query, orderBy, limit, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  collectionIds?: string[];
  discount?: number;
  offerLabel?: string;
  rating: number;
  reviewsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const COLLECTION = 'products';

export const productService = {
  async getAllProducts() {
    try {
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getLatestProducts(count: number = 4) {
    try {
      const q = query(
        collection(db, COLLECTION), 
        orderBy('createdAt', 'desc'), 
        limit(count)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getProductById(id: string) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Product;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
      return null;
    }
  },

  async getProductsByCategory(category: string, excludeId?: string) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('category', '==', category),
        limit(5)
      );
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (excludeId) {
        products = products.filter(p => p.id !== excludeId);
      }
      return products.slice(0, 4);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
      return [];
    }
  },

  async getProductReviews(productId: string) {
    try {
      const reviewsRef = collection(db, COLLECTION, productId, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${productId}/reviews`);
      return [];
    }
  },

  async addProductReview(productId: string, review: Omit<Review, 'id' | 'createdAt'>) {
    try {
      const reviewsRef = collection(db, COLLECTION, productId, 'reviews');
      const newReview = {
        ...review,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(reviewsRef, newReview);
      return { id: docRef.id, ...newReview };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION}/${productId}/reviews`);
      throw error;
    }
  }
};
