/**
 * OmniCode Live Autonomous Multi-Source Codebase Harvester
 * Continuously discovers, crawls, extracts AST symbols, and indexes REAL public repositories
 * from GitHub Topics, GitHub Trending, GitLab, and Codeberg into the Sovereign Storage and Cloud Neon DB.
 */

const EventEmitter = require('events');
const { fetchRawContent, scrapePublicRepositoryFast } = require('./forgeScraper');
const universalDb = require('../database/universalDbConnector');

const CRAWL_TOPICS = [
  'rust', 'golang', 'typescript', 'javascript', 'python', 'cplusplus', 'zig',
  'linux', 'operating-system', 'compiler', 'database', 'deep-learning', 'machine-learning',
  'kubernetes', 'docker', 'blockchain', 'solidity', 'react', 'vue', 'nextjs',
  'web-framework', 'terminal', 'neovim', 'cli', 'security', 'cryptography',
  'distributed-systems', 'game-engine', 'godot', 'vulkan', 'embedded', 'llm'
];

const TRENDING_LANGUAGES = [
  '', 'rust', 'go', 'python', 'typescript', 'javascript', 'c++', 'c', 'zig', 'elixir', 'lua'
];

class LiveAutonomousCrawler extends EventEmitter {
  constructor(indexStore, concurrency = 2) {
    super();
    this.indexStore = indexStore;
    this.concurrency = concurrency;
    this.isRunning = true;
    this.crawledIds = new Set();
    this.discoveredQueue = [];
    this.currentTopicIndex = 0;
    this.currentTrendingIndex = 0;
    this.intervalId = null;
    this.isProcessingBatch = false;
    this.stats = {
      totalRealCrawled: 0,
      totalDiscovered: 0,
      lastCrawledRepo: null,
      lastSource: 'GitHub Public Explore'
    };

    // Populate already indexed IDs
    if (this.indexStore) {
      const existing = this.indexStore.getAllRepositories();
      existing.forEach(r => {
        if (r && (r.fullName || r.name)) {
          this.crawledIds.add((r.fullName || r.name).toLowerCase());
        }
      });
    }

    // Auto-start continuous harvesting if on long-running node environment
    if (process.env.NODE_ENV !== 'test') {
      this.startContinuousHarvest();
    }
  }

