import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function checkBuzawade() {
  const buzawadeIds = [
    'v_1777876170987',
    'v_1777877023142',
    'v_1777877033666',
    'v_1777883667091',
    'v_1777883673467'
  ];

  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);

  let distribution = {};
  buzawadeIds.forEach(id => distribution[id] = 0);

  membersSnap.forEach(d => {
    const m = d.data();
    if (m.villageId && buzawadeIds.includes(m.villageId)) {
        distribution[m.villageId]++;
    }
  });

  console.log("Member counts by Buzawade ID:");
  console.log(`v_1777876170987 (Buzawade): ${distribution['v_1777876170987']}`);
  console.log(`v_1777877023142 (Buzawade): ${distribution['v_1777877023142']}`);
  console.log(`v_1777877033666 (Buzawade): ${distribution['v_1777877033666']}`);
  console.log(`v_1777883667091 (Buzawade1): ${distribution['v_1777883667091']}`);
  console.log(`v_1777883673467 (Buzawade2): ${distribution['v_1777883673467']}`);
}

checkBuzawade().catch(console.error).finally(() => process.exit(0));
