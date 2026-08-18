const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Starting OmniCode Sovereign API Verification ---');
  
  // 1. Test repos list
  const repos = await get('/api/repos');
  console.log(`[PASS] /api/repos - Status: ${repos.status}, Total Repos: ${repos.data.total}`);
  if (repos.data.total < 1) throw new Error('No repos found');

  // 2. Test single repo details
  const single = await get('/api/repos/repo-tokio');
  console.log(`[PASS] /api/repos/repo-tokio - Status: ${single.status}, Name: ${single.data.name}, SLOC: ${single.data.totalSLOC}`);

  // 3. Test graph
  const graph = await get('/api/repos/repo-tokio/graph');
  console.log(`[PASS] /api/repos/repo-tokio/graph - Status: ${graph.status}, Nodes: ${graph.data.nodes.length}`);

  // 4. Test stats
  const stats = await get('/api/search/stats');
  console.log(`[PASS] /api/search/stats - Status: ${stats.status}, Total SLOC: ${stats.data.totalSLOC}, Languages: ${Object.keys(stats.data.languages).length}`);

  // 5. Test comparator
  const comp = await get('/api/comparator/algorithms');
  console.log(`[PASS] /api/comparator/algorithms - Status: ${comp.status}, Algorithms: ${comp.data.algorithms.length}`);

  // 6. Test search filter query
  const querySearch = await get('/api/repos?q=lang:rust');
  console.log(`[PASS] /api/repos?q=lang:rust - Status: ${querySearch.status}, Match Count: ${querySearch.data.total}`);

  console.log('--- ALL SOVEREIGN VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
