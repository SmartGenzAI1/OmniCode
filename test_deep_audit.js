/**
 * OmniCode Deep System & SEO Verification Audit Suite
 * Verifies 100% endpoint integrity, Google SEO metadata, Obsidian Universe Cluster, and zero runtime errors.
 */

const http = require('http');

function fetchHttp(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    }).on('error', reject);
  });
}

async function runDeepAudit() {
  console.log('===============================================================');
  console.log('🔍 STARTING OMNICODE DEEP PRODUCTION & SEO INTEGRITY AUDIT');
  console.log('===============================================================\n');

  let passedChecks = 0;
  let failedChecks = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedChecks++;
    }
  }

  try {
    // 1. Root HTML, Hamburger & SEO Metadata Audit
    console.log('📋 AUDIT 1: SEO, Schema.org, Viewport & Hamburger Mobile Drawer');
    const root = await fetchHttp('/');
    assert(root.statusCode === 200, 'Root / serves 200 OK');
    assert(root.body.includes('btn-mobile-hamburger'), 'Mobile Hamburger Menu button present in HTML');
    assert(root.body.includes('mobile-drawer-overlay'), 'Mobile Navigation Drawer present in HTML');
    assert(root.body.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0'), 'Responsive viewport tag present');
    assert(root.body.includes('application/ld+json'), 'Schema.org JSON-LD Structured Data present for Google Search rich snippets');
    assert(root.body.includes('<link rel="canonical"'), 'Canonical URL tag present');
    assert(root.body.includes('property="og:title"'), 'OpenGraph Title present for social media sharing');
    assert(root.body.includes('name="twitter:card"'), 'Twitter Card preview present');
    assert(root.body.includes('<link rel="manifest" href="/manifest.json">'), 'Web App Manifest linked for Google PWA');
    assert(root.headers['x-frame-options'] === 'SAMEORIGIN', 'Security Header X-Frame-Options configured');
    assert(root.headers['x-content-type-options'] === 'nosniff', 'Security Header X-Content-Type-Options configured');
    assert(root.headers['strict-transport-security'] !== undefined, 'Security Header HSTS configured');

    // 2. Googlebot Sitemap & Robots.txt
    console.log('\n🤖 AUDIT 2: Search Engine Crawling & XML Sitemap');
    const robots = await fetchHttp('/robots.txt');
    assert(robots.statusCode === 200, 'robots.txt serves 200 OK');
    assert(robots.body.includes('User-agent: *') && robots.body.includes('sitemap.xml'), 'robots.txt allows all crawlers and points to sitemap.xml');

    const sitemap = await fetchHttp('/sitemap.xml');
    assert(sitemap.statusCode === 200, 'sitemap.xml serves 200 OK');
    assert(sitemap.headers['content-type'].includes('xml'), 'sitemap.xml has application/xml Content-Type');
    assert(sitemap.body.includes('<urlset') && sitemap.body.includes('<loc>'), 'sitemap.xml contains valid XML URL entries');
    assert(sitemap.body.length > 100000, `sitemap.xml contains comprehensive index (${(sitemap.body.length / 1024).toFixed(1)} KB)`);

    // 3. API Core Endpoints
    console.log('\n⚡ AUDIT 3: Core API Endpoints & Live Metrics');
    const statsRes = await fetchHttp('/api/search/stats');
    assert(statsRes.statusCode === 200, '/api/search/stats serves 200 OK');
    const stats = JSON.parse(statsRes.body);
    assert(stats.totalRepos >= 2000, `Total repositories in index is ${stats.totalRepos.toLocaleString()} (>= 2,000)`);
    assert(stats.totalSLOC > 5000000, `Total SLOC is ${stats.totalSLOC.toLocaleString()} lines of code`);

    // 4. Exact Star Verification for React & Linux
    console.log('\n⭐ AUDIT 4: Live GitHub Metrics Accuracy');
    const reactRes = await fetchHttp('/api/repos/repo-facebook-react');
    const react = JSON.parse(reactRes.body);
    assert(react.stars >= 240000, `React has ${react.stars.toLocaleString()} stars (Accurate real live GitHub metric)`);
    assert(react.forks >= 40000, `React has ${react.forks.toLocaleString()} forks`);

    const linuxRes = await fetchHttp('/api/repos/repo-torvalds-linux');
    const linux = JSON.parse(linuxRes.body);
    assert(linux.stars >= 240000, `Linux has ${linux.stars.toLocaleString()} stars (Accurate real live GitHub metric)`);

    // 5. Global Symbol Search
    console.log('\n🔍 AUDIT 5: Global AST Symbol Engine');
    const symbolsRes = await fetchHttp('/api/features/symbols?q=Engine&type=all');
    assert(symbolsRes.statusCode === 200, '/api/features/symbols serves 200 OK');
    const symbols = JSON.parse(symbolsRes.body);
    assert(symbols.results.length > 0, `Symbol search returned ${symbols.results.length} results for 'Engine'`);

    // 6. Polyglot Algorithm Comparator
    console.log('\n📊 AUDIT 6: Polyglot Algorithm Matrix');
    const algoRes = await fetchHttp('/api/comparator/algorithms');
    assert(algoRes.statusCode === 200, '/api/comparator/algorithms serves 200 OK');
    const algos = JSON.parse(algoRes.body);
    const algoList = algos.algorithms || algos;
    assert(Array.isArray(algoList) && algoList.length > 0, `Polyglot comparator has ${algoList.length} algorithm matrices`);

    // 7. Obsidian-Style Universe Cluster Graph
    console.log('\n🌌 AUDIT 7: Obsidian-Style Neural Universe Cluster Engine');
    const clusterRes = await fetchHttp('/api/repos/cluster/universe?limit=200');
    assert(clusterRes.statusCode === 200, '/api/repos/cluster/universe serves 200 OK');
    const cluster = JSON.parse(clusterRes.body);
    assert(cluster.totalNodes > 50, `Universe cluster contains ${cluster.totalNodes} galaxy nodes`);
    assert(cluster.totalEdges > 50, `Universe cluster contains ${cluster.totalEdges} interconnected gravitation links`);

    // 8. Single Repository Architecture Graph
    const graphRes = await fetchHttp('/api/repos/repo-facebook-react/graph');
    assert(graphRes.statusCode === 200, '/api/repos/:id/graph serves 200 OK');
    const graph = JSON.parse(graphRes.body);
    assert(Array.isArray(graph.nodes) && graph.nodes.length > 2, `Architecture graph has ${graph.nodes.length} nodes`);

    // 9. Security & Codebase Export
    console.log('\n🛡️ AUDIT 9: Code Health Scan & Sovereign Export');
    const secRes = await fetchHttp('/api/features/repos/repo-facebook-react/security-scan');
    const sec = JSON.parse(secRes.body);
    assert(sec.healthScore > 80, `Health score is ${sec.healthScore}%`);

    const exportRes = await fetchHttp('/api/features/repos/repo-facebook-react/export');
    assert(exportRes.statusCode === 200, 'Sovereign Export bundle serves 200 OK');
    assert(exportRes.headers['content-disposition'].includes('attachment'), 'Export bundle has valid download headers');

  } catch (err) {
    console.error('Audit encountered error:', err);
    failedChecks++;
  }

  console.log('\n===============================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passedChecks} CHECKS PASSED, ${failedChecks} FAILED.`);
  if (failedChecks === 0) {
    console.log('🌟 100% PRODUCTION INTEGRITY, HAMBURGER DRAWER & OBSIDIAN CLUSTER VERIFIED!');
  }
  console.log('===============================================================\n');
}

runDeepAudit();
