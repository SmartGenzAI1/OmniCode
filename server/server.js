/**
 * OmniCode Sovereign Meta-Forge Server
 * Hardened Security Headers, Gzip/Brotli Compression, Automated SEO Engine,
 * High-Speed Pipeline, and Universal Cloud Database Connector (Vercel Ready).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const http = require('http');

// Core Subsystems
const OmniIndexStore = require('./database/indexStore');
const CrawlerDaemon = require('./crawler/crawlerDaemon');
const universalDb = require('./database/universalDbConnector');

// Route Handlers
const createReposRouter = require('./routes/repos');
const createSearchRouter = require('./routes/search');
const createComparatorRouter = require('./routes/comparator');
const createCrawlerRouter = require('./routes/crawler');
const createFeaturesRouter = require('./routes/features');
const createSeoRouter = require('./routes/seo');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Simple In-Memory Rate Limiter
const rateLimitStore = new Map();
function rateLimit(windowMs = 60000, maxRequests = 120) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);
    if (!record || now - record.start > windowMs) {
      rateLimitStore.set(ip, { start: now, count: 1 });
      return next();
    }
    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    next();
  };
}

// Periodically clean expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now - record.start > 120000) rateLimitStore.delete(ip);
  }
}, 60000);

// Initialize Core Singletons
const indexStore = new OmniIndexStore();
const crawlerDaemon = new CrawlerDaemon(indexStore);

// Two-Way Synchronization with Cloud PostgreSQL (Neon / Supabase)
if (process.env.DATABASE_URL) {
  universalDb.connect(process.env.DATABASE_URL).then(async () => {
    // 1. Restore any persistent repositories already in Neon PostgreSQL
    const cloudRepos = await universalDb.fetchAllRepositories(50000);
    if (cloudRepos.length > 0) {
      cloudRepos.forEach(r => indexStore.addRepository(r, false));
      console.log(`[CloudDB] Successfully restored and indexed ${cloudRepos.length} persistent repositories from Neon PostgreSQL.`);
    } else {
      // 2. First boot: Initialize and sync the full initial catalog to Neon
      const all = indexStore.getAllRepositories();
      const res = await universalDb.syncRepositories(all);
      console.log(`[CloudDB] First boot: Initialized ${res?.synced || 0} repositories into Neon Database.`);
    }
  }).catch(err => {
    console.warn(`[CloudDB] Cloud DB connection note: ${err.message}`);
  });
}

// 1. High-Performance Gzip Compression Middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 2. Hardened Security Headers & CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// 3. Body Parsing with Safe Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging with Timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500 || res.statusCode >= 400) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// 4. Mount SEO & Indexing Endpoints (Google / Bing / DuckDuckGo)
app.use('/', createSeoRouter(indexStore));

// 5. Mount API Routes
app.use('/api/repos', rateLimit(60000, 100), createReposRouter(indexStore));
app.use('/api/search', createSearchRouter(indexStore));
app.use('/api/comparator', createComparatorRouter());
app.use('/api/crawler', rateLimit(60000, 30), createCrawlerRouter(crawlerDaemon, indexStore));
app.use('/api/features', createFeaturesRouter(indexStore));

// 6. Fast Static Asset Delivery with Cache Control
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// 7. SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Sovereign Server if run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`⚡ OmniCode Sovereign Meta-Forge Engine is ONLINE`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📦 Pre-Indexed Public Repositories: ${indexStore.count()}`);
    console.log(`🚀 Automated SEO & Sitemap: http://localhost:${PORT}/sitemap.xml`);
    console.log(`🔒 Security Hardening: Active (Zero External API Keys)`);
    console.log(`=======================================================`);
  });

  // Graceful Shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Flushing data and shutting down...`);
    indexStore.saveSnapshot();
    server.close(() => {
      console.log('[SHUTDOWN] Server closed. All data saved.');
      process.exit(0);
    });
    setTimeout(() => {
      console.warn('[SHUTDOWN] Force exit after timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Export for Vercel Serverless
module.exports = app;