  log(level, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    };
    this.emit('crawler-log', entry);
  }

  startContinuousHarvest() {
    this.isRunning = true;
    // Discover & crawl a real batch every 15 seconds on active servers
    this.intervalId = setInterval(() => {
      if (this.isRunning && !this.isProcessingBatch) {
        this.harvestNextRealBatch(2).catch(() => {});
      }
    }, 15000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Discovers real GitHub repositories from Topics pages
   */
  async discoverFromGitHubTopic(topic) {
    try {
      const url = `https://github.com/topics/${encodeURIComponent(topic)}?s=stars&o=desc`;
      const html = await fetchRawContent(url);
      const regex = /href="\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)"/g;
      const found = [];
      const ignored = new Set([
        'topics', 'collections', 'features', 'explore', 'orgs', 'sponsors',
        'site', 'customer-stories', 'readme', 'security', 'pricing', 'enterprise',
        'about', 'login', 'signup', 'join'
      ]);

      let match;
      while ((match = regex.exec(html)) !== null) {
        const owner = match[1];
        const repo = match[2];
        if (!ignored.has(owner.toLowerCase()) && !ignored.has(repo.toLowerCase()) && !owner.includes('.') && !repo.includes('.')) {
          const fullName = `${owner}/${repo}`;
          if (!this.crawledIds.has(fullName.toLowerCase())) {
            found.push({ owner, repo, forge: 'github', source: `GitHub Topic: ${topic}` });
          }
        }
      }

      return Array.from(new Set(found.map(f => `${f.owner}/${f.repo}`)))
        .map(str => {
          const [owner, repo] = str.split('/');
          return { owner, repo, forge: 'github', source: `GitHub Topic: ${topic}` };
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * Discovers real trending GitHub repositories
   */
  async discoverFromGitHubTrending(lang = '') {
    try {
      const url = lang ? `https://github.com/trending/${encodeURIComponent(lang)}` : 'https://github.com/trending';
      const html = await fetchRawContent(url);
      const regex = /href="\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)"/g;
      const found = [];
      const ignored = new Set(['topics', 'collections', 'features', 'explore', 'trending', 'orgs', 'sponsors', 'site']);

      let match;
      while ((match = regex.exec(html)) !== null) {
        const owner = match[1];
        const repo = match[2];
        if (!ignored.has(owner.toLowerCase()) && !ignored.has(repo.toLowerCase()) && !owner.includes('.') && !repo.includes('.')) {
          const fullName = `${owner}/${repo}`;
          if (!this.crawledIds.has(fullName.toLowerCase())) {
            found.push({ owner, repo, forge: 'github', source: `GitHub Trending ${lang || 'Global'}` });
          }
        }
      }

      return Array.from(new Set(found.map(f => `${f.owner}/${f.repo}`)))
        .map(str => {
          const [owner, repo] = str.split('/');
          return { owner, repo, forge: 'github', source: `GitHub Trending ${lang || 'Global'}` };
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * Discovers public projects from GitLab public API
   */
  async discoverFromGitLab() {
    try {
      const raw = await fetchRawContent('https://gitlab.com/api/v4/projects?order_by=star_count&sort=desc&per_page=20');
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];

      const found = [];
      for (const item of data) {
        if (item.path_with_namespace) {
          const parts = item.path_with_namespace.split('/');
          const repo = parts.pop();
          const owner = parts.join('/');
          const fullName = `${owner}/${repo}`;
          if (!this.crawledIds.has(fullName.toLowerCase())) {
            found.push({ owner, repo, forge: 'gitlab', source: 'GitLab Public Registry' });
          }
        }
      }
      return found;
    } catch (e) {
      return [];
    }
  }

  /**
   * Harvests next batch of real repositories from discovered sources
   */
  async harvestNextRealBatch(batchCount = 2) {
    if (this.isProcessingBatch) return { count: 0, indexed: [] };
    this.isProcessingBatch = true;

    const indexedRepos = [];

    try {
      // 1. Replenish queue if low
      if (this.discoveredQueue.length < batchCount * 2) {
        const topic = CRAWL_TOPICS[this.currentTopicIndex % CRAWL_TOPICS.length];
        this.currentTopicIndex++;
        const lang = TRENDING_LANGUAGES[this.currentTrendingIndex % TRENDING_LANGUAGES.length];
        this.currentTrendingIndex++;

        this.log('info', `[Autonomous Discovery] Scanning GitHub topic "${topic}" and trending "${lang || 'all'}"...`);

        const [topicRepos, trendingRepos, gitlabRepos] = await Promise.all([
          this.discoverFromGitHubTopic(topic),
          this.discoverFromGitHubTrending(lang),
          this.discoverFromGitLab()
        ]);

        const combined = [...topicRepos, ...trendingRepos, ...gitlabRepos];
        for (const item of combined) {
          const key = `${item.owner}/${item.repo}`.toLowerCase();
          if (!this.crawledIds.has(key)) {
            this.discoveredQueue.push(item);
          }
        }
        this.stats.totalDiscovered = this.discoveredQueue.length;
      }

      // 2. Process up to batchCount repositories
      const toCrawl = this.discoveredQueue.splice(0, batchCount);

      for (const target of toCrawl) {
        const key = `${target.owner}/${target.repo}`.toLowerCase();
        if (this.crawledIds.has(key)) continue;

        try {
          this.log('info', `[Wire Scraper] Deep-crawling real public repo: ${target.owner}/${target.repo} (${target.forge})...`);
          const repoRecord = await scrapePublicRepositoryFast(target.owner, target.repo, target.forge);

          if (repoRecord && repoRecord.id) {
            // Save to memory store
            this.indexStore.addRepository(repoRecord, true);
            this.crawledIds.add(key);

            // Persist to Neon PostgreSQL Database
            if (universalDb.isConnected) {
              universalDb.insertRepository(repoRecord).catch(err => {
                console.warn('[CloudDB] Auto-sync insert note:', err.message);
              });
            }

            indexedRepos.push(repoRecord);
            this.stats.totalRealCrawled++;
            this.stats.lastCrawledRepo = repoRecord.fullName;
            this.stats.lastSource = target.source;

            this.log('success', `[Indexed] Successfully parsed and added "${repoRecord.fullName}" (${repoRecord.primaryLanguage}, ${repoRecord.stars}★, ${repoRecord.totalSLOC} SLOC) to Database!`);
            this.emit('repo-indexed', repoRecord);
          }
        } catch (scrapeErr) {
          this.log('warn', `Skipping ${target.owner}/${target.repo}: ${scrapeErr.message}`);
        }
      }

      if (indexedRepos.length > 0) {
        this.emit('batch-indexed', {
          count: indexedRepos.length,
          items: indexedRepos
        });
      }
    } catch (err) {
      this.log('error', `Autonomous harvest batch error: ${err.message}`);
    } finally {
      this.isProcessingBatch = false;
    }

    return {
      count: indexedRepos.length,
      indexed: indexedRepos,
      stats: this.getStats()
    };
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      queueLength: this.discoveredQueue.length,
      totalRealCrawled: this.stats.totalRealCrawled,
      lastCrawledRepo: this.stats.lastCrawledRepo,
      lastSource: this.stats.lastSource,
      totalIndexedInStore: this.indexStore ? this.indexStore.count() : 0,
      isDbConnected: universalDb.isConnected,
      dbProvider: universalDb.providerName
    };
  }
}

module.exports = LiveAutonomousCrawler;
