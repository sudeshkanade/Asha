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

async function checkBuzawade1Members() {
  const targetVillageId = 'v_1777883667091';

  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('villageId', '==', targetVillageId));
  const membersSnap = await getDocs(q);

  let total = 0;
  let activeAndNotDeleted = 0;
  let deletedTrue = 0;
  let statusNotActive = 0;
  
  let ashaIdsMap = {};

  membersSnap.forEach(d => {
    total++;
    const m = d.data();
    
    if (m.deleted === true) deletedTrue++;
    if (m.status !== 'Active') statusNotActive++;
    
    if (m.deleted !== true && m.status === 'Active') {
        activeAndNotDeleted++;
    }

    if (m.ashaId) {
        ashaIdsMap[m.ashaId] = (ashaIdsMap[m.ashaId] || 0) + 1;
    }
  });

  console.log(`\n=== BUZAWADE 1 MEMBERS ===`);
  console.log(`Total Records: ${total}`);
  console.log(`Active & Not Deleted (Should show in app): ${activeAndNotDeleted}`);
  console.log(`Marked as Deleted: ${deletedTrue}`);
  console.log(`Status != Active: ${statusNotActive}`);
  
  console.log("\nAssigned ASHAs for these members:");
  console.log(ashaIdsMap);
}

checkBuzawade1Members().catch(console.error).finally(() => process.exit(0));
