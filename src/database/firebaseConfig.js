import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * BUG-C1 FIX: Firebase credentials are now loaded from environment variables.
 * NEVER hardcode credentials in source code — this file is public on GitHub.
 *
 * Setup: Copy .env.local.example → .env.local and fill in your values.
 * Vite exposes VITE_* variables to the client bundle via import.meta.env.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required env vars are present at startup
const missingVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
  console.error(
    `❌ Firebase: Missing environment variables: ${missingVars.join(', ')}.\n` +
    'Create a .env.local file with your Firebase project credentials.'
  );
}

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully.');
} catch (error) {
  console.warn('❌ Firebase initialization failed:', error.message);
}

export { app, db, auth };

