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

async function checkPhcId() {
  const targetVillageId = 'v_1777883667091';

  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('villageId', '==', targetVillageId));
  const membersSnap = await getDocs(q);

  let phcIds = {};
  membersSnap.forEach(d => {
    const p = d.data().phcId || 'NO_PHC_ID';
    phcIds[p] = (phcIds[p] || 0) + 1;
  });

  console.log("PHC IDs for Buzawade 1 members:");
  console.log(phcIds);
}

checkPhcId().catch(console.error).finally(() => process.exit(0));
