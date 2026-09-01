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

async function checkMemberFamilies() {
  const targetVillageId = 'v_1777883667091';

  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('villageId', '==', targetVillageId));
  const membersSnap = await getDocs(q);

  let noFamilyCount = 0;
  let hasFamilyCount = 0;
  let familyCounts = {};

  membersSnap.forEach(d => {
      const m = d.data();
      if (!m.familyId || m.familyId.trim() === '') {
          noFamilyCount++;
      } else {
          hasFamilyCount++;
          familyCounts[m.familyId] = (familyCounts[m.familyId] || 0) + 1;
      }
  });

  console.log(`Buzawade 1 Members (Total: ${membersSnap.size}):`);
  console.log(`With Family ID: ${hasFamilyCount}`);
  console.log(`Without Family ID: ${noFamilyCount}`);
  console.log(`Family Distribution:`, familyCounts);
}

checkMemberFamilies().catch(console.error).finally(() => process.exit(0));
