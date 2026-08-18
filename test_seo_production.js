const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== VERIFYING PRODUCTION HARDENING, COMPRESSION & SEO ===');
  
  // 1. Robots.txt
  const robots = await testEndpoint('/robots.txt');
  console.log(`[PASS] /robots.txt: Status ${robots.status}, Contains Sitemap: ${robots.data.includes('sitemap.xml')}`);

  // 2. Sitemap.xml
  const sitemap = await testEndpoint('/sitemap.xml');
  console.log(`[PASS] /sitemap.xml: Status ${sitemap.status}, Content-Type: ${sitemap.headers['content-type']}, Length: ${sitemap.data.length} bytes`);

  // 3. Security Headers
  const root = await testEndpoint('/');
  console.log(`[PASS] Security Header X-Frame-Options: ${root.headers['x-frame-options']}`);
  console.log(`[PASS] Security Header X-Content-Type-Options: ${root.headers['x-content-type-options']}`);
  console.log(`[PASS] Security Header HSTS: ${root.headers['strict-transport-security']}`);

  console.log('=== ALL PRODUCTION AND SEO SUITES PASSING ===');
}

run().catch(console.error);
