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

async function inspectNewAnc() {
  const membersSnap = await getDocs(collection(db, 'members'));
  const villagesSnap = await getDocs(collection(db, 'villages'));

  const members = [];
  membersSnap.forEach(d => members.push({ id: d.id, ...d.data() }));

  const villages = [];
  villagesSnap.forEach(d => villages.push({ id: d.id, ...d.data() }));

  const newAncMembers = members.filter(m => 
    m.healthData?.isPregnant || 
    m.healthData?.edd || 
    m.healthData?.ancStatus === 'active' || 
    m.healthData?.ancStatus === 'registered'
  );

  console.log(`Global NEW_ANC members count: ${newAncMembers.length}`);
  
  newAncMembers.forEach((m, idx) => {
    const v = villages.find(vil => vil.id === m.villageId);
    console.log(`- Member ${idx+1}: Name: ${m.firstName} ${m.lastName}, Age: ${m.age}, Village: ${v ? v.name : 'Unknown'} (${m.villageId}), ashaId: ${m.ashaId}`);
  });

  process.exit(0);
}

inspectNewAnc().catch(console.error);
