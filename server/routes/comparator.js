/**
 * OmniCode Polyglot Comparator Router
 */

const express = require('express');
const { ALGORITHM_COMPARISONS } = require('../database/seedData');

module.exports = function createComparatorRouter() {
  const router = express.Router();

  router.get('/algorithms', (req, res) => {
    res.json({
      algorithms: ALGORITHM_COMPARISONS.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        availableLanguages: Object.keys(a.implementations)
      }))
    });
  });

  router.get('/algorithms/:id', (req, res) => {
    const algo = ALGORITHM_COMPARISONS.find(a => a.id === req.params.id);
    if (!algo) {
      return res.status(404).json({ error: 'Algorithm comparison not found' });
    }
    res.json(algo);
  });

  return router;
};
