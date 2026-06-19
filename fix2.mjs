import fs from 'fs';
import path from 'path';

const dir = 'd:/App/src/screens';
const targets = ['FamilyRegistrationScreen.jsx', 'DashboardScreen.jsx', 'MPRReportScreen.jsx', 'VitalEventsScreen.jsx'];

targets.forEach(t => {
  const p = path.join(dir, t);
  const content = fs.readFileSync(p, 'utf-8');
  const lines = content.split('\n');
  console.log('\n=== ' + t + ' ===');
  for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('assigned.map')) {
       for (let j=i-5; j<i+15; j++) {
         console.log(lines[j]);
       }
       break;
    }
  }
});
