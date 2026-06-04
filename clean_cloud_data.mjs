import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// 1. Initialize Firebase
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

// Helper to Title Case names
function toTitleCase(str) {
  if (!str || str === 'N/A') return '';
  return str.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Helper to fix phone numbers
function fixPhone(phone) {
  if (!phone || phone === 'N/A') return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.substring(2);
  return ''; // If it's 9 digits or less, we can't trust it. Blank is better for validation.
}

async function cleanData() {
  console.log("Starting Data Cleanup...");
  
  // 1. Fetch Members
  const membersRef = collection(db, 'members');
  const membersSnap = await getDocs(membersRef);
  let members = [];
  membersSnap.forEach(d => members.push({ id: d.id, ...d.data() }));
  
  console.log(`Fetched ${members.length} members for cleanup.`);
  
  let batch = writeBatch(db);
  let opCount = 0;
  let totalFixed = 0;
  
  for (let m of members) {
    let needsUpdate = false;
    let updates = {};
    
    // Fix Names
    if (m.firstName) {
      const fixed = toTitleCase(m.firstName);
      if (fixed !== m.firstName) { updates.firstName = fixed; needsUpdate = true; }
    }
    if (m.lastName) {
      const fixed = toTitleCase(m.lastName);
      if (fixed !== m.lastName) { updates.lastName = fixed; needsUpdate = true; }
    }
    if (m.middleName) {
      const fixed = toTitleCase(m.middleName);
      if (fixed !== m.middleName) { updates.middleName = fixed; needsUpdate = true; }
    }
    
    // Fix Phone
    const p = m.phone || m.mobile;
    if (p) {
        const fixedPhone = fixPhone(p);
        if (fixedPhone !== m.phone) { updates.phone = fixedPhone; updates.mobile = fixedPhone; needsUpdate = true; }
    }
    
    // Fix Gender
    if (m.gender) {
      let g = m.gender.trim().toLowerCase();
      let fixedG = m.gender;
      if (g === 'm' || g === 'male') fixedG = 'Male';
      else if (g === 'f' || g === 'female') fixedG = 'Female';
      else if (g === 'n/a' || g === '') fixedG = 'Other';
      
      if (fixedG !== m.gender) { updates.gender = fixedG; needsUpdate = true; }
    }
    
    // Fix Marital Status
    if (m.maritalStatus) {
      let s = m.maritalStatus.trim().toLowerCase();
      let fixedS = m.maritalStatus;
      if (s === 'married') fixedS = 'Married';
      else if (s === 'unmarried') fixedS = 'Unmarried';
      else if (s === 'widowed') fixedS = 'Widowed';
      else if (s === 'divorced') fixedS = 'Divorced';
      else if (s === 'n/a' || s === '') fixedS = 'Unmarried'; // Default for minors/unknown
      
      if (fixedS !== m.maritalStatus) { updates.maritalStatus = fixedS; needsUpdate = true; }
    }
    
    // Fix DOB and Age 'N/A'
    if (m.dob === 'N/A') { updates.dob = ''; needsUpdate = true; }
    if (m.age === 'N/A') { updates.age = ''; needsUpdate = true; }
    
    if (needsUpdate) {
      const docRef = doc(db, 'members', m.id);
      batch.update(docRef, updates);
      opCount++;
      totalFixed++;
      
      if (opCount === 450) { // Firestore batch limit is 500
        await batch.commit();
        console.log(`Committed batch of ${opCount} member updates...`);
        batch = writeBatch(db);
        opCount = 0;
      }
    }
  }
  
  if (opCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opCount} member updates.`);
  }
  
  console.log(`\nFinished checking members. Fixed ${totalFixed} members.`);
  
  // 2. Fetch Families
  console.log("\nFetching Families...");
  const familiesRef = collection(db, 'families');
  const familiesSnap = await getDocs(familiesRef);
  let families = [];
  familiesSnap.forEach(d => families.push({ id: d.id, ...d.data() }));
  
  batch = writeBatch(db);
  opCount = 0;
  totalFixed = 0;
  
  for (let f of families) {
    let needsUpdate = false;
    let updates = {};
    
    if (f.headName) {
      const fixed = toTitleCase(f.headName);
      if (fixed !== f.headName) { updates.headName = fixed; needsUpdate = true; }
    }
    
    if (needsUpdate) {
      const docRef = doc(db, 'families', f.id);
      batch.update(docRef, updates);
      opCount++;
      totalFixed++;
      
      if (opCount === 450) {
        await batch.commit();
        console.log(`Committed batch of ${opCount} family updates...`);
        batch = writeBatch(db);
        opCount = 0;
      }
    }
  }
  
  if (opCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opCount} family updates.`);
  }
  
  console.log(`\nFinished checking families. Fixed ${totalFixed} families.`);
  console.log("Cleanup Script Complete!");
}

cleanData().catch(console.error);
