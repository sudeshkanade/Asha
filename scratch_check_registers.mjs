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

async function checkSpecialRegisters() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const membersSnap = await getDocs(collection(db, 'members'));
  const villagesSnap = await getDocs(collection(db, 'villages'));

  const users = [];
  usersSnap.forEach(d => users.push({ id: d.id, ...d.data() }));

  const members = [];
  membersSnap.forEach(d => members.push({ id: d.id, ...d.data() }));

  const villages = [];
  villagesSnap.forEach(d => villages.push({ id: d.id, ...d.data() }));

  console.log(`Loaded ${users.length} users, ${members.length} members, ${villages.length} villages.`);

  // Find ASHA worker sudeshb1
  const ashaUser = users.find(u => u.username === 'sudeshb1' || u.email === 'surveyteam1994@gmail.com');
  console.log('\nASHA User details:', {
    id: ashaUser?.id,
    name: ashaUser?.name,
    role: ashaUser?.role,
    villageName: ashaUser?.villageName || ashaUser?.village,
    villageId: ashaUser?.villageId,
    assignedVillages: ashaUser?.assignedVillages
  });

  if (!ashaUser) {
    console.log("ASHA User sudeshb1 not found.");
    process.exit(1);
  }

  // Let's compute assignedIds for ashaUser
  const assigned = ashaUser.assignedVillages || [];
  const assignedIds = new Set(assigned.map(v => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return v.id || v.villageId;
    return null;
  }).filter(Boolean));
  if (ashaUser.villageId) assignedIds.add(ashaUser.villageId);

  console.log('Computed assigned village IDs:', Array.from(assignedIds));

  // Let's find villages matching these IDs
  const matchedVillages = villages.filter(v => assignedIds.has(v.id));
  console.log('Matched Villages:', matchedVillages.map(v => `${v.name} (${v.id})`));

  // Filter members for this ASHA
  const scopedMembers = members.filter(m => !m.villageId || m.ashaId === ashaUser.id || assignedIds.has(m.villageId));
  console.log(`Total members scoped for this ASHA: ${scopedMembers.length} (out of ${members.length})`);

  // Let's check how many members match each special register globally AND in ASHA's scope
  const registers = [
    { name: 'HIGH_RISK_ANC', filter: m => m.healthData?.isHighRisk },
    { name: 'NEW_ANC', filter: m => m.healthData?.isPregnant || m.healthData?.edd || m.healthData?.ancStatus === 'active' || m.healthData?.ancStatus === 'registered' },
    { name: 'PNC_CASES', filter: m => m.healthData?.pncStatus === 'Pending' || m.healthData?.pncStatus === 'active' || (m.healthData?.lastDeliveryDate && (new Date() - new Date(m.healthData.lastDeliveryDate)) / (1000 * 60 * 60 * 24) <= 42) },
    { name: 'ELIGIBLE_COUPLE', filter: mem => mem.gender === 'Female' && parseInt(mem.age) >= 15 && parseInt(mem.age) <= 49 && (mem.maritalStatus === 'Married' || mem.relationToHead === 'Wife' || mem.relation === 'Wife' || mem.relationToHead === 'Daughter-in-law' || mem.relation === 'Daughter-in-law') },
    { name: 'SAM_CHILDREN', filter: m => {
        const muac = parseFloat(m.healthData?.muac);
        if (!isNaN(muac) && muac > 0) return muac < 11.5;
        return m.healthData?.malnutritionStatus === 'SAM' || m.healthData?.malnutritionStatus === 'high_risk';
      }
    },
    { name: 'NCD_SCREENING', filter: m => parseInt(m.age) >= 30 && (m.healthData?.bpSystolic || m.healthData?.sugarLevel || m.healthData?.hasNcd) },
    { name: 'PWD', filter: m => m.isPwd },
  ];

  console.log('\n--- REGISTER SUMMARY ---');
  registers.forEach(r => {
    const globalCount = members.filter(r.filter).length;
    const scopedCount = scopedMembers.filter(r.filter).length;
    console.log(`Register: ${r.name.padEnd(20)} | Global: ${String(globalCount).padStart(3)} | Scoped for ASHA: ${String(scopedCount).padStart(3)}`);
  });

  process.exit(0);
}

checkSpecialRegisters().catch(console.error);
