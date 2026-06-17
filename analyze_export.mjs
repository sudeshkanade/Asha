import fs from 'fs/promises';

async function analyze() {
  const data = JSON.parse(await fs.readFile('firebase_export.json', 'utf-8'));
  const members = data.members || [];
  const families = data.families || [];
  
  console.log(`Analyzing ${members.length} members and ${families.length} families...\n`);

  let membersWithoutFamily = 0;
  let membersWithoutVillage = 0;
  let membersWithoutAsha = 0;
  let membersWithInvalidAge = 0;
  let membersWithInvalidDob = 0;

  for (const m of members) {
    if (!m.familyId) membersWithoutFamily++;
    if (!m.villageId) membersWithoutVillage++;
    if (!m.ashaId) membersWithoutAsha++;
    if (m.age === undefined || m.age === null || isNaN(m.age) || m.age < 0 || m.age > 120) membersWithInvalidAge++;
    if (!m.dob || m.dob === 'NaN-NaN-NaN' || m.dob === 'undefined-undefined-undefined') membersWithInvalidDob++;
  }

  console.log('--- MEMBER DISCREPANCIES ---');
  console.log(`Without familyId: ${membersWithoutFamily}`);
  console.log(`Without villageId: ${membersWithoutVillage}`);
  console.log(`Without ashaId: ${membersWithoutAsha}`);
  console.log(`Invalid/Missing Age: ${membersWithInvalidAge}`);
  console.log(`Invalid/Missing DOB: ${membersWithInvalidDob}`);

  let familiesWithoutHead = 0;
  let familiesWithoutVillage = 0;

  for (const f of families) {
    if (!f.headName) familiesWithoutHead++;
    if (!f.villageId) familiesWithoutVillage++;
  }

  console.log('\n--- FAMILY DISCREPANCIES ---');
  console.log(`Without headName: ${familiesWithoutHead}`);
  console.log(`Without villageId: ${familiesWithoutVillage}`);

  // Missing family ids check
  const familyIds = new Set(families.map(f => f.id));
  let orphanedMembers = 0;
  for (const m of members) {
    if (m.familyId && !familyIds.has(m.familyId)) orphanedMembers++;
  }
  console.log(`\nOrphaned Members (familyId doesn't exist): ${orphanedMembers}`);
}

analyze().catch(console.error);
