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

async function analyzeFamilies() {
  const familiesRef = collection(db, 'families');
  const familiesSnap = await getDocs(familiesRef);
  let families = [];
  familiesSnap.forEach(d => families.push({ _docId: d.id, ...d.data() }));

  let ashaCount = 0;
  let excelCount = 0;
  
  let excelActive = 0;
  let ashaActive = 0;

  families.forEach(f => {
    const isAsha = f.id && typeof f.id === 'string' && f.id.toUpperCase().startsWith('FAM_');
    const isActive = f.deleted !== true;
    
    if (isAsha) {
        ashaCount++;
        if (isActive) ashaActive++;
    } else {
        excelCount++;
        if (isActive) excelActive++;
    }
  });

  console.log(`\n=== FAMILIES ===`);
  console.log(`ASHA UPLOADS: Total=${ashaCount}, Active=${ashaActive}, Deleted=${ashaCount - ashaActive}`);
  console.log(`EXCEL UPLOADS: Total=${excelCount}, Active=${excelActive}, Deleted=${excelCount - excelActive}`);
}

analyzeFamilies().catch(console.error).finally(() => process.exit(0));
