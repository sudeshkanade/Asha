import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function auditVillage() {
  const villagesRef = collection(db, 'villages');
  const villagesSnap = await getDocs(villagesRef);
  let targetVillageId = null;
  let targetVillageName = null;

  villagesSnap.forEach(d => {
    const v = d.data();
    if (v.name && v.name.toLowerCase().includes('buzawade 1')) {
      targetVillageId = d.id;
      targetVillageName = v.name;
    }
  });

  if (!targetVillageId) {
    console.log("Could not find village matching 'buzawade 1'");
    return;
  }

  console.log(`Found Village: ${targetVillageName} (ID: ${targetVillageId})`);

  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);
  
  let totalInVillage = 0;
  let activeInVillage = 0;
  let deletedInVillage = 0;
  let withFamily = 0;
  let withoutFamily = 0;
  let excelUploads = 0;
  let ashaUploads = 0;

  const sampleMissingFamily = [];

  membersSnap.forEach(d => {
    const m = d.data();
    if (m.villageId === targetVillageId) {
      totalInVillage++;
      
      if (m.deleted === true) {
        deletedInVillage++;
      } else {
        activeInVillage++;
        
        const isAsha = m.id && typeof m.id === 'string' && m.id.toUpperCase().startsWith('MEM_');
        if (isAsha) ashaUploads++;
        else excelUploads++;

        if (m.familyId) {
            withFamily++;
        } else {
            withoutFamily++;
            if (sampleMissingFamily.length < 3) {
                sampleMissingFamily.push(m);
            }
        }
      }
    }
  });

  console.log(`\n=== MEMBERS IN ${targetVillageName} ===`);
  console.log(`Total Records: ${totalInVillage}`);
  console.log(`Active Records (Not deleted): ${activeInVillage}`);
  console.log(`Deleted Records (Hidden in app): ${deletedInVillage}`);
  console.log(`\n--- ACTIVE BREAKDOWN ---`);
  console.log(`ASHA Uploads: ${ashaUploads}`);
  console.log(`Excel Uploads: ${excelUploads}`);
  console.log(`With familyId: ${withFamily}`);
  console.log(`Missing familyId: ${withoutFamily}`);

  if (withoutFamily > 0) {
    console.log(`\n--- SAMPLE ACTIVE MEMBER WITH NO FAMILY ID ---`);
    console.log(JSON.stringify(sampleMissingFamily[0], null, 2));
  }
}

auditVillage().catch(console.error).finally(() => process.exit(0));
