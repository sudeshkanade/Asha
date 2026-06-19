import fs from 'fs';

const data = JSON.parse(fs.readFileSync('firebase_export.json', 'utf8'));

const users = data.collections.users || {};
let foundAnm = null;
let foundMo = null;

for (const userId in users) {
  const user = users[userId];
  if (user.role === 'ANM' && !foundAnm) {
    foundAnm = user;
  }
  if (user.role === 'MO' && !foundMo) {
    foundMo = user;
  }
  if (foundAnm && foundMo) break;
}

console.log('ANM User:', foundAnm ? { phone: foundAnm.phone, pin: foundAnm.pin, name: foundAnm.name } : 'Not found');
console.log('MO User:', foundMo ? { phone: foundMo.phone, pin: foundMo.pin, name: foundMo.name } : 'Not found');
