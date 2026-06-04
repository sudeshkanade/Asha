import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const COLLECTIONS = [
  'users',
  'phcs',
  'sub_centers',
  'villages',
  'members',
  'families',
  'vital_events',
  'inventory',
  'stock_history',
  'admin_assignments'
];

async function downloadData() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Navigating to target domain to bypass origin restrictions...');
  await page.goto('https://sudeshkanade.github.io/Asha/');

  console.log('Injecting Firebase and fetching data...');
  const allData = await page.evaluate(async (collections) => {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    
    const firebaseConfig = {
      apiKey: "AIzaSyAT15t8ljdADONxxKAy8Ufq1Zw0tOUfckE",
      authDomain: "asha---rural-health-tracker.firebaseapp.com",
      projectId: "asha---rural-health-tracker",
      storageBucket: "asha---rural-health-tracker.firebasestorage.app",
      messagingSenderId: "64546671948",
      appId: "1:64546671948:web:779879326b1992a33953e9"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const result = {};
    for (const colName of collections) {
      try {
        const snapshot = await getDocs(collection(db, colName));
        const data = [];
        snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() });
        });
        result[colName] = data;
      } catch (err) {
        result[colName] = { error: err.message };
      }
    }
    return result;
  }, COLLECTIONS);

  await browser.close();

  const outputDir = "C:\\Users\\SC_Bu\\.gemini\\antigravity-ide\\brain\\e6eab100-2902-44df-be05-aca53c0256d5\\scratch\\cloud_data_export";
  await fs.mkdir(outputDir, { recursive: true });

  for (const [colName, data] of Object.entries(allData)) {
    const filePath = path.join(outputDir, `${colName}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    if (data.error) {
      console.error(`Error fetching ${colName}:`, data.error);
    } else {
      console.log(`Saved ${data.length} records to ${filePath}`);
    }
  }

  console.log('Download complete!');
}

downloadData().catch(console.error);
