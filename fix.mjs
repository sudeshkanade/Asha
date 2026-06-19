import fs from 'fs';
import path from 'path';

const dir = 'd:/App/src/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // We want to see how assignedVillages is mapped
  const match = content.match(/assignedVillages/g);
  if (match) {
    console.log(`\n--- ${file} ---`);
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('assignedVillages')) {
        console.log(`L${i+1}: ${lines[i].trim()}`);
        // print a few lines around it
        for (let j = 1; j <= 5; j++) {
           if (lines[i+j]) console.log(`  ${lines[i+j].trim()}`);
        }
        break; // just show first occurrence of mapping
      }
    }
  }
});
