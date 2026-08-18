/**
 * OmniCode Client-Side Search Engine & Query Parser
 */

class OmniSearchEngine {
  constructor() {
    this.repositories = [];
    this.stats = null;
  }

  setRepositories(repos) {
    this.repositories = repos || [];
  }

  setStats(stats) {
    this.stats = stats;
  }

  parseQuery(rawQuery) {
    const tokens = [];
    const filters = {
      language: null,
      domain: null,
      license: null,
      minStars: null,
      sortBy: null
    };

    if (!rawQuery) return { queryTokens: [], filters };

    const parts = rawQuery.trim().split(/\s+/);
    for (const part of parts) {
      if (part.startsWith('lang:')) {
        filters.language = part.replace('lang:', '').toLowerCase();
      } else if (part.startsWith('domain:')) {
        filters.domain = part.replace('domain:', '').replace(/['"]/g, '').toLowerCase();
      } else if (part.startsWith('license:')) {
        filters.license = part.replace('license:', '').toLowerCase();
      } else if (part.startsWith('stars:>')) {
        filters.minStars = parseInt(part.replace('stars:>', ''), 10);
      } else if (part.startsWith('sort:')) {
        filters.sortBy = part.replace('sort:', '').toLowerCase();
      } else if (part.length > 0) {
        tokens.push(part.toLowerCase());
      }
    }

    return { queryTokens: tokens, filters };
  }

  filter(rawQuery = '', extraFilters = {}) {
    const { queryTokens, filters: queryFilters } = this.parseQuery(rawQuery);
    
    // Merge explicit UI filters with inline query filters
    const activeFilters = {
      language: (queryFilters.language || extraFilters.language || 'all').toLowerCase(),
      domain: (queryFilters.domain || extraFilters.domain || 'all').toLowerCase(),
      license: (queryFilters.license || extraFilters.license || 'all').toLowerCase(),
      minStars: queryFilters.minStars !== null ? queryFilters.minStars : (extraFilters.minStars || 0),
      sortBy: queryFilters.sortBy || extraFilters.sortBy || 'stars'
    };

    return this.repositories.filter(repo => {
      // 1. Text token matching
      if (queryTokens.length > 0) {
        const targetStr = `${repo.name} ${repo.fullName} ${repo.description} ${repo.primaryLanguage} ${repo.domain}`.toLowerCase();
        const matchesAll = queryTokens.every(t => targetStr.includes(t));
        if (!matchesAll) return false;
      }

      // 2. Language Filter
      if (activeFilters.language !== 'all') {
        const matchPrimary = repo.primaryLanguage && repo.primaryLanguage.toLowerCase() === activeFilters.language;
        const matchSecondary = Array.isArray(repo.languages) && repo.languages.some(l => l.name.toLowerCase() === activeFilters.language);
        if (!matchPrimary && !matchSecondary) return false;
      }

      // 3. Domain Filter
      if (activeFilters.domain !== 'all') {
        if (!repo.domain || !repo.domain.toLowerCase().includes(activeFilters.domain)) return false;
      }

      // 4. License Filter
      if (activeFilters.license !== 'all') {
        if (!repo.license || repo.license.toLowerCase() !== activeFilters.license) return false;
      }

      // 5. Min Stars Filter
      if (activeFilters.minStars > 0) {
        if ((repo.stars || 0) < activeFilters.minStars) return false;
      }

      return true;
    }).sort((a, b) => {
      const sortBy = activeFilters.sortBy;
      if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
      if (sortBy === 'sloc') return (b.totalSLOC || 0) - (a.totalSLOC || 0);
      if (sortBy === 'complexity') return parseFloat(b.averageComplexity || 0) - parseFloat(a.averageComplexity || 0);
      if (sortBy === 'health') return (b.healthScore || 0) - (a.healthScore || 0);
      if (sortBy === 'files') return (b.fileCount || 0) - (a.fileCount || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.stars || 0) - (a.stars || 0);
    });
  }
}

window.OmniSearchEngine = OmniSearchEngine;
