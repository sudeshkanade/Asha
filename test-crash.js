import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  console.log('Navigating to http://localhost:3000/Asha/ ...');
  try {
    await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle0' });
    
    // Check if we are on Login screen
    const loginText = await page.evaluate(() => document.body.innerText);
    if (loginText.includes('Login')) {
      console.log('On Login Screen. Logging in as Admin...');
      await page.type('input[placeholder="Enter Aadhaar Number"]', 'admin');
      await page.type('input[placeholder="Enter Password"]', 'admin123'); // Assuming default admin password
      
      const buttons = await page.$$('div[role="button"]');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('LOGIN')) {
          await btn.click();
          break;
        }
      }
      
      console.log('Waiting for navigation after login...');
      await new Promise(r => setTimeout(r, 3000));
      console.log('Dashboard content:', await page.evaluate(() => document.body.innerText.substring(0, 500)));
    } else {
      console.log('Already logged in? Dashboard content:', loginText.substring(0, 500));
    }
  } catch (err) {
    console.error('Error during puppeteer test:', err);
  } finally {
    await browser.close();
  }
})();
