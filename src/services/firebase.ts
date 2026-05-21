import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCfX8bT4vGQHysnClDqUICize3XAZOKqEM",
  authDomain: "ufrcollection2026.firebaseapp.com",
  projectId: "ufrcollection2026",
  storageBucket: "ufrcollection2026.firebasestorage.app",
  messagingSenderId: "130281128890",
  appId: "1:130281128890:web:d7efde48db153ad564d383"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log("🔥 Firebase Connected:", firebaseConfig.projectId);