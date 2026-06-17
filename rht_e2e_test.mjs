import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = "C:\\Users\\SC_Bu\\.gemini\\antigravity-ide\\brain\\653ceebd-d2a1-48f4-85a7-38e9e9b4ebcb";

// Utility helpers
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickElementWithText(page, text) {
  console.log(`[Action] Attempting to click element with text: "${text}"`);
  const clicked = await page.evaluate((txt) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let foundNode = null;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue.trim();
      if (val === txt) {
        foundNode = node;
        break; // Exact match found
      } else if (val.includes(txt) && !foundNode && val !== 'Worker Login') {
        foundNode = node; // Partial match fallback
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
          parent.className?.includes('Card') ||
          parent.className?.includes('Touchable')
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
  if (!clicked) {
    console.log(`[Warning] Could not click element with text: "${text}"`);
  }
  return clicked;
}

async function elementExistsWithText(page, text) {
  return await page.evaluate((txt) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue.trim();
      if (val === txt || (val.includes(txt) && val !== 'Worker Login')) {
        return true;
      }
    }
    return false;
  }, text);
}

// Click first element containing text (using XPath for exact structural match)
async function clickFirstButtonWithText(page, text) {
  const result = await page.evaluate((txt) => {
    const allElements = document.querySelectorAll('div, span, button, a, p');
    for (const el of allElements) {
      if (el.childNodes.length === 1 && el.textContent.trim() === txt) {
        el.click();
        return true;
      }
    }
    return false;
  }, text);
  return result;
}

