const xlsx = require('xlsx');

try {
  console.log("Reading PHC_Family_Survey_System.xlsx...");
  const workbook = xlsx.readFile('D:/New folder/PHC_Family_Survey_System.xlsx');
  console.log("Sheet names:", workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Total rows: ${data.length}`);
    console.log("First 5 rows preview:");
    data.slice(0, 5).forEach((row, i) => {
      console.log(`  Row ${i + 1}:`, row.slice(0, 8));
    });
  });
} catch (e) {
  console.error("Error reading file:", e);
}
