import fs from 'fs';
import path from 'path';
const fPath = path.join(process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share'), '../Local/RuralHealthTracker/families.json');
try {
  const data = JSON.parse(fs.readFileSync(fPath, 'utf8'));
  console.log('Families count:', data.length);
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch(e) {
  console.log('Error reading families.json', e.message);
}
