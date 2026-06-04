const fs = require('fs');

const members = JSON.parse(fs.readFileSync('C:/Users/SC_Bu/.gemini/antigravity-ide/brain/e6eab100-2902-44df-be05-aca53c0256d5/scratch/cloud_data_export/members.json', 'utf8'));
const families = JSON.parse(fs.readFileSync('C:/Users/SC_Bu/.gemini/antigravity-ide/brain/e6eab100-2902-44df-be05-aca53c0256d5/scratch/cloud_data_export/families.json', 'utf8'));

console.log(`Total Members: ${members.length}`);
console.log(`Total Families: ${families.length}`);

let issues = {
    missingFamily: 0,
    missingVillage: 0,
    invalidPhone: 0,
    lowercaseNames: 0,
    invalidDob: 0,
    invalidAge: 0,
    invalidGender: 0,
    badRelationships: 0,
    invalidMaritalStatus: 0
};

members.forEach(m => {
    if (!m.familyId) issues.missingFamily++;
    if (!m.villageId) issues.missingVillage++;
    
    // Check phone issues (length !== 10 or non-numeric)
    if (m.phone && !/^\d{10}$/.test(m.phone)) issues.invalidPhone++;
    else if (m.mobile && !/^\d{10}$/.test(m.mobile)) issues.invalidPhone++;
    
    // Check capitalization issues
    if (m.firstName && m.firstName[0] !== m.firstName[0].toUpperCase()) issues.lowercaseNames++;
    if (m.lastName && m.lastName[0] !== m.lastName[0].toUpperCase()) issues.lowercaseNames++;
    
    // Check DOB
    if (m.dob && !/^\d{4}-\d{2}-\d{2}$/.test(m.dob) && !/^\d{2}\/\d{2}\/\d{4}$/.test(m.dob)) issues.invalidDob++;
    
    // Check Age
    if (m.age === undefined || m.age === null || isNaN(parseInt(m.age))) issues.invalidAge++;
    
    // Check Gender
    if (m.gender !== 'Male' && m.gender !== 'Female' && m.gender !== 'Other') issues.invalidGender++;
    
    // Check Marital Status
    if (m.maritalStatus !== 'Married' && m.maritalStatus !== 'Unmarried' && m.maritalStatus !== 'Widowed' && m.maritalStatus !== 'Divorced') issues.invalidMaritalStatus++;
});

console.log("\n--- MEMBER ISSUES ---");
console.log(issues);

let familyIssues = {
    missingVillage: 0,
    invalidHouseNo: 0,
    lowercaseNames: 0
};

families.forEach(f => {
    if (!f.villageId) familyIssues.missingVillage++;
    if (!f.houseNo) familyIssues.invalidHouseNo++;
    if (f.headName && f.headName[0] !== f.headName[0].toUpperCase()) familyIssues.lowercaseNames++;
});

console.log("\n--- FAMILY ISSUES ---");
console.log(familyIssues);

// Print some examples of invalid gender/marital status/dob
console.log("\nExamples of invalid gender:");
console.log([...new Set(members.filter(m => m.gender !== 'Male' && m.gender !== 'Female' && m.gender !== 'Other').map(m => m.gender))]);

console.log("\nExamples of invalid marital status:");
console.log([...new Set(members.filter(m => m.maritalStatus !== 'Married' && m.maritalStatus !== 'Unmarried' && m.maritalStatus !== 'Widowed' && m.maritalStatus !== 'Divorced').map(m => m.maritalStatus))]);

console.log("\nExamples of invalid dob:");
console.log([...new Set(members.filter(m => m.dob && !/^\d{4}-\d{2}-\d{2}$/.test(m.dob) && !/^\d{2}\/\d{2}\/\d{4}$/.test(m.dob)).map(m => m.dob))].slice(0, 10));

console.log("\nExamples of phone issues:");
console.log(members.filter(m => (m.phone && !/^\d{10}$/.test(m.phone)) || (m.mobile && !/^\d{10}$/.test(m.mobile))).map(m => m.phone || m.mobile).slice(0, 10));
