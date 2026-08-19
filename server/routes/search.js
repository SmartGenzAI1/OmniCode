/**
 * OmniCode Search & Stats Router
 */

const express = require('express');
const { getAllSupportedLanguages } = require('../analyzer/languageDetector');

module.exports = function createSearchRouter(indexStore, ensureDbRestored) {
  const router = express.Router();

  // Search AST Symbols
  router.get('/symbols', async (req, res) => {
    if (typeof ensureDbRestored === 'function') {
      await Promise.race([
        ensureDbRestored(),
        new Promise(resolve => setTimeout(resolve, 150))
      ]).catch(() => {});
    }
    const query = req.query.q || '';
    const type = req.query.type || 'all';
    const page = req.query.page || 1;
    const limit = req.query.limit || 50;

    const result = indexStore.searchSymbols(query, type, page, limit);
    res.json({
      query: result.query,
      type: result.type,
      count: result.results.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      symbols: result.results,
      results: result.results
    });
  });

  // Global Index Statistics & Aggregations
  router.get('/stats', async (req, res) => {
    if (typeof ensureDbRestored === 'function') {
      await Promise.race([
        ensureDbRestored(),
        new Promise(resolve => setTimeout(resolve, 150))
      ]).catch(() => {});
    }
    const stats = indexStore.getAggregationStats();
    const supportedLanguages = getAllSupportedLanguages();
    res.json({
      ...stats,
      supportedLanguages
    });
  });

  return router;
};
