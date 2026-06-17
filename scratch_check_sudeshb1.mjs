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

async function checkUser() {
  const docRef = doc(db, 'users', 'USER_MP4X25PM_NEW_E1A0X63GF');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("User details:", docSnap.data());
  } else {
    console.log("No such user document!");
  }
  process.exit(0);
}

checkUser().catch(console.error);
