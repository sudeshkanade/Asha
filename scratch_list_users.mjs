import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBe6IGJ65GlpnmCnPTTbA4_uR9XQcuwZpI",
  authDomain: "asha---rural-health-tracker.firebaseapp.com",
  projectId: "asha---rural-health-tracker",
  storageBucket: "asha---rural-health-tracker.firebasestorage.app",
  messagingSenderId: "64546671948",
  appId: "1:64546671948:web:779879326b1992a33953e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  const users = [];
  snapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });
  users.forEach(u => {
    if (u.password) {
      console.log(`Role: ${u.role}, Username: ${u.username}, Email: ${u.email}, Password: ${u.password}, Status: ${u.approvalStatus}`);
    }
  });
  process.exit(0);
}

listUsers().catch(console.error);
