import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace with your Firebase project configuration
// Keep these details secure in production (e.g. env variables)
const firebaseConfig = {
  apiKey: "AIzaSyAT15tB1jdADDNxxKAy8Ufq1Zw0tOUfckE",
  authDomain: "asha---rural-health-tracker.firebaseapp.com",
  projectId: "asha---rural-health-tracker",
  storageBucket: "asha---rural-health-tracker.firebasestorage.app",
  messagingSenderId: "64546671948",
  appId: "1:64546671948:web:779879326b1992a33953e9"
};

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.warn("Firebase initialization failed:", error.message);
}

export { app, db, auth };
