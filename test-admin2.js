const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
       console.log('BROWSER:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('BROWSER ERROR:', err.toString());
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    if (await page.evaluate(() => document.body.innerText.includes('Booting Clinical Engine'))) {
       await page.waitForFunction(() => !document.body.innerText.includes('Booting Clinical Engine'), { timeout: 15000 });
    }
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Aadhaar')) {
        await page.type('input[placeholder*="Aadhaar"]', 'admin');
        await page.type('input[placeholder*="Password"]', 'admin123');
        await page.click('div[dir="auto"].css-text-146c3p1'); 
    }

    await page.waitForFunction(() => document.body.innerText.includes('Admin Panel') || document.body.innerText.includes('Coverage Overview'), { timeout: 10000 });
    console.log('Logged in successfully!');
    
    // Find and click "Exit to App Dashboard" if on Admin Panel
    const isOldAdmin = await page.evaluate(() => document.body.innerText.includes('Exit to App Dashboard'));
    if (isOldAdmin) {
       console.log('On Admin Panel, clicking Exit to App Dashboard...');
       await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('*'));
          const btn = els.find(el => el.innerText && el.innerText.includes('Exit to App Dashboard'));
          if (btn) btn.click();
       });
       await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('Final page content: ', await page.evaluate(() => document.body.innerText.substring(0, 500)));

  } catch (e) {
    console.error('Error during puppeteer test:', e);
  } finally {
    await browser.close();
  }
})();
