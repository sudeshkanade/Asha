import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// NOTE: Firebase web API keys are intentionally public — they identify the app to Firebase
// but don't grant admin access. Security is enforced by Firestore security rules.
const firebaseConfig = {
  apiKey: "AIzaSyBe6IGJ65GlpnmCnPTTbA4_uR9XQcuwZpI",
  authDomain: "asha---rural-health-tracker.firebaseapp.com",
  projectId: "asha---rural-health-tracker",
  storageBucket: "asha---rural-health-tracker.firebasestorage.app",
  messagingSenderId: "64546671948",
  appId: "1:64546671948:web:779879326b1992a33953e9",
};

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('❌ Firebase initialization failed:', error.message);
}

export { app, db, auth };