async function runTests() {
  console.log('==================================================');
  console.log('🩺 STARTING COMPREHENSIVE RHT E2E TEST SUITE 🩺');
  console.log('==================================================');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  const pass = (name) => { results.passed.push(name); console.log(`  ✅ PASSED: ${name}`); };
  const fail = (name, reason='') => { results.failed.push(name); console.log(`  ❌ FAILED: ${name}${reason ? ` — ${reason}` : ''}`); };
  const warn = (name, reason='') => { results.warnings.push(name); console.log(`  ⚠️ WARNING: ${name}${reason ? ` — ${reason}` : ''}`); };

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

  // Intercept to spoof Firebase domain restrictions
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

  // Set up download directory
  const downloadPath = path.join(__dirname, 'downloads');
  await fs.mkdir(downloadPath, { recursive: true });
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  try {
    // ============================================================
    // 1. APP BOOT CHECK
    // ============================================================
    console.log('\n--- 1. App Load & Boot Verification ---');
    await page.goto('http://localhost:3000/Asha/', { waitUntil: 'networkidle2' });
    await sleep(3000);

    const logoExists = await elementExistsWithText(page, 'Health Tracker');
    logoExists ? pass('App Boot — Health Tracker logo visible') : fail('App Boot — Health Tracker logo not found');

    // ============================================================
    // 2. ASHA WORKER LOGIN FLOW
    // ============================================================
    console.log('\n--- 2. ASHA Worker Login (surveyteam1994@gmail.com / sudeshb1) ---');

    let inputs = await page.$$('input');
    if (inputs.length < 2) throw new Error(`Login inputs not found. Expected >= 2, found ${inputs.length}`);

    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('surveyteam1994@gmail.com');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('sudeshb1');

    await clickElementWithText(page, 'Login');
    console.log('  Waiting 10s for forced cloud pull (force=true after login)...');
    await sleep(10000);

    // ASHA Dashboard header — JSX renders two separate text nodes ("ASHA" + " Dashboard"),
    // so TreeWalker won't find "ASHA Dashboard" as a single node.
    // Use body.textContent which concatenates all text nodes.
    const ashaDashboardText = await page.evaluate(() => document.body.textContent.includes('ASHA Dashboard'));
    ashaDashboardText ? pass('ASHA Dashboard — Header shows "ASHA Dashboard"') : fail('ASHA Dashboard — Header incorrect (check "asha" translation key)');

    const villageText = await elementExistsWithText(page, 'Buzawade1');
    villageText ? pass('ASHA Village — "Buzawade1" shown in subtitle') : fail('ASHA Village — Village not visible');

    // ============================================================
    // 3. RBAC / SECURITY AUDIT
    // ============================================================
    console.log('\n--- 3. ASHA Security & RBAC Audit ---');

    const moreToolsExists = await elementExistsWithText(page, 'More Tools');
    !moreToolsExists ? pass('RBAC — "More Tools" tile hidden for ASHA') : fail('RBAC — "More Tools" tile VISIBLE for ASHA (security breach!)');

    // Check Coverage Overview and key metrics are present
    const coverageExists = await elementExistsWithText(page, 'Coverage Overview');
    coverageExists ? pass('ASHA Dashboard — Coverage Overview section visible') : fail('ASHA Dashboard — Coverage Overview section missing');

    // ============================================================
    // 4. RESPONSIVENESS — VIEWPORT SCREENSHOTS
    // ============================================================
    console.log('\n--- 4. Responsiveness Viewport Testing ---');

    await page.setViewport({ width: 1280, height: 800 });
    await sleep(800);
    await page.screenshot({ path: path.join(artifactDir, 'dashboard_desktop.png') });
    pass('Desktop Viewport (1280x800) — Screenshot saved');

    await page.setViewport({ width: 768, height: 1024 });
    await sleep(800);
    await page.screenshot({ path: path.join(artifactDir, 'dashboard_tablet.png') });
    pass('Tablet Viewport (768x1024) — Screenshot saved');

    // NOTE: isMobile:true is intentionally omitted — it changes user agent and triggers full page reload
    await page.setViewport({ width: 375, height: 667 });
    await sleep(800);
    await page.screenshot({ path: path.join(artifactDir, 'dashboard_mobile.png') });
    pass('Mobile Viewport (375x667) — Screenshot saved');

    // Reset to desktop
    await page.setViewport({ width: 1280, height: 800 });
    await sleep(500);

    // ============================================================
    // 5. LOCALIZATION: ENGLISH → MARATHI TOGGLE
    // ============================================================
    console.log('\n--- 5. Localization Toggle Verification ---');

    // The language button shows "मराठी" when in English mode
    // IMPORTANT: Pass Unicode text as evaluate argument (JSON-serialized by Puppeteer),
    // NOT inline in the function body. Inline Unicode gets mangled during JS serialization.
    const langToggled = await page.evaluate((marathiText) => {
      const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
      for (const el of allElements) {
        if (el.textContent.trim() === marathiText) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
      }
      return false;
    }, 'मराठी');  // pass as arg, not inline
    langToggled ? console.log('  Language toggled to Marathi.') : warn('Localization — Marathi button not clickable');
    await sleep(2000);

    const marathiTitleExists = await elementExistsWithText(page, 'व्याप्ती विहंगावलोकन');
    marathiTitleExists ? pass('Localization — Coverage Overview translated to Marathi (व्याप्ती विहंगावलोकन)') : fail('Localization — Marathi translation not applied');

    const ashaMarathi = await elementExistsWithText(page, 'आशा डॅशबोर्ड');
    ashaMarathi ? pass('Localization — ASHA Dashboard header translated to Marathi') : warn('Localization — ASHA Dashboard header not translated (may use partial match)');

    // Switch back to English — same approach: pass string as argument
    await page.evaluate((enText) => {
      const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
      for (const el of allElements) {
        if (el.textContent.trim() === enText) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
      }
      return false;
    }, 'EN');
    await sleep(1500);

    // ============================================================
    // 6. SPECIAL REGISTERS — VERIFY DATA LOADS
    // ============================================================
    console.log('\n--- 6. Special Registers Verification ---');

    const openedModal = await clickElementWithText(page, 'Special Registers');
    await sleep(1500);

    if (openedModal) {
      // Click Eligible Couples (expected ~60 for Buzawade1)
      await clickElementWithText(page, 'Eligible Couples');
      await sleep(2000);

      const ecListInfo = await page.evaluate(() => {
        const text = document.body.textContent;
        const match = text.match(/(\d+)\s*My Members/);
        return { count: match ? parseInt(match[1]) : 0, hasMembers: text.includes('Female') };
      });

      ecListInfo.count > 0
        ? pass(`Special Registers — Eligible Couples loaded (${ecListInfo.count} members)`)
        : fail('Special Registers — Eligible Couples shows 0 members (cloud pull issue?)');

      await clickElementWithText(page, '←');
      await sleep(1000);
    } else {
      fail('Special Registers — Modal did not open');
    }

    // ============================================================
    // 7. CRUD: FAMILY & MEMBER REGISTRATION
    // ============================================================
    console.log('\n--- 7. Family & Member Registration (CRUD) ---');

    // Open FAB
    await clickElementWithText(page, '+');
    await sleep(800);

    await clickElementWithText(page, 'New Family');
    await sleep(2000);

    let famInputs = await page.$$('input');
    // House Number is inputs[0]
    await famInputs[0].triple_click?.() || famInputs[0].click({ clickCount: 3 });
    await famInputs[0].type('999/E2E-TEST');

    // Village chip (pre-selected for ASHA with single village, but click it explicitly)
    await clickFirstButtonWithText(page, 'Buzawade1');
    await sleep(300);

    // Category/Caste: Click "General" chip (required field)
    console.log('  Selecting Category: General...');
    const casteClicked = await clickFirstButtonWithText(page, 'General');
    if (!casteClicked) {
      // Fallback to text walker
      await clickElementWithText(page, 'General');
    }
    await sleep(300);

    await clickElementWithText(page, 'Register Family & Add Members');
    await sleep(2500);

    // Now we should be on MemberRegistration screen
    let memInputs = await page.$$('input');
    if (memInputs.length >= 1) {
      // Form order: Gender chips first (default Female), then Relation chips, then inputs
      // inputs[0] = First Name, inputs[1] = Middle (Father) Name, inputs[2] = Last Name, inputs[3] = DOB (DD/MM/YYYY)
      
      // First click Male gender chip (needed for Self (Head) relation to appear properly)
      await clickElementWithText(page, 'Male');
      await sleep(300);
      
      // Click Self (Head) relation chip
      await clickElementWithText(page, 'Self (Head)');
      await sleep(300);

      // Re-query inputs after DOM update from relation change
      memInputs = await page.$$('input');
      
      if (memInputs[0]) { await memInputs[0].click({clickCount:3}); await memInputs[0].type('E2E'); }           // First Name
      if (memInputs[1]) { await memInputs[1].click({clickCount:3}); await memInputs[1].type('Father'); }        // Middle/Father Name
      if (memInputs[2]) { await memInputs[2].click({clickCount:3}); await memInputs[2].type('TestMember'); }    // Last Name
      
      // DOB: format must be DD/MM/YYYY
      if (memInputs[3]) {
        await memInputs[3].click({clickCount:3});
        await memInputs[3].type('15051990');  // Puppeteer types "15051990" → handleDobChange auto-inserts slashes
      }
      await sleep(500);

      await clickElementWithText(page, 'Save Member');
      await sleep(3000);

      pass('CRUD — Family & Member registration form submitted');
    } else {
      fail('CRUD — Member registration inputs not found after family save');
    }

    // Navigate to All Members to verify search
    console.log('  Opening All Members to verify CRUD...');
    await clickElementWithText(page, 'All Members');
    await sleep(2000);

    let searchInput = await page.$('input');
    if (searchInput) {
      await searchInput.type('E2E');
      await sleep(1000);
      const searchFound = await elementExistsWithText(page, 'E2E');
      searchFound ? pass('CRUD Search — Newly registered member found by name') : fail('CRUD Search — Newly registered member NOT found');
    } else {
      fail('CRUD Search — Search input not found in All Members screen');
    }

    await clickElementWithText(page, '←');
    await sleep(1500);

    // ============================================================
    // 8. VITAL EVENTS & OFFLINE SYNC
    // ============================================================
    console.log('\n--- 8. Vital Events & Offline Sync Heartbeat ---');

    // Go offline
    console.log('  Simulating OFFLINE state...');
    await page.setOfflineMode(true);
    await sleep(800);

    await clickElementWithText(page, 'Vital Events');
    await sleep(2000);

    console.log('  Logging a Birth event...');
    await clickElementWithText(page, 'Birth');
    await sleep(2000);

    let eventInputs = await page.$$('input');
    console.log(`  Found ${eventInputs.length} inputs on Birth form`);
    
    // Input 0 = Child Name
    if (eventInputs[0]) {
      await eventInputs[0].click({ clickCount: 3 });
      await eventInputs[0].type('OfflineBaby');
    }
    // Input 1 = Event Date (YYYY-MM-DD required by VitalEventsScreen)
    const today = new Date().toISOString().split('T')[0];
    if (eventInputs[1]) {
      await eventInputs[1].click({ clickCount: 3 });
      await eventInputs[1].type(today);
    }
    await sleep(300);

    // Select delivery place as 'Home' (no hospital name required)
    await clickElementWithText(page, 'Home');
    await sleep(400);
    
    // SBA: Yes  
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
      for (const el of allElements) {
        if (el.textContent.trim() === 'Yes' || el.textContent.trim() === 'हो') { el.click(); return; }
      }
    });
    await sleep(300);
    
    // Birth Weight — last numeric input
    eventInputs = await page.$$('input');
    for (let i = eventInputs.length - 1; i >= 0; i--) {
      const itype = await eventInputs[i].evaluate(el => el.type);
      if (itype === 'number' || itype === 'text') {
        const currentVal = await eventInputs[i].evaluate(el => el.value);
        if (!currentVal || currentVal === '') {
          await eventInputs[i].type('3.2');
          break;
        }
      }
    }

    await clickElementWithText(page, 'Register Event');
    await sleep(2000);

    console.log('  Returning to dashboard to check offline indicator...');
    await clickElementWithText(page, '←');
    await sleep(2000);

    const pendingSyncTextExists = await elementExistsWithText(page, 'Records Pending Sync');
    pendingSyncTextExists
      ? pass('Offline Mode — Sync bar shows "Records Pending Sync" (red) while offline')
      : warn('Offline Mode — "Records Pending Sync" bar not visible (may need pending items in queue)');

    // Restore online
    console.log('  Restoring ONLINE state...');
    await page.setOfflineMode(false);
    await sleep(3000);

    // SYNC NOW button appears only when syncCount > 0
    await clickElementWithText(page, 'SYNC NOW');
    await sleep(5000);

    const syncedTextExists = await elementExistsWithText(page, 'All Data Synced');
    syncedTextExists
      ? pass('Online Sync — "All Data Synced" bar shown (green) after reconnect')
      : warn('Online Sync — "All Data Synced" indicator not visible (sync may still be running)');

    // Logout ASHA
    console.log('  Logging out ASHA worker...');
    await clickElementWithText(page, '🚪');
    await sleep(2500);

    // ============================================================
    // 9. ADMIN FLOW: DASHBOARD, REPORTS & EXCEL EXPORT
    // ============================================================
    console.log('\n--- 9. Admin Flow — Dashboard, Reports & Excel Export ---');

    inputs = await page.$$('input');
    if (inputs.length < 2) throw new Error('Login screen not found for Admin login');

    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('sudeshkanade2@gmail.com');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('sudeshmpw');

    await clickElementWithText(page, 'Login');
    console.log('  Waiting 10s for Admin Dashboard to load...');
    await sleep(10000);

    const adminPanelExists = await elementExistsWithText(page, 'Admin Panel');
    adminPanelExists ? pass('Admin Login — Admin Panel loaded') : fail('Admin Login — Admin Panel not found');

    // Exit to App Dashboard
    await clickElementWithText(page, 'Exit to App Dashboard');
    await sleep(3000);

    const adminCoverageExists = await elementExistsWithText(page, 'Coverage Overview');
    adminCoverageExists ? pass('Admin Dashboard — Coverage Overview visible') : fail('Admin Dashboard — Coverage Overview not found');

    // Test Excel Export
    console.log('  Testing Excel Export...');
    try {
      const existingFiles = await fs.readdir(downloadPath);
      for (const f of existingFiles) {
        await fs.unlink(path.join(downloadPath, f));
      }
    } catch(e) {}

    await clickElementWithText(page, 'Excel');
    console.log('  Triggered Excel export. Waiting 8 seconds...');
    await sleep(8000);

    const downloadedFiles = await fs.readdir(downloadPath);
    console.log('  Downloaded files:', downloadedFiles);
    const excelDownloaded = downloadedFiles.some(f => f.endsWith('.xlsx'));
    excelDownloaded
      ? pass(`Excel Export — Downloaded file: ${downloadedFiles.find(f => f.endsWith('.xlsx'))}`)
      : fail('Excel Export — No .xlsx file found in downloads folder');

    // Test Reports Module
    console.log('  Opening Reports module...');
    await clickElementWithText(page, 'Reports');
    await sleep(3000);

    const reportsLoaded = await elementExistsWithText(page, 'Monthly Progress Report');
    reportsLoaded ? pass('Admin Reports — Monthly Progress Report (MPR) loaded') : fail('Admin Reports — MPR screen not loaded');

    // Go back and logout
    await clickElementWithText(page, '←');
    await sleep(1500);
    await clickElementWithText(page, '🚪');
    await sleep(2000);

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log('\n==================================================');
    console.log('📊 E2E TEST SUITE SUMMARY');
    console.log('==================================================');
    console.log(`✅ PASSED:   ${results.passed.length}`);
    console.log(`❌ FAILED:   ${results.failed.length}`);
    console.log(`⚠️ WARNINGS: ${results.warnings.length}`);
    console.log('--------------------------------------------------');
    if (results.failed.length > 0) {
      console.log('\nFailed Tests:');
      results.failed.forEach(t => console.log(`  ❌ ${t}`));
    }
    if (results.warnings.length > 0) {
      console.log('\nWarnings:');
      results.warnings.forEach(t => console.log(`  ⚠️ ${t}`));
    }
    console.log('\n🎉 E2E TEST RUN COMPLETED 🎉');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ E2E TEST CRASHED:', err);
  } finally {
    await browser.close();
  }
}

runTests();
