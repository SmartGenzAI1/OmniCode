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
      await ensureDbRestored().catch(() => {});
    }
    const query = req.query.q || '';
    const results = indexStore.searchSymbols(query);
    res.json({
      query,
      count: results.length,
      symbols: results
    });
  });

  // Global Index Statistics & Aggregations
  router.get('/stats', async (req, res) => {
    if (typeof ensureDbRestored === 'function') {
      await ensureDbRestored().catch(() => {});
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
