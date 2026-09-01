import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function fixRecoveryFam() {
  const famId = 'RECOVERY_FAM_USER_MP4X5F9F_NEW_CP1938IB8';
  const famRef = doc(db, 'families', famId);
  
  await updateDoc(famRef, {
    villageId: 'v_1777883667091',
    headName: 'Recovered Members (Buzawade 1)',
    lastUpdatedAt: Date.now()
  });
  console.log("Fixed recovery family!");
}

fixRecoveryFam().catch(console.error).finally(() => process.exit(0));
