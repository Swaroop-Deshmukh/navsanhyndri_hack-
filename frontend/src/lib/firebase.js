// ============================================================
// Firebase Configuration — AQI Pulse  
// ============================================================
// SETUP INSTRUCTIONS (do this when prompted):
//  1. Go to https://console.firebase.google.com
//  2. Create a new project (e.g. "aqi-pulse")
//  3. Enable Authentication → Sign-in method → Google
//  4. Create a Firestore database (start in test mode)
//  5. Project Settings → Your Apps → Add Web App → copy config below
//  6. Replace the placeholder values in firebaseConfig with yours
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⬇️  REPLACE these values with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAjdo8eiU3fZHA7dLotGgEObblaNxnbFi4",
  authDomain: "navashyadrihack.firebaseapp.com",
  projectId: "navashyadrihack",
  storageBucket: "navashyadrihack.firebasestorage.app",
  messagingSenderId: "951560383058",
  appId: "1:951560383058:web:95f8eec0e00c4294044d8b",
  measurementId: "G-967LJJ9TY0"
};

let app, auth, db, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn('[Firebase] Not configured yet — running in demo mode without auth.');
}

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithPopup(auth, googleProvider);
};

export const signOutUser = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

export { auth, db };
