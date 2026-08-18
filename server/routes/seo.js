/**
 * OmniCode Automated SEO & Search Engine Indexing Engine
 * Generates dynamic XML sitemaps, robots.txt, Web Manifest, and
 * Server-Side Rendered (SSR) meta pages for Google, Bing, and DuckDuckGo.
 */

const express = require('express');

module.exports = function createSeoRouter(indexStore) {
  const router = express.Router();

  /**
   * Helper: Detect search engine crawlers
   */
  function isBot(userAgent) {
    if (!userAgent) return false;
    return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|twitterbot|linkedinbot|discordbot|whatsapp/i.test(userAgent);
  }

  // 1. Dynamic sitemap.xml for Google & Bing Indexing
  router.get('/sitemap.xml', (req, res) => {
    try {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      const repos = indexStore.getAllRepositories() || [];
      const stats = indexStore.getAggregationStats() || { languages: {}, domains: {} };

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

      // Static Hub Pages (use real paths, not hash fragments)
      const staticPages = [
        { path: '', priority: '1.0', changefreq: 'daily' },
        { path: 'explore', priority: '0.9', changefreq: 'daily' },
        { path: 'studio', priority: '0.9', changefreq: 'daily' },
        { path: 'symbols', priority: '0.9', changefreq: 'daily' },
        { path: 'comparator', priority: '0.8', changefreq: 'weekly' },
        { path: 'graph', priority: '0.7', changefreq: 'weekly' }
      ];

      const now = new Date().toISOString().split('T')[0];

      staticPages.forEach(p => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/${p.path}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      // Language Hub URLs (crawlable paths)
      Object.keys(stats.languages || {}).forEach(lang => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/explore/lang/${encodeURIComponent(lang.toLowerCase())}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      // Top Repository Index URLs (crawlable paths, up to 5,000)
      repos.slice(0, 5000).forEach(repo => {
        const repoDate = repo.indexedAt ? repo.indexedAt.split('T')[0] : now;
        const slug = encodeURIComponent(repo.fullName || repo.id);
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/repo/${slug}</loc>\n`;
        xml += `    <lastmod>${repoDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>${repo.stars > 10000 ? '0.9' : '0.7'}</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // 2. Automated robots.txt
  router.get('/robots.txt', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const robotsTxt = `User-agent: *
Allow: /
Allow: /explore
Allow: /repo/
Allow: /api/repos
Allow: /api/search
Allow: /assets/
Disallow: /api/features/repl/execute
Disallow: /api/crawler

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(robotsTxt);
  });

  // 3. Web App Manifest for Google PWA Indexing
  router.get('/manifest.json', (req, res) => {
    const manifest = {
      name: 'OmniCode Sovereign Meta-Forge',
      short_name: 'OmniCode',
      description: 'Autonomous Public Codebase Indexer, AST Symbol Analyzer & Polyglot Code Studio',
      start_url: '/',
      display: 'standalone',
      background_color: '#07090e',
      theme_color: '#07090e',
      icons: [
        {
          src: '/assets/logo.jpg',
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(manifest);
  });

  // 4. SSR Meta Pages for Search Engine Bots
  //    When Googlebot visits /repo/facebook/react, it gets full HTML with OG tags.
  //    Real users get the SPA which handles it client-side.
  router.get('/repo/:owner/:name', (req, res, next) => {
    const ua = req.get('user-agent') || '';
    if (!isBot(ua)) return next(); // Real users → SPA fallback

    const fullName = `${req.params.owner}/${req.params.name}`;
    const repos = indexStore.getAllRepositories();
    const repo = repos.find(r => r.fullName === fullName || r.id === fullName);

    if (!repo) return next();

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const langs = (repo.languages || []).map(l => l.name).join(', ') || repo.primaryLanguage || 'Multi-language';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${repo.fullName} - OmniCode Meta-Forge</title>
  <meta name="description" content="${(repo.description || '').replace(/"/g, '&quot;').slice(0, 160)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${baseUrl}/repo/${encodeURIComponent(repo.fullName)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/repo/${encodeURIComponent(repo.fullName)}">
  <meta property="og:title" content="${repo.fullName} - Code Analysis | OmniCode">
  <meta property="og:description" content="${(repo.description || '').replace(/"/g, '&quot;').slice(0, 200)}">
  <meta property="og:image" content="${baseUrl}/assets/logo.jpg">
  <meta property="og:site_name" content="OmniCode Meta-Forge">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${repo.fullName} - OmniCode">
  <meta name="twitter:description" content="${(repo.description || '').replace(/"/g, '&quot;').slice(0, 200)}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": "${repo.name}",
    "codeRepository": "${repo.gitUrl || ''}",
    "programmingLanguage": "${langs}",
    "license": "${repo.license || 'Unknown'}",
    "description": "${(repo.description || '').replace(/"/g, '\\"')}"
  }
  </script>
</head>
<body>
  <h1>${repo.fullName}</h1>
  <p>${repo.description || ''}</p>
  <ul>
    <li>Language: ${langs}</li>
    <li>Stars: ${(repo.stars || 0).toLocaleString()}</li>
    <li>Forks: ${(repo.forks || 0).toLocaleString()}</li>
    <li>License: ${repo.license || 'Unknown'}</li>
    <li>Domain: ${repo.domain || 'General'}</li>
    <li>SLOC: ${(repo.totalSLOC || 0).toLocaleString()}</li>
    <li>Files: ${repo.fileCount || 0}</li>
  </ul>
  <a href="${baseUrl}/">Explore more codebases on OmniCode</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
  });

  // Language pages for bots
  router.get('/explore/lang/:language', (req, res, next) => {
    const ua = req.get('user-agent') || '';
    if (!isBot(ua)) return next();

    const lang = decodeURIComponent(req.params.language);
    const repos = indexStore.getAllRepositories()
      .filter(r => (r.primaryLanguage || '').toLowerCase() === lang.toLowerCase())
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 100);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    let repoList = repos.map(r =>
      `<li><a href="${baseUrl}/repo/${encodeURIComponent(r.fullName)}">${r.fullName}</a> — ★${(r.stars || 0).toLocaleString()} — ${r.description || ''}</li>`
    ).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Top ${lang} Open Source Projects - OmniCode</title>
  <meta name="description" content="Explore the top ${repos.length} ${lang} open-source repositories indexed by OmniCode. AST analysis, code metrics, and more.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${baseUrl}/explore/lang/${encodeURIComponent(lang.toLowerCase())}">
  <meta property="og:title" content="Top ${lang} Projects - OmniCode">
  <meta property="og:description" content="Explore ${repos.length} ${lang} codebases with code analysis on OmniCode.">
  <meta property="og:image" content="${baseUrl}/assets/logo.jpg">
</head>
<body>
  <h1>Top ${lang} Open Source Projects</h1>
  <p>${repos.length} ${lang} codebases indexed and analyzed by OmniCode.</p>
  <ul>${repoList}</ul>
  <a href="${baseUrl}/">Explore all codebases on OmniCode</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
  });

  return router;
};
