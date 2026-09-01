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

async function checkFamilies() {
  const targetVillageId = 'v_1777883667091';

  const familiesRef = collection(db, 'families');
  const familiesSnap = await getDocs(familiesRef);

  let famCount = 0;
  let wrongVillage = 0;
  let rightVillage = 0;

  // Let's first get all members in Buzawade 1
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('villageId', '==', targetVillageId));
  const membersSnap = await getDocs(q);

  let familyIdsInBuz1 = new Set();
  membersSnap.forEach(d => {
      const m = d.data();
      if (m.familyId) familyIdsInBuz1.add(m.familyId);
  });

  console.log(`Buzawade 1 members belong to ${familyIdsInBuz1.size} unique family IDs.`);

  familiesSnap.forEach(d => {
    const f = d.data();
    if (familyIdsInBuz1.has(d.id)) {
        famCount++;
        if (f.villageId !== targetVillageId) {
            wrongVillage++;
        } else {
            rightVillage++;
        }
    }
  });

  console.log(`Of those ${familyIdsInBuz1.size} families:`);
  console.log(`Found in DB: ${famCount}`);
  console.log(`Matched villageId (v_1777883667091): ${rightVillage}`);
  console.log(`Mismatched villageId: ${wrongVillage}`);
}

checkFamilies().catch(console.error).finally(() => process.exit(0));
