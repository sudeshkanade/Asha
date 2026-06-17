import fs from 'fs/promises';

const newTranslations = {
  "en": {
    "widowed": "Widowed",
    "divorced": "Divorced",
    "illiterate": "Illiterate",
    "primary": "Primary",
    "secondary": "Secondary",
    "highersecondary": "Higher Secondary",
    "graduate": "Graduate",
    "postgraduate": "Post Graduate",
    "pwdStatus": "PwD Status",
    "migrantStatus": "Migrant Status",
    "isPregnantAnc": "Is Currently Pregnant? (ANC)"
  },
  "mr": {
    "widowed": "विधवा / विदुर",
    "divorced": "घटस्फोटित",
    "illiterate": "निरक्षर",
    "primary": "प्राथमिक",
    "secondary": "माध्यमिक",
    "highersecondary": "उच्च माध्यमिक",
    "graduate": "पदवीधर",
    "postgraduate": "पदव्युत्तर",
    "pwdStatus": "अपंगत्व (PwD) स्थिती",
    "migrantStatus": "स्थलांतरित स्थिती",
    "isPregnantAnc": "सध्या गरोदर आहे का? (ANC)"
  }
};

async function updateTranslations() {
  const fileContent = await fs.readFile('src/locales/translations.js', 'utf-8');

  let updated = fileContent;

  const enAdditions = Object.entries(newTranslations.en).map(([k, v]) => `"${k}": "${v}"`).join(',\n      ');
  updated = updated.replace(/("goshwaraAbstract": "Goshwara Abstract",?)/, `$1\n      ${enAdditions},`);

  const mrAdditions = Object.entries(newTranslations.mr).map(([k, v]) => `"${k}": "${v}"`).join(',\n      ');
  updated = updated.replace(/("goshwaraAbstract": "गोषवारा गोषवारा",?)/, `$1\n      ${mrAdditions},`);

  await fs.writeFile('src/locales/translations.js', updated);
  console.log('Final batch of translations updated!');
}

updateTranslations().catch(console.error);
