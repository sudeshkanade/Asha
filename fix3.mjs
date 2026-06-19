import fs from 'fs';
const v = fs.readFileSync('d:/App/src/screens/VitalEventsScreen.jsx', 'utf-8');
const vLines = v.split('\n');
vLines.forEach((l, i) => { if (l.includes('assigned.map')) console.log('L' + i + ': ' + l.trim()); });
