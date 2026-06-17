import fs from 'fs/promises';

const newTranslations = {
  "en": {
    "month": "Month",
    "year": "Year",
    "village": "Village",
    "families": "Families",
    "pendingSync": "Pending Sync",
    "lowStock": "Low Stock",
    "vitalEvents": "Vital Events",
    "riskLevel": "Risk Level",
    "male": "Male",
    "female": "Female",
    "total": "Total",
    "approvals": "Approvals",
    "outbreaks": "Outbreaks",
    "featureInDev": "This feature is in development."
  },
  "mr": {
    "month": "महिना",
    "year": "वर्ष",
    "village": "गाव",
    "families": "कुटुंबे",
    "pendingSync": "प्रलंबित सिंक",
    "lowStock": "कमी साठा",
    "vitalEvents": "महत्त्वाच्या घटना",
    "riskLevel": "धोक्याची पातळी",
    "male": "पुरुष",
    "female": "स्त्री",
    "total": "एकूण",
    "approvals": "मंजुरी",
    "outbreaks": "साथीचे आजार",
    "featureInDev": "हे वैशिष्ट्य विकसित होत आहे."
  }
};

async function updateTranslations() {
  const fileContent = await fs.readFile('src/locales/translations.js', 'utf-8');
  
  // A somewhat hacky but safe way to append keys before the closing brace of each language
  // translations.js looks like: 
  // export const resources = {
  //   "en": {
  //     "translation": {
  //        ...
  //     }
  //   },
  //   "mr": {
  //     "translation": {
  //        ...
  //     }
  //   }
  // };

  let updated = fileContent;

  const enAdditions = Object.entries(newTranslations.en).map(([k, v]) => `"${k}": "${v}"`).join(',\n      ');
  updated = updated.replace(/("goshwaraAbstract": "Goshwara Abstract",?)/, `$1\n      ${enAdditions},`);

  const mrAdditions = Object.entries(newTranslations.mr).map(([k, v]) => `"${k}": "${v}"`).join(',\n      ');
  updated = updated.replace(/("goshwaraAbstract": "गोषवारा गोषवारा",?)/, `$1\n      ${mrAdditions},`);

  await fs.writeFile('src/locales/translations.js', updated);
  console.log('Translations updated!');
}

updateTranslations().catch(console.error);
