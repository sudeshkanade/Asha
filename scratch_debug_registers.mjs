import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = "C:\\Users\\SC_Bu\\.gemini\\antigravity-ide\\brain\\653ceebd-d2a1-48f4-85a7-38e9e9b4ebcb";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickElementWithText(page, text) {
  console.log(`[Action] Click element with text: "${text}"`);
  const clicked = await page.evaluate((txt) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let foundNode = null;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue.trim();
      if (val === txt || (val.includes(txt) && val !== 'Worker Login')) {
        foundNode = node;
        break;
      }
    }
    if (foundNode) {
      let parent = foundNode.parentElement;
      while (parent && parent !== document.body) {
        if (
          parent.style.cursor === 'pointer' ||
          parent.onclick ||
          parent.getAttribute('role') === 'button' ||
          parent.tagName === 'BUTTON' ||
          parent.getAttribute('tabindex') === '0' ||
          parent.className?.includes('button') ||
          parent.className?.includes('Btn') ||
          parent.className?.includes('Item') ||
          parent.className?.includes('Card')
        ) {
          parent.click();
          return true;
        }
        parent = parent.parentElement;
      }
      foundNode.parentElement.click();
      return true;
    }
    return false;
  }, text);
  return clicked;
}

async function getElementText(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.textContent : null;
  }, selector);
}

async function run() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('dialog', async dialog => {
    console.log('[Browser Alert]', dialog.message());
    await dialog.dismiss();
  });
  
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.includes('googleapis.com') || url.includes('firebase')) {
      const headers = Object.assign({}, request.headers(), {
        'Origin': 'https://sudeshkanade.github.io',
        'Referer': 'https://sudeshkanade.github.io/'
      });
      request.continue({ headers });
    } else {
      request.continue();
    }
  });

  try {
    await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    // Login
    let inputs = await page.$$('input');
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('surveyteam1994@gmail.com');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('sudeshb1');
    await clickElementWithText(page, 'Login');
    
    console.log("Waiting for cloud pull...");
    await sleep(8000);

    // Take screenshot of dashboard
    await page.screenshot({ path: path.join(artifactDir, 'debug_dashboard.png') });
    console.log("Dashboard loaded, screenshot taken.");

    // Click on Special Registers card
    const openedModal = await clickElementWithText(page, 'Special Registers');
    console.log(`Clicked Special Registers card: ${openedModal}`);
    await sleep(2000);
    await page.screenshot({ path: path.join(artifactDir, 'debug_modal.png') });
    console.log("Modal opened, screenshot taken.");

    // Get all items in the modal
    const modalItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[class*="registerItem"], div[style*="flexDirection"]'));
      return items.map(el => el.textContent.trim()).filter(Boolean);
    });
    console.log("Found modal elements text:", modalItems);

    // Let's click on 'Eligible Couples' (which matches ELIGIBLE_COUPLE filter)
    const clickedEC = await clickElementWithText(page, 'Eligible Couples');
    console.log(`Clicked Eligible Couples: ${clickedEC}`);
    await sleep(3000);
    await page.screenshot({ path: path.join(artifactDir, 'debug_eligible_couples.png') });
    console.log("Eligible Couples list loaded, screenshot taken.");

    // Check DOM contents of the list
    const listInfo = await page.evaluate(() => {
      const headerTitle = document.querySelector('div[class*="header"] div div, div[class*="header"] h1, h1')?.textContent;
      const subtitle = document.querySelector('div[class*="header"] div span, div[class*="header"] p, span[class*="Subtitle"]')?.textContent;
      const cards = Array.from(document.querySelectorAll('div[class*="memberCard"], div[class*="memberCardWrapper"]')).map(el => el.textContent.trim());
      const allText = document.body.textContent;
      return { headerTitle, subtitle, cardsCount: cards.length, cards: cards.slice(0, 5), allText: allText.substring(0, 1000) };
    });
    console.log("MemberList details:", listInfo);

  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    await browser.close();
  }
}

run();
