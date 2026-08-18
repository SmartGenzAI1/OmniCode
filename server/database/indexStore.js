/**
 * OmniCode Inverted Index & Fast Storage Store
 * Integrates with SovereignStorageEngine for scalable persistence and high-speed in-memory lookups.
 */

const SovereignStorageEngine = require('./sovereignStorageEngine');
const { SEED_REPOSITORIES } = require('./seedData');
const { FLAGSHIP_REPOSITORIES, generateUltraWarpRepository } = require('./massiveRealRegistry');
const { createSyntheticRepoRecord } = require('../crawler/autonomousHarvester');

class IndexStore {
  constructor() {
    this.storage = new SovereignStorageEngine();
    this.invertedIndex = new Map(); // token -> Set<repoId>
    this.symbolIndex = new Map();   // symbol -> Set<{repoId, filePath, line, type}>
    this.languageIndex = new Map(); // lang -> Set<repoId>
    this.domainIndex = new Map();   // domain -> Set<repoId>
    this.licenseIndex = new Map();  // license -> Set<repoId>

    this.init();
  }

  init() {
    // If storage has fewer than 2000 codebases (e.g. serverless cold start), seed full catalog
    if (this.storage.count() < 2000) {
      // 1. Hand-crafted flagship deep trees
      SEED_REPOSITORIES.forEach(repo => this.addRepository(repo, false));
      
      // 2. Real flagship open-source registry (React, Linux, Vue, Rust, Kubernetes, etc.)
      FLAGSHIP_REPOSITORIES.forEach(entry => {
        const record = createSyntheticRepoRecord(entry);
        this.addRepository(record, false);
      });

      // 3. Ultra-warp multi-language generative registry up to 2,500 repositories
      const targetCount = 2500;
      for (let i = 1; i <= targetCount; i++) {
        const descriptor = generateUltraWarpRepository(i);
        const record = createSyntheticRepoRecord(descriptor);
        this.addRepository(record, false);
      }

      this.storage.flushToDisk();
      console.log(`[OmniIndexStore] Pre-seeded ${this.storage.count()} high-performance codebases into memory index.`);
    } else {
      // Re-index loaded records
      for (const repo of this.storage.getAll()) {
        this.indexRecordInMemory(repo);
      }
      console.log(`[OmniIndexStore] Restored ${this.storage.count()} codebases from storage.`);
    }
  }

  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .split(/[^a-zA-Z0-9_\-\.\#\+]+/)
      .filter(t => t.length > 1);
  }

  indexRecordInMemory(repo) {
    if (!repo || !repo.id) return;

    // Index primary language & secondary languages
    if (repo.primaryLanguage) {
      if (!this.languageIndex.has(repo.primaryLanguage)) {
        this.languageIndex.set(repo.primaryLanguage, new Set());
      }
      this.languageIndex.get(repo.primaryLanguage).add(repo.id);
    }
    if (Array.isArray(repo.languages)) {
      repo.languages.forEach(l => {
        if (!this.languageIndex.has(l.name)) {
          this.languageIndex.set(l.name, new Set());
        }
        this.languageIndex.get(l.name).add(repo.id);
      });
    }

    // Index Domain & License
    if (repo.domain) {
      if (!this.domainIndex.has(repo.domain)) {
        this.domainIndex.set(repo.domain, new Set());
      }
      this.domainIndex.get(repo.domain).add(repo.id);
    }
    if (repo.license) {
      if (!this.licenseIndex.has(repo.license)) {
        this.licenseIndex.set(repo.license, new Set());
      }
      this.licenseIndex.get(repo.license).add(repo.id);
    }

    // Inverted Full-text Tokens
    const fullText = `${repo.name} ${repo.fullName} ${repo.description || ''} ${repo.primaryLanguage || ''} ${repo.domain || ''} ${repo.license || ''}`;
    const tokens = this.tokenize(fullText);
    tokens.forEach(tok => {
      if (!this.invertedIndex.has(tok)) {
        this.invertedIndex.set(tok, new Set());
      }
      this.invertedIndex.get(tok).add(repo.id);
    });

    // AST Symbols Indexing
    if (Array.isArray(repo.files)) {
      repo.files.forEach(file => {
        if (Array.isArray(file.symbols)) {
          file.symbols.forEach(sym => {
            const symName = sym.name.toLowerCase();
            if (!this.symbolIndex.has(symName)) {
              this.symbolIndex.set(symName, []);
            }
            this.symbolIndex.get(symName).push({
              repoId: repo.id,
              repoName: repo.name,
              filePath: file.path,
              line: sym.line,
              type: sym.type,
              signature: sym.signature
            });
          });
        }
      });
    }
  }

  addRepository(repo, persist = true) {
    if (!repo) return;
    const fullName = (repo.fullName || repo.name || '').trim();
    if (!fullName) return;
    const normalizedKey = fullName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const normalizedId = `repo_${normalizedKey}`;

    // Check if an existing repo with same fullName (case-insensitive) or same name exists in storage
    const all = this.storage.getAll();
    const existing = all.find(r => {
      const fn = (r.fullName || r.name || '').toLowerCase().trim();
      return fn === fullName.toLowerCase() || (r.id && (r.id === repo.id || r.id === normalizedId));
    });

    if (existing) {
      if (existing.id && existing.id !== normalizedId) {
        this.storage.delete(existing.id);
      }
      repo.id = normalizedId;
    } else {
      repo.id = repo.id || normalizedId;
    }

    this.storage.insertOrUpdate(repo);
    this.indexRecordInMemory(repo);

    if (persist) {
      try {
        const universalDb = require('./universalDbConnector');
        if (universalDb.isConnected) {
          universalDb.insertRepository(repo).catch(() => {});
        }
      } catch (_) {}
    }
  }

  getRepositoryById(id) {
    return this.storage.get(id);
  }

  getAllRepositories() {
    const rawList = this.storage.getAll();
    const seen = new Map();
    for (const repo of rawList) {
      const key = (repo.fullName || repo.name || repo.id || '').toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, repo);
      } else {
        const prev = seen.get(key);
        if ((repo.stars || 0) > (prev.stars || 0) || ((repo.files?.length || 0) > (prev.files?.length || 0))) {
          seen.set(key, repo);
        }
      }
    }
    return Array.from(seen.values());
  }

  count() {
    return this.getAllRepositories().length;
  }

  saveSnapshot() {
    this.storage.flushToDisk();
  }

  /**
   * Search repositories with query parser, filters, sorting and pagination
   */
  search(queryStr = '', filters = {}, page = 1, limit = 50) {
    let candidates = this.getAllRepositories();

    // Parse operators from query string
    let searchTokens = [];
    const rawTokens = queryStr.split(/\s+/);
    const parsedFilters = { ...filters };

    for (const raw of rawTokens) {
      if (raw.startsWith('lang:')) {
        parsedFilters.language = raw.replace('lang:', '').trim();
      } else if (raw.startsWith('license:')) {
        parsedFilters.license = raw.replace('license:', '').trim();
      } else if (raw.startsWith('domain:')) {
        parsedFilters.domain = raw.replace('domain:', '').replace(/['"]/g, '').trim();
      } else if (raw.startsWith('stars:>')) {
        parsedFilters.minStars = parseInt(raw.replace('stars:>', ''), 10);
      } else if (raw.startsWith('sort:')) {
        parsedFilters.sortBy = raw.replace('sort:', '').trim();
      } else if (raw.length > 0) {
        searchTokens.push(raw.toLowerCase());
      }
    }

    // Filter by text tokens
    if (searchTokens.length > 0) {
      candidates = candidates.filter(repo => {
        const repoStr = `${repo.name} ${repo.fullName} ${repo.description} ${repo.primaryLanguage} ${repo.domain}`.toLowerCase();
        return searchTokens.every(tok => repoStr.includes(tok));
      });
    }

    // Filter by Language
    if (parsedFilters.language && parsedFilters.language !== 'all') {
      const targetLang = parsedFilters.language.toLowerCase();
      candidates = candidates.filter(r => 
        (r.primaryLanguage && r.primaryLanguage.toLowerCase() === targetLang) ||
        (Array.isArray(r.languages) && r.languages.some(l => l.name.toLowerCase() === targetLang))
      );
    }

    // Filter by Domain
    if (parsedFilters.domain && parsedFilters.domain !== 'all') {
      const targetDomain = parsedFilters.domain.toLowerCase();
      candidates = candidates.filter(r => r.domain && r.domain.toLowerCase().includes(targetDomain));
    }

    // Filter by License
    if (parsedFilters.license && parsedFilters.license !== 'all') {
      const targetLicense = parsedFilters.license.toLowerCase();
      candidates = candidates.filter(r => r.license && r.license.toLowerCase() === targetLicense);
    }

    // Filter by Min Stars
    if (parsedFilters.minStars) {
      candidates = candidates.filter(r => (r.stars || 0) >= parsedFilters.minStars);
    }

    // Dynamic Sorting
    const sortBy = parsedFilters.sortBy || 'stars';
    const sortOrder = parsedFilters.sortOrder || 'desc';

    candidates.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'stars') {
        valA = a.stars || 0;
        valB = b.stars || 0;
      } else if (sortBy === 'sloc') {
        valA = a.totalSLOC || 0;
        valB = b.totalSLOC || 0;
      } else if (sortBy === 'complexity') {
        valA = parseFloat(a.averageComplexity) || 0;
        valB = parseFloat(b.averageComplexity) || 0;
      } else if (sortBy === 'health') {
        valA = a.healthScore || 0;
        valB = b.healthScore || 0;
      } else if (sortBy === 'files') {
        valA = a.fileCount || 0;
        valB = b.fileCount || 0;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = candidates.length;
    const startIndex = (page - 1) * limit;
    const paginated = limit > 0 ? candidates.slice(startIndex, startIndex + limit) : candidates;

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / (limit || 50)),
      results: paginated
    };
  }

  searchSymbols(symbolQuery = '') {
    if (!symbolQuery) return [];
    const q = symbolQuery.toLowerCase();
    const results = [];

    for (const [sym, matches] of this.symbolIndex.entries()) {
      if (sym.includes(q)) {
        results.push(...matches);
        if (results.length >= 50) break;
      }
    }
    return results;
  }

  getAggregationStats() {
    const repos = this.storage.getAll();
    const langDistribution = {};
    const domainDistribution = {};
    const licenseDistribution = {};
    let totalSLOC = 0;
    let totalFiles = 0;

    repos.forEach(r => {
      totalSLOC += r.totalSLOC || 0;
      totalFiles += r.fileCount || 0;
      
      const lang = r.primaryLanguage || 'Other';
      langDistribution[lang] = (langDistribution[lang] || 0) + 1;

      const domain = r.domain || 'Other';
      domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;

      const license = r.license || 'Unknown';
      licenseDistribution[license] = (licenseDistribution[license] || 0) + 1;
    });

    return {
      totalRepos: repos.length,
      totalSLOC,
      totalFiles,
      languages: langDistribution,
      domains: domainDistribution,
      licenses: licenseDistribution
    };
  }
}

module.exports = IndexStore;
