import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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

async function fixDeletions() {
  console.log("Starting script to fix incorrectly deleted Excel records...");
  
  const currentTimestamp = Date.now();
  let totalFixedMembers = 0;
  let totalFixedFamilies = 0;

  // 1. Fix Members
  console.log("\nFetching members...");
  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);
  let memberBatch = writeBatch(db);
  let memberOpCount = 0;

  membersSnap.forEach(d => {
    const m = d.data();
    const isAsha = m.id && typeof m.id === 'string' && m.id.toUpperCase().startsWith('MEM_');
    
    // Target Excel uploads that are marked as deleted but have Active status
    if (!isAsha && m.deleted === true && m.status === 'Active') {
      const docRef = doc(db, 'members', d.id);
      memberBatch.update(docRef, {
        deleted: false,
        lastUpdatedAt: currentTimestamp // Force delta sync to pick this up
      });
      memberOpCount++;
      totalFixedMembers++;
    }
  });

  if (memberOpCount > 0) {
    await memberBatch.commit();
    console.log(`Successfully restored ${totalFixedMembers} members.`);
  } else {
    console.log("No members needed restoring.");
  }

  // 2. Fix Families
  console.log("\nFetching families...");
  const familiesRef = collection(db, 'families');
  const familiesSnap = await getDocs(familiesRef);
  let familyBatch = writeBatch(db);
  let familyOpCount = 0;

  familiesSnap.forEach(d => {
    const f = d.data();
    const isAsha = f.id && typeof f.id === 'string' && f.id.toUpperCase().startsWith('FAM_');
    
    // Target Excel uploads that are marked as deleted
    if (!isAsha && f.deleted === true && f.status === 'Active') {
      const docRef = doc(db, 'families', d.id);
      familyBatch.update(docRef, {
        deleted: false,
        lastUpdatedAt: currentTimestamp // Force delta sync to pick this up
      });
      familyOpCount++;
      totalFixedFamilies++;
    }
  });

  if (familyOpCount > 0) {
    await familyBatch.commit();
    console.log(`Successfully restored ${totalFixedFamilies} families.`);
  } else {
    console.log("No families needed restoring.");
  }

  console.log(`\nDone! A total of ${totalFixedMembers} members and ${totalFixedFamilies} families have been restored.`);
}

fixDeletions().catch(console.error).finally(() => process.exit(0));
