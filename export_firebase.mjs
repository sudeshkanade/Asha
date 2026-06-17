import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs/promises';

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

const COLLECTIONS = [
  'users', 'members', 'families', 'vital_events', 'vhnd_sessions', 'locked_periods', 'tasks', 'task_completions'
];

async function exportData() {
  console.log('Starting export...');
  const data = {};
  for (const colName of COLLECTIONS) {
    console.log(`Fetching ${colName}...`);
    try {
      const snap = await getDocs(collection(db, colName));
      data[colName] = [];
      snap.forEach(doc => {
        data[colName].push({ id: doc.id, ...doc.data() });
      });
      console.log(`Fetched ${data[colName].length} documents from ${colName}`);
    } catch (e) {
      console.error(`Error fetching ${colName}:`, e);
    }
  }

  await fs.writeFile('firebase_export.json', JSON.stringify(data, null, 2));
  console.log('Export complete! Saved to firebase_export.json');
}

exportData().catch(console.error);
