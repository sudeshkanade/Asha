import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

async function downloadData() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to target domain...');
  await page.goto('https://sudeshkanade.github.io/Asha/');

  await new Promise(r => setTimeout(r, 5000));

  console.log('Logging in as Admin...');
  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} inputs`);
  if (inputs.length >= 2) {
    await inputs[0].type('admin');
    await inputs[1].type('admin');
  }

  console.log('Clicking login...');
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes('Login') || node.nodeValue.includes('लॉगिन')) {
        let parent = node.parentElement;
        while (parent && parent !== document.body) {
          if (parent.style.cursor === 'pointer' || parent.onclick || parent.getAttribute('role') === 'button' || parent.tagName === 'DIV') {
            // Found clickable parent, dispatch click
            parent.click();
            return;
          }
          parent = parent.parentElement;
        }
      }
    }
  });

  console.log('Waiting for cloud sync to complete (giving it 15 seconds)...');
  await new Promise(r => setTimeout(r, 15000));

  console.log('Extracting localStorage data...');
  const allData = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('rural_health')) {
        try {
          result[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          result[key] = localStorage.getItem(key);
        }
      }
    }
    return result;
  });

  await browser.close();

  const outputDir = "C:\\Users\\SC_Bu\\.gemini\\antigravity-ide\\brain\\e6eab100-2902-44df-be05-aca53c0256d5\\scratch\\cloud_data_export";
  await fs.mkdir(outputDir, { recursive: true });

  let count = 0;
  for (const [key, data] of Object.entries(allData)) {
    const colName = key.replace('@rural_health_', '');
    const filePath = path.join(outputDir, `${colName}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved ${Array.isArray(data) ? data.length : 'data'} records to ${filePath}`);
    count++;
  }

  console.log(`Download complete! Saved ${count} collections.`);
}

downloadData().catch(console.error);
