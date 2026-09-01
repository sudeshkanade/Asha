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

async function globalFamilyFix() {
  console.log("Fetching all members to infer missing family locations...");
  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);
  
  // familyId -> { villageId: count, phcId: count, subCenterId: count }
  let famDataMap = {};

  membersSnap.forEach(d => {
      const m = d.data();
      if (m.familyId) {
          if (!famDataMap[m.familyId]) {
              famDataMap[m.familyId] = { villages: {}, phcs: {}, scs: {} };
          }
          if (m.villageId) famDataMap[m.familyId].villages[m.villageId] = (famDataMap[m.familyId].villages[m.villageId] || 0) + 1;
          if (m.phcId) famDataMap[m.familyId].phcs[m.phcId] = (famDataMap[m.familyId].phcs[m.phcId] || 0) + 1;
          if (m.subCenterId) famDataMap[m.familyId].scs[m.subCenterId] = (famDataMap[m.familyId].scs[m.subCenterId] || 0) + 1;
      }
  });

  const getMajority = (countsMap) => {
      let maxKey = null;
      let maxCount = -1;
      for (const [k, v] of Object.entries(countsMap)) {
          if (v > maxCount) {
              maxCount = v;
              maxKey = k;
          }
      }
      return maxKey;
  };

  // Pre-calculate inferred hierarchy for each family
  let inferredHierarchy = {};
  for (const [famId, counts] of Object.entries(famDataMap)) {
      inferredHierarchy[famId] = {
          villageId: getMajority(counts.villages),
          phcId: getMajority(counts.phcs),
          subCenterId: getMajority(counts.scs)
      };
  }

  // Fetch villages mapping to rename recovery families gracefully
  console.log("Fetching villages for naming...");
  const villagesSnap = await getDocs(collection(db, 'villages'));
  let villageNames = {};
  villagesSnap.forEach(d => { villageNames[d.id] = d.data().name || 'Unknown Village'; });

  console.log("Fetching families to apply fixes...");
  const familiesRef = collection(db, 'families');
  const familiesSnap = await getDocs(familiesRef);

  let batch = writeBatch(db);
  let opCount = 0;
  let totalFixed = 0;
  const currentTimestamp = Date.now();

  familiesSnap.forEach(d => {
      const f = d.data();
      let updates = {};
      let needsFix = false;

      // Check if villageId is missing or empty
      if (!f.villageId || f.villageId.trim() === '') {
          const inferred = inferredHierarchy[d.id];
          if (inferred && inferred.villageId) {
              updates.villageId = inferred.villageId;
              if (inferred.phcId) updates.phcId = inferred.phcId;
              if (inferred.subCenterId) updates.subCenterId = inferred.subCenterId;
              needsFix = true;
          }
      }

      // Check if it's a recovery family with a generic name
      if (d.id.startsWith('RECOVERY_FAM_') && (!f.headName || f.headName.includes('System Recovery'))) {
          const finalVillageId = updates.villageId || f.villageId;
          const vName = villageNames[finalVillageId] || 'Unknown Village';
          updates.headName = `Recovered Members (${vName})`;
          needsFix = true;
      }

      if (needsFix) {
          updates.lastUpdatedAt = currentTimestamp;
          batch.update(doc(db, 'families', d.id), updates);
          opCount++;
          totalFixed++;
          
          if (opCount === 450) {
              batch.commit();
              batch = writeBatch(db);
              opCount = 0;
              console.log(`Committed intermediate batch...`);
          }
      }
  });

  if (opCount > 0) {
      await batch.commit();
  }

  console.log(`\nDONE! Scanned all families and fixed ${totalFixed} families globally.`);
}

globalFamilyFix().catch(console.error).finally(() => process.exit(0));
