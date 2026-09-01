import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function checkSize() {
  const targetVillageId = 'v_1777883667091';
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('villageId', '==', targetVillageId));
  const membersSnap = await getDocs(q);

  let members = [];
  membersSnap.forEach(d => {
    if (d.data().deleted !== true) {
        members.push({ id: d.id, ...d.data() });
    }
  });

  const jsonString = JSON.stringify(members);
  const sizeKB = jsonString.length / 1024;
  const sizeMB = sizeKB / 1024;

  console.log(`Total Members Array Size: ${sizeKB.toFixed(2)} KB (${sizeMB.toFixed(2)} MB)`);
}

checkSize().catch(console.error).finally(() => process.exit(0));
