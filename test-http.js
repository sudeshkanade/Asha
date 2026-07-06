// Quick smoke-test: launch localhost and capture any console errors from the login page
const http = require('http');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const result = await fetchPage('http://localhost:3000/Asha/');
    console.log('Status:', result.status);
    // Check for script errors in HTML
    if (result.body.includes('<div id="root">')) {
      console.log('✅ HTML has root element');
    }
    if (result.body.includes('index.js') || result.body.includes('assets/index')) {
      console.log('✅ Script reference found');
      const scriptMatch = result.body.match(/src="([^"]+index[^"]+)"/);
      if (scriptMatch) console.log('Script:', scriptMatch[1]);
    }
    
    // Check for any obvious inline errors
    const errorPatterns = ['Cannot find', 'SyntaxError', 'ReferenceError'];
    errorPatterns.forEach(p => {
      if (result.body.includes(p)) console.error('❌ Error pattern found:', p);
    });
    
    console.log('\n--- First 500 chars of body ---');
    console.log(result.body.substring(0, 500));
  } catch (e) {
    console.error('Failed to fetch:', e.message);
  }
}

main();
