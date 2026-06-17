import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function debugLogin() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[Browser Console]', msg.type(), msg.text()));
  page.on('dialog', async dialog => {
    console.log('[Browser Alert]', dialog.message());
    await dialog.dismiss();
  });

  console.log("Navigating to http://localhost:3000/Asha/ ...");
  await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle2' });
  await delay(3000);

  console.log("Taking initial screenshot (login_init.png)...");
  await page.screenshot({ path: 'login_init.png' });

  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} inputs.`);
  if (inputs.length >= 2) {
    await inputs[0].type('surveyteam1994@gmail.com');
    await inputs[1].type('sudeshb1');
    console.log("Typed credentials. Taking screenshot (login_typed.png)...");
    await page.screenshot({ path: 'login_typed.png' });

    console.log("Clicking login...");
    await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('Login')) {
          node.parentElement.click();
          return;
        }
      }
    });

    await delay(5000);
    console.log("Taking screenshot after 5 seconds (login_post.png)...");
    await page.screenshot({ path: 'login_post.png' });

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Page text body preview (first 500 chars):");
    console.log(bodyText.substring(0, 500));
  } else {
    console.error("Inputs not found!");
  }

  await browser.close();
}

debugLogin().catch(console.error);
