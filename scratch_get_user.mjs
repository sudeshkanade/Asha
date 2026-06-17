import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function getUser() {
  const docRef = doc(db, 'users', 'USER_MP4X5F9F_NEW_CP1938IB8');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("User details:", docSnap.data());
  } else {
    console.log("No such document!");
  }
}

getUser().catch(console.error);
