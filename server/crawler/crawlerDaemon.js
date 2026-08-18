/**
 * OmniCode Sovereign Crawler Daemon & High-Speed Pipeline Master
 * Coordinates manual tasks and the continuous 100+ repos/min harvest pipeline.
 */

const EventEmitter = require('events');
const { cloneAndIndexPublicRepo, scanDirectoryRecursively } = require('./gitEngine');
const { scrapePublicRepositoryFast } = require('./forgeScraper');
const HighSpeedHarvestPipeline = require('./highSpeedHarvestPipeline');

class CrawlerDaemon extends EventEmitter {
  constructor(indexStore) {
    super();
    this.indexStore = indexStore;
    this.queue = [];
    this.isProcessing = false;
    this.logHistory = [];

    // Initialize High-Speed Multi-Worker Pipeline (150 repos/min default)
    this.pipeline = new HighSpeedHarvestPipeline(indexStore.storage, this);

    this.bindPipelineEvents();
  }

  bindPipelineEvents() {
    this.on('repo-indexed', (repo) => {
      this.indexStore.indexRecordInMemory(repo);
      this.log('success', `[Harvest Pipeline] Indexed: ${repo.fullName} (${repo.primaryLanguage}, ${repo.stars}★, ${repo.license})`);
    });

    this.on('batch-indexed', (batchInfo) => {
      this.emit('stats-updated', this.getStats());
    });
  }

  log(level, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    };
    this.logHistory.unshift(entry);
    if (this.logHistory.length > 300) this.logHistory.pop();
    this.emit('crawler-log', entry);
  }

  enqueue(task) {
    this.queue.push(task);
    this.log('info', `Enqueued manual task for: ${task.target} (${task.type})`);
    this.emit('queue-updated', { queueLength: this.queue.length });
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const task = this.queue.shift();

    try {
      this.log('info', `Running shallow wire clone/scraper on: ${task.target}`);
      let repoRecord = null;

      if (task.type === 'git_url') {
        repoRecord = await cloneAndIndexPublicRepo(task.target, undefined, (progress) => {
          this.log('debug', progress.message);
        });
      } else if (task.type === 'forge_scrape') {
        const parts = task.target.split('/');
        const repo = parts.pop();
        const owner = parts.pop();
        const forge = task.options?.forge || 'github';
        repoRecord = await scrapePublicRepositoryFast(owner, repo, forge, task.options?.sampleFiles);
      } else if (task.type === 'local_dir') {
        const analysis = scanDirectoryRecursively(task.target);
        repoRecord = {
          id: `local_${Date.now()}`,
          name: task.target.split(/[/\\]/).pop(),
          fullName: `local/${task.target.split(/[/\\]/).pop()}`,
          gitUrl: `file://${task.target}`,
          sourceForge: 'Local Workspace',
          description: `Locally ingested code directory at ${task.target}`,
          stars: 1,
          forks: 0,
          indexedAt: new Date().toISOString(),
          ...analysis
        };
      }

      if (repoRecord) {
        this.indexStore.addRepository(repoRecord);
        this.log('success', `Manually indexed "${repoRecord.fullName}" (${repoRecord.fileCount} files, ${repoRecord.totalSLOC} SLOC)`);
        this.emit('repo-indexed', repoRecord);
      }
    } catch (err) {
      this.log('error', `Task failed on ${task.target}: ${err.message}`);
    } finally {
      this.isProcessing = false;
      this.emit('stats-updated', this.getStats());
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  setHarvestSpeed(ratePerMin) {
    this.pipeline.setSpeed(ratePerMin);
    this.log('info', `High-Speed Harvester speed adjusted to: ${ratePerMin} codebases/min`);
    this.emit('stats-updated', this.getStats());
  }

  toggleAutoHarvest(active) {
    this.pipeline.toggle(active);
    this.log('info', `Autonomous harvester is now ${active ? 'ACTIVE' : 'PAUSED'}`);
    this.emit('stats-updated', this.getStats());
  }

  getStats() {
    return {
      status: this.pipeline.isRunning ? 'autonomous-harvesting' : 'paused',
      harvestRate: this.pipeline.stats.currentBatchRate,
      activeWorkers: this.pipeline.workersCount,
      totalIndexed: this.indexStore.count(),
      totalFilesParsed: this.indexStore.getAggregationStats().totalFiles,
      totalLinesScanned: this.indexStore.getAggregationStats().totalSLOC,
      queueLength: this.queue.length,
      storeCount: this.indexStore.count()
    };
  }

  getRecentLogs() {
    return this.logHistory.slice(0, 80);
  }
}

module.exports = CrawlerDaemon;
