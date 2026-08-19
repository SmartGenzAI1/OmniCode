/**
 * OmniCode Repositories API Router & Obsidian Universe Cluster Engine
 */

const express = require('express');
const { scrapeLivePublicMeta } = require('../crawler/forgeScraper');

module.exports = function createReposRouter(indexStore, crawlerDaemon, ensureDbRestored) {
  const router = express.Router();

  // 1. List & Filter Repositories with Pagination
  router.get('/', async (req, res) => {
    if (typeof ensureDbRestored === 'function') {
      await Promise.race([
        ensureDbRestored(),
        new Promise(resolve => setTimeout(resolve, 150))
      ]).catch(() => {});
    }

    const { q, language, domain, license, minStars, sortBy, sortOrder, page = 1, limit = 60 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(150, Math.max(1, parseInt(limit, 10) || 60));

    const result = indexStore.search(q || '', {
      language,
      domain,
      license,
      minStars: minStars ? parseInt(minStars, 10) : undefined,
      sortBy,
      sortOrder
    }, pageNum, limitNum);

    res.json({
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      repositories: result.results.map(r => {
        const owner = r.owner || ((r.fullName && r.fullName.includes('/')) ? r.fullName.split('/')[0] : (r.name || 'repo'));
        const fullName = r.fullName || `${owner}/${r.name || 'project'}`;
        const ownerAvatar = r.ownerAvatar || (r.sourceForge === 'GitLab' 
          ? `https://gitlab.com/uploads/-/system/user/avatar/${encodeURIComponent(owner)}/avatar.png`
          : `https://github.com/${encodeURIComponent(owner)}.png?size=72`);
        const gitUrl = r.gitUrl || `https://github.com/${fullName}.git`;
        const healthScore = typeof r.healthScore === 'number' ? r.healthScore : 95;
        const files = Array.isArray(r.files) ? r.files : [];
        const fileCount = r.fileCount || files.length;

        return {
          id: r.id,
          name: r.name,
          fullName: fullName,
          owner: owner,
          ownerAvatar: ownerAvatar,
          gitUrl: gitUrl,
          description: r.description || '',
          primaryLanguage: r.primaryLanguage || 'Other',
          languages: r.languages || [{ name: r.primaryLanguage || 'Other', percentage: 100 }],
          domain: r.domain || 'General',
          license: r.license || 'MIT',
          stars: r.stars || 0,
          forks: r.forks || 0,
          healthScore: healthScore,
          fileCount: fileCount,
          totalSLOC: r.totalSLOC || 0,
          totalLines: r.totalLines || files.reduce((acc, f) => acc + (f.totalLines || 0), 0),
          totalComments: r.totalComments || 0,
          averageComplexity: r.averageComplexity || 3.5,
          sourceForge: r.sourceForge || 'GitHub',
          indexedAt: r.indexedAt || new Date().toISOString(),
          files: files,
          graph: r.graph || null,
          readme: r.readme || ''
        };
      })
    });
  });

  // 2. Obsidian Live Universe Cluster Engine (All Repositories Clustered by Galaxy / Language)
  router.get('/cluster/universe', (req, res) => {
    const allRepos = indexStore.getAllRepositories();
    const limit = parseInt(req.query.limit, 10) || 300;
    const slice = allRepos.slice(0, limit);

    const langClusters = {};
    const nodes = [];
    const edges = [];

    // Group repos into language solar systems
    slice.forEach((repo) => {
      const lang = repo.primaryLanguage || 'Other';
      if (!langClusters[lang]) {
        langClusters[lang] = [];
      }
      langClusters[lang].push(repo);

      nodes.push({
        id: repo.id,
        label: repo.name,
        fullName: repo.fullName,
        type: 'repository',
        language: lang,
        domain: repo.domain || 'Systems',
        stars: repo.stars || 100,
        sloc: repo.totalSLOC || 1000
      });
    });

    // Create language hub centers and interconnect within clusters
    Object.entries(langClusters).forEach(([lang, repos]) => {
      const hubId = `hub_${lang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      nodes.push({
        id: hubId,
        label: `${lang} Galaxy (${repos.length})`,
        type: 'galaxy_hub',
        language: lang,
        stars: 999999,
        sloc: 999999
      });

      // Connect repos to their galaxy hub and interlink top repos
      repos.forEach((repo, i) => {
        edges.push({ source: hubId, target: repo.id, strength: 0.8 });

        if (i > 0 && i < 15 && i % 2 === 0) {
          edges.push({ source: repos[i - 1].id, target: repo.id, strength: 0.3 });
        }
      });
    });

    // Interconnect Galaxy Hubs to each other in a central ring
    const hubIds = Object.keys(langClusters).map(lang => `hub_${lang.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    for (let i = 0; i < hubIds.length; i++) {
      const next = (i + 1) % hubIds.length;
      edges.push({ source: hubIds[i], target: hubIds[next], strength: 0.15 });
    }

    res.json({
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodes,
      edges
    });
  });

  // 3. Live Sync / Refresh a repository directly from public Forge HTML
  router.get('/:id/live-sync', async (req, res) => {
    const repo = indexStore.getRepositoryById(req.params.id);
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    try {
      const [owner, repoName] = repo.fullName.split('/');
      if (owner && repoName) {
        const live = await scrapeLivePublicMeta(owner, repoName);
        if (live.stars > 0) repo.stars = live.stars;
        if (live.forks > 0) repo.forks = live.forks;
        if (live.desc) repo.description = live.desc;
        indexStore.addRepository(repo, true);
      }
      res.json({ success: true, repo });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Get Single Repository Details
  router.get('/:id', async (req, res) => {
    if (typeof ensureDbRestored === 'function') {
      await Promise.race([
        ensureDbRestored(),
        new Promise(resolve => setTimeout(resolve, 150))
      ]).catch(() => {});
    }

    const repo = indexStore.getRepositoryById(req.params.id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found in sovereign index.' });
    }

    const owner = repo.owner || ((repo.fullName && repo.fullName.includes('/')) ? repo.fullName.split('/')[0] : (repo.name || 'repo'));
    const fullName = repo.fullName || `${owner}/${repo.name || 'project'}`;
    const ownerAvatar = repo.ownerAvatar || (repo.sourceForge === 'GitLab' 
      ? `https://gitlab.com/uploads/-/system/user/avatar/${encodeURIComponent(owner)}/avatar.png`
      : `https://github.com/${encodeURIComponent(owner)}.png?size=72`);
    const gitUrl = repo.gitUrl || `https://github.com/${fullName}.git`;
    const healthScore = typeof repo.healthScore === 'number' ? repo.healthScore : 95;
    const files = Array.isArray(repo.files) ? repo.files : [];
    const fileCount = repo.fileCount || files.length;

    const enriched = {
      ...repo,
      id: repo.id,
      name: repo.name,
      fullName: fullName,
      owner: owner,
      ownerAvatar: ownerAvatar,
      gitUrl: gitUrl,
      healthScore: healthScore,
      fileCount: fileCount,
      files: files,
      languages: repo.languages || [{ name: repo.primaryLanguage || 'Other', percentage: 100 }],
      readme: repo.readme || '',
      graph: repo.graph || null
    };

    res.json(enriched);
  });

  // 5. Get Specific File Content & AST
  router.get('/:id/file', (req, res) => {
    const repo = indexStore.getRepositoryById(req.params.id);
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Missing path query parameter' });

    const file = repo.files?.find(f => f.path === filePath);
    if (!file) return res.status(404).json({ error: 'File not found in indexed repository' });

    res.json(file);
  });

  // 6. Get Single Repository Architecture Graph
  router.get('/:id/graph', (req, res) => {
    const repo = indexStore.getRepositoryById(req.params.id);
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    if (repo.graph && repo.graph.nodes && repo.graph.nodes.length > 2) {
      return res.json(repo.graph);
    }

    const nodes = [
      { id: repo.name, label: repo.fullName, type: 'hub', language: repo.primaryLanguage, sloc: repo.totalSLOC }
    ];
    const edges = [];
    
    const files = repo.files || [];
    const maxFiles = Math.min(files.length, 16);
    
    if (files.length === 0) {
      const subModules = ['core', 'runtime', 'compiler', 'ast', 'network', 'storage', 'types', 'cli'];
      subModules.forEach((mod, idx) => {
        nodes.push({
          id: `${repo.name}_${mod}`,
          label: mod,
          type: 'module',
          language: repo.primaryLanguage,
          sloc: Math.floor((repo.totalSLOC || 5000) / 8)
        });
        edges.push({ source: repo.name, target: `${repo.name}_${mod}` });
        if (idx > 0) {
          edges.push({ source: `${repo.name}_${subModules[idx - 1]}`, target: `${repo.name}_${mod}` });
        }
      });
    } else {
      for (let i = 0; i < maxFiles; i++) {
        const file = files[i];
        const fileId = file.path.split('/').pop() || file.path;
        nodes.push({
          id: fileId,
          label: fileId,
          type: 'module',
          language: file.language || repo.primaryLanguage,
          sloc: file.sloc || 120
        });
        edges.push({ source: repo.name, target: fileId });
        if (i > 0 && i % 3 === 0) {
          const prevId = files[i - 1].path.split('/').pop();
          edges.push({ source: prevId, target: fileId });
        }
      }
    }

    res.json({ nodes, edges });
  });

  return router;
};
