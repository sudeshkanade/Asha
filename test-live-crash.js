import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  console.log('Navigating to https://sudeshkanade.github.io/Asha/ ...');
  try {
    await page.goto('https://sudeshkanade.github.io/Asha/', { waitUntil: 'networkidle2' });
    
    console.log('Waiting for splash screen to disappear...');
    await page.waitForFunction(() => !document.body.innerText.includes('Booting Clinical Engine'), { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if we are on Login screen
    const loginText = await page.evaluate(() => document.body.innerText);
    if (loginText.includes('Login')) {
      console.log('On Login Screen. Logging in as Admin...');
      await page.type('input[placeholder*="Aadhaar"]', 'admin');
      await page.type('input[placeholder*="Password"]', 'admin123'); // Assuming default admin password
      
      const buttons = await page.$$('div[role="button"]');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.includes('LOGIN')) {
          await btn.click();
          break;
        }
      }
      
      console.log('Waiting 5s for navigation after login...');
      await new Promise(r => setTimeout(r, 5000));
      
      // If we landed on Admin Panel, try clicking Exit to App Dashboard
      const postLoginText = await page.evaluate(() => document.body.innerText);
      if (postLoginText.includes('Exit to App Dashboard')) {
          console.log('On Admin Panel. Clicking Exit to App Dashboard...');
          const dashButtons = await page.$$('div[role="button"]');
          for (const btn of dashButtons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Exit to App Dashboard')) {
              await btn.click();
              break;
            }
          }
          await new Promise(r => setTimeout(r, 3000));
      }
      console.log('Final content:', await page.evaluate(() => document.body.innerText.substring(0, 500)));
    } else {
      console.log('Already logged in? Dashboard content:', loginText.substring(0, 500));
      if (loginText.includes('Exit to App Dashboard')) {
          console.log('On Admin Panel. Clicking Exit to App Dashboard...');
          const dashButtons = await page.$$('div[role="button"]');
          for (const btn of dashButtons) {
            const text = await page.evaluate(el => el.innerText, btn);
            if (text && text.includes('Exit to App Dashboard')) {
              await btn.click();
              break;
            }
          }
          await new Promise(r => setTimeout(r, 3000));
          console.log('Final content:', await page.evaluate(() => document.body.innerText.substring(0, 500)));
      }
    }
  } catch (err) {
    console.error('Error during puppeteer test:', err);
  } finally {
    await browser.close();
  }
})();
