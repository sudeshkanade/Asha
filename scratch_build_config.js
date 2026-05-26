const fs = require('fs');

try {
  console.log("Parsing generate_survey_sheets.js for FP_INDICATORS...");
  const surveyCode = fs.readFileSync('D:/New folder/generate_survey_sheets.js', 'utf8');
  
  // Extract FP_INDICATORS array
  const fpStart = surveyCode.indexOf('const FP_INDICATORS = [');
  const fpEnd = surveyCode.indexOf('];', fpStart) + 2;
  const fpIndicatorsStr = surveyCode.substring(fpStart, fpEnd);
  
  console.log("Parsing generate_phc_workbook.js for REPORTS_CONFIG and INDICATOR_TARGETS...");
  const phcCode = fs.readFileSync('D:/New folder/generate_phc_workbook.js', 'utf8');
  
  // Extract INDICATOR_TARGETS
  const targetsStart = phcCode.indexOf('const INDICATOR_TARGETS = {');
  const targetsEnd = phcCode.indexOf('};', targetsStart) + 2;
  const targetsStr = phcCode.substring(targetsStart, targetsEnd);
  
  // Extract REPORTS_CONFIG
  const reportsStart = phcCode.indexOf('const REPORTS_CONFIG = [');
  const reportsEnd = phcCode.indexOf('];', reportsStart) + 2;
  const reportsStr = phcCode.substring(reportsStart, reportsEnd);
  
  // Compile into goshwaraConfig.js
  const configModuleContent = `// Auto-generated from official source templates in D:/New folder
// Do not modify manually.

export ${fpIndicatorsStr}

export ${targetsStr}

export ${reportsStr}

// Extract unique parameters for Monthly Report formula indexing
export const uniqueParams = [];
REPORTS_CONFIG.forEach(report => {
  report.params.forEach(p => {
    if (!uniqueParams.includes(p)) {
      uniqueParams.push(p);
    }
  });
});
`;
  
  fs.writeFileSync('src/utils/goshwaraConfig.js', configModuleContent);
  console.log("✅ Successfully created src/utils/goshwaraConfig.js!");
} catch (e) {
  console.error("Error creating goshwaraConfig.js:", e);
}
