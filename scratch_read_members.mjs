import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

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

async function inspectMembers() {
  console.log("Fetching up to 20 members from Firestore...");
  const q = query(collection(db, 'members'), limit(20));
  const snapshot = await getDocs(q);
  const members = [];
  snapshot.forEach(doc => {
    members.push({ id: doc.id, ...doc.data() });
  });
  console.log(`Fetched ${members.length} members.`);
  members.forEach((m, idx) => {
    console.log(`\n--- Member ${idx + 1}: ${m.firstName} ${m.lastName} (Age: ${m.age}, Gender: ${m.gender}, Status: ${m.status}) ---`);
    console.log(`  ashaId: ${m.ashaId}, villageId: ${m.villageId}, subCenterId: ${m.subCenterId}, phcId: ${m.phcId}`);
    console.log(`  healthData:`, JSON.stringify(m.healthData));
    console.log(`  isPregnant (root): ${m.isPregnant}, isHighRisk (root): ${m.isHighRisk}`);
    console.log(`  isPwd: ${m.isPwd}, bplStatus: ${m.bplStatus}`);
  });
  process.exit(0);
}

inspectMembers().catch(err => {
  console.error(err);
  process.exit(1);
});
