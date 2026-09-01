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

async function listVillages() {
  const villagesRef = collection(db, 'villages');
  const villagesSnap = await getDocs(villagesRef);
  let allVillages = [];

  villagesSnap.forEach(d => {
    allVillages.push({ id: d.id, name: d.data().name });
  });

  console.log("Villages matching 'buzawade':");
  const matches = allVillages.filter(v => v.name && v.name.toLowerCase().includes('buzawade'));
  matches.forEach(m => console.log(m));

  if (matches.length === 0) {
      console.log("\nAll Villages:");
      allVillages.forEach(m => console.log(m.name));
  }
}

listVillages().catch(console.error).finally(() => process.exit(0));
