import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Note: firebase-applet-config.json will be created after set_up_firebase(true)
import firebaseConfig from '../../firebase-applet-config.json';

if (!firebaseConfig || !firebaseConfig.projectId) {
  console.error("Firebase configuration is missing or invalid. Please ensure set_up_firebase has been run.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Validate Connection to Firestore as per Integration Skills
async function testConnection() {
  if (!firebaseConfig.projectId) return;
  
  try {
    // Attempting a simple read to check connectivity
    console.log("Testing Firestore connectivity to database:", firebaseConfig.firestoreDatabaseId);
    await getDocFromServer(doc(db, 'system', 'connectivity_probe'));
    console.log("Firestore connection check completed (Success or permitted Permission Denied)");
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.error("CRITICAL: Firestore is unavailable. This may be a network issue or the database is still provisioning.");
    } else if (error.code === 'permission-denied') {
      console.log("Firestore connectivity established (reached backend, but access denied as expected).");
    } else {
      console.error("Firestore connectivity diagnostic error:", error);
    }
  }
}

testConnection();
