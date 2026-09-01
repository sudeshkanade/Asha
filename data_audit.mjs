import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

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

async function analyzeData() {
  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);
  let members = [];
  membersSnap.forEach(d => members.push({ _docId: d.id, ...d.data() }));

  const phcsRef = collection(db, 'phcs');
  const phcsSnap = await getDocs(phcsRef);
  const validPhcs = new Set();
  phcsSnap.forEach(d => validPhcs.add(d.id));

  const subCentersRef = collection(db, 'sub_centers');
  const scSnap = await getDocs(subCentersRef);
  const validScs = new Set();
  scSnap.forEach(d => validScs.add(d.id));

  const villagesRef = collection(db, 'villages');
  const villagesSnap = await getDocs(villagesRef);
  const validVillages = new Set();
  villagesSnap.forEach(d => validVillages.add(d.id));

  let ashaCount = 0;
  let excelCount = 0;
  
  let excelActive = 0;
  let excelMissingHealthData = 0;
  let excelInvalidPhc = 0;
  let excelInvalidSc = 0;
  let excelInvalidVillage = 0;

  let ashaActive = 0;

  members.forEach(m => {
    const isAsha = m.id && typeof m.id === 'string' && m.id.toUpperCase().startsWith('MEM_');
    const isActive = m.deleted !== true;
    
    if (isAsha) {
        ashaCount++;
        if (isActive) ashaActive++;
    } else {
        excelCount++;
        if (isActive) {
            excelActive++;
            if (!m.healthData) excelMissingHealthData++;
            if (!validPhcs.has(m.phcId)) excelInvalidPhc++;
            if (!validScs.has(m.subCenterId)) excelInvalidSc++;
            if (!validVillages.has(m.villageId)) excelInvalidVillage++;
        }
    }
  });

  const report = `
=== DATA ANALYSIS ===
Total Members: ${members.length}
Valid PHCs in DB: ${validPhcs.size}
Valid SubCenters in DB: ${validScs.size}
Valid Villages in DB: ${validVillages.size}

ASHA UPLOADS:
- Total: ${ashaCount}
- Active: ${ashaActive}
- Deleted: ${ashaCount - ashaActive}

EXCEL UPLOADS:
- Total: ${excelCount}
- Active: ${excelActive}
- Deleted: ${excelCount - excelActive}

EXCEL DATA ISSUES (Active only):
- Missing healthData object: ${excelMissingHealthData} (Will cause UI crashes or missing clinical details)
- Invalid PHC ID: ${excelInvalidPhc} (Won't show up for Medical Officers)
- Invalid SubCenter ID: ${excelInvalidSc} (Won't show up for ANMs)
- Invalid Village ID: ${excelInvalidVillage} (Won't show up for ASHAs)
  `;

  console.log(report);
  fs.writeFileSync('c:/Users/Sudesh/Health Tracker/analysis_report.txt', report);
}

analyzeData().catch(console.error).finally(() => process.exit(0));
