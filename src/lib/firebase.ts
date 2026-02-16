import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZZ2ywKsEe2ha3LyA-W_LWmFp1v8uqGv0",
  authDomain: "bodybalance-39bd5.firebaseapp.com",
  projectId: "bodybalance-39bd5",
  storageBucket: "bodybalance-39bd5.firebasestorage.app",
  messagingSenderId: "494273576542",
  appId: "1:494273576542:web:341c8966ffad7a9a213ecf",
};

// Firebase initialiseren
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
