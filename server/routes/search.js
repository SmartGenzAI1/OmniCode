/**
 * OmniCode Search & Stats Router
 */

const express = require('express');
const { getAllSupportedLanguages } = require('../analyzer/languageDetector');

module.exports = function createSearchRouter(indexStore) {
  const router = express.Router();

  // Search AST Symbols
  router.get('/symbols', (req, res) => {
    const query = req.query.q || '';
    const results = indexStore.searchSymbols(query);
    res.json({
      query,
      count: results.length,
      symbols: results
    });
  });

  // Global Index Statistics & Aggregations
  router.get('/stats', (req, res) => {
    const stats = indexStore.getAggregationStats();
    const supportedLanguages = getAllSupportedLanguages();
    res.json({
      ...stats,
      supportedLanguages
    });
  });

  return router;
};
