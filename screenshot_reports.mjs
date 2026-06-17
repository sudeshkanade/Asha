import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 800 });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle2' });

  console.log('Logging in...');
  await page.type('input[placeholder*="email" i], input[type="email"]', 'surveyteam1994@gmail.com');
  await page.type('input[placeholder*="password" i], input[type="password"]', 'sudeshb1');
  await page.click('button[type="submit"], div[role="button"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in. At dashboard.');

  console.log('Clicking on Goshwara Report...');
  const buttons = await page.$$('div');
  let goshwaraBtn;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Goshwara Abstract')) {
      goshwaraBtn = btn;
      break;
    }
  }

  if (goshwaraBtn) {
    await goshwaraBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot_goshwara.png', fullPage: true });
    console.log('Saved screenshot_goshwara.png');
  } else {
    console.log('Could not find Goshwara button');
  }

  await browser.close();
})();
