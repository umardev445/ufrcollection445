import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { user } = useAuth();

  // Load wishlist based on auth state
  useEffect(() => {
    const loadWishlist = async () => {
      // 1. If user is logged in, fetch from Firestore
      if (user) {
        const docRef = doc(db, 'wishlists', user.uid);
        const docSnap = await getDoc(docRef);
        
        let firestoreWishlist: string[] = [];
        if (docSnap.exists()) {
          firestoreWishlist = docSnap.data().productIds || [];
        }

        // 2. Check for local wishlist to merge
        const localSaved = localStorage.getItem('guest_wishlist');
        if (localSaved) {
          const localWishlist = JSON.parse(localSaved);
          // Merge unique IDs
          const mergedWishlist = Array.from(new Set([...firestoreWishlist, ...localWishlist]));
          
          // Update Firestore with merged list
          if (docSnap.exists()) {
            await updateDoc(docRef, { productIds: mergedWishlist });
          } else {
            await setDoc(docRef, { productIds: mergedWishlist });
          }
          
          // Clear local wishlist after merge
          localStorage.removeItem('guest_wishlist');
          setWishlist(mergedWishlist);
        } else {
          setWishlist(firestoreWishlist);
        }
      } else {
        // 3. Guest user: load from local storage
        const localSaved = localStorage.getItem('guest_wishlist');
        setWishlist(localSaved ? JSON.parse(localSaved) : []);
      }
    };

    loadWishlist();
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      // Handle guest wishlist locally
      const newWishlist = wishlist.includes(productId)
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId];
      
      setWishlist(newWishlist);
      localStorage.setItem('guest_wishlist', JSON.stringify(newWishlist));
      toast.success(wishlist.includes(productId) ? 'Removed from your archive' : 'Preserved in your archive');
      return;
    }

    const docRef = doc(db, 'wishlists', user.uid);
    const docSnap = await getDoc(docRef);

    if (wishlist.includes(productId)) {
      setWishlist((prev) => prev.filter((id) => id !== productId));
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          productIds: arrayRemove(productId),
        });
      }
      toast.success('Removed from your archive');
    } else {
      setWishlist((prev) => [...prev, productId]);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          productIds: arrayUnion(productId),
        });
      } else {
        await setDoc(docRef, {
          productIds: [productId],
        });
      }
      toast.success('Preserved in your archive');
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
