/**
 * OmniCode Crawler & Mission Control Router
 */

const express = require('express');

module.exports = function createCrawlerRouter(crawlerDaemon) {
  const router = express.Router();

  // Enqueue a new crawl task
  router.post('/enqueue', (req, res) => {
    const { url, type = 'git_url', options = {} } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL or target is required.' });
    }

    crawlerDaemon.enqueue({
      type,
      target: url,
      options
    });

    res.json({
      status: 'queued',
      message: `Enqueued ${url} for sovereign indexing.`,
      stats: crawlerDaemon.getStats()
    });
  });

  // Toggle Auto-Harvester (on/off)
  router.post('/auto-harvest/toggle', (req, res) => {
    const { active } = req.body;
    crawlerDaemon.toggleAutoHarvest(Boolean(active));
    res.json({
      active: crawlerDaemon.pipeline.isRunning,
      stats: crawlerDaemon.getStats()
    });
  });

  // Change Auto-Harvester speed (rate: 60, 150, 300 repos/min)
  router.post('/auto-harvest/speed', (req, res) => {
    const { rate } = req.body;
    crawlerDaemon.setHarvestSpeed(Number(rate) || 150);
    res.json({
      harvestRate: crawlerDaemon.pipeline.stats.currentBatchRate,
      stats: crawlerDaemon.getStats()
    });
  });

  // Get current crawler stats
  router.get('/stats', (req, res) => {
    res.json({
      stats: crawlerDaemon.getStats(),
      recentLogs: crawlerDaemon.getRecentLogs()
    });
  });

  // Server-Sent Events (SSE) Live Log and Telemetry Stream
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'init', stats: crawlerDaemon.getStats(), logs: crawlerDaemon.getRecentLogs() })}\n\n`);

    const logListener = (entry) => {
      res.write(`data: ${JSON.stringify({ type: 'log', data: entry })}\n\n`);
    };

    const statsListener = (stats) => {
      res.write(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`);
    };

    const repoIndexedListener = (repo) => {
      res.write(`data: ${JSON.stringify({ type: 'repo_indexed', data: repo })}\n\n`);
    };

    crawlerDaemon.on('crawler-log', logListener);
    crawlerDaemon.on('stats-updated', statsListener);
    crawlerDaemon.on('repo-indexed', repoIndexedListener);

    req.on('close', () => {
      crawlerDaemon.off('crawler-log', logListener);
      crawlerDaemon.off('stats-updated', statsListener);
      crawlerDaemon.off('repo-indexed', repoIndexedListener);
    });
  });

  return router;
};
