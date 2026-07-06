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
    await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle0' });
    
    // Check if we are on Splash Screen and wait for Login
    if (await page.evaluate(() => document.body.innerText.includes('Booting Clinical Engine'))) {
       await page.waitForFunction(() => !document.body.innerText.includes('Booting Clinical Engine'), { timeout: 15000 });
    }
    
    // We should be on login screen. But just in case we are already logged in from a previous test
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Aadhaar')) {
        await page.type('input[placeholder*="Aadhaar"]', 'admin');
        await page.type('input[placeholder*="Password"]', 'admin123');
        await page.click('div[dir="auto"].css-text-146c3p1'); 
    }

    await page.waitForFunction(() => document.body.innerText.includes('Admin Panel'), { timeout: 10000 });
    console.log('Logged into Admin Panel');
    
    // Find and click "Exit to App Dashboard"
    const clicked = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const btn = els.find(el => el.innerText && el.innerText.includes('Exit to App Dashboard'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (clicked) {
       console.log('Clicked Exit to App Dashboard');
       await new Promise(resolve => setTimeout(resolve, 3000)); // wait for 3s to see if it crashes
       console.log('Final page content: ', await page.evaluate(() => document.body.innerText.substring(0, 200)));
    } else {
       console.log('Could not find exit button');
    }

  } catch (e) {
    console.error('Error during puppeteer test:', e);
  } finally {
    await browser.close();
  }
})();
