/**
 * OmniCode Master Application Controller
 * High-Speed Ingestion Pipeline, Global Symbol Search,
 * Polyglot Matrix, Obsidian-Style Cluster Graph, and Mobile Navigation.
 */

class OmniApp {
  constructor() {
    this.repositories = [];
    this.stats = null;
    this.activeTab = 'explorer';
    this.viewLayoutMode = 'grid'; // 'grid' | 'list'
    this.activeFilters = {
      language: 'all',
      domain: 'all',
      license: 'all',
      minStars: 0,
      sortBy: 'stars'
    };

    this.currentPage = 1;
    this.pageSize = 40;
    this.isLoadingMore = false;
    this.hasMore = true;

    // Subsystems
    this.searchEngine = new OmniSearchEngine();
    this.repoViewer = new OmniRepoViewer();
    this.comparator = new OmniComparator();
    this.graphVisualizer = new OmniGraphVisualizer();
    this.crawlerConsole = new OmniCrawlerConsole();
    this.rawFilesViewer = new OmniRawFilesViewer();

    // Theme Management
    this.themes = ['obsidian', 'matrix', 'tokyo', 'dracula'];
    this.currentTheme = localStorage.getItem('omnicode_theme') || 'obsidian';

    // DOM Elements
    this.dom = {
      brandHomeLink: document.getElementById('brand-home-link'),
      navTabs: document.querySelectorAll('.tab-btn'),
      tabPanes: document.querySelectorAll('.tab-pane'),
      searchInput: document.getElementById('global-search-input'),
      btnClearSearch: document.getElementById('btn-clear-search'),
      queryChips: document.querySelectorAll('.query-chip'),
      radarPills: document.querySelectorAll('.radar-pill'),
      langFilterList: document.getElementById('language-filter-list'),
      domainSelect: document.getElementById('domain-select'),
      licenseSelect: document.getElementById('license-select'),
      starsRange: document.getElementById('stars-range'),
      starDisplay: document.getElementById('star-count-display'),
      sortBySelect: document.getElementById('sort-by-select'),
      btnResetFilters: document.getElementById('btn-reset-filters'),
      repoContainer: document.getElementById('repo-cards-container'),
      resultsCount: document.getElementById('results-count-text'),
      
      // Theme Switcher & Shortcuts
      btnToggleTheme: document.getElementById('btn-toggle-theme'),
      themeLabelText: document.getElementById('theme-label-text'),
      btnOpenShortcuts: document.getElementById('btn-open-shortcuts'),
      shortcutsModalOverlay: document.getElementById('shortcuts-modal-overlay'),
      btnCloseShortcuts: document.getElementById('btn-close-shortcuts'),

      // Mobile Hamburger Navigation Drawer
      btnMobileHamburger: document.getElementById('btn-mobile-hamburger'),
      mobileDrawerOverlay: document.getElementById('mobile-drawer-overlay'),
      btnCloseMobileDrawer: document.getElementById('btn-close-mobile-drawer'),
      mobileNavItems: document.querySelectorAll('.mobile-nav-item'),

      // View Layout
      btnViewGrid: document.getElementById('btn-view-grid'),
      btnViewList: document.getElementById('btn-view-list'),

      // Sidebar stats
      statTotalRepos: document.getElementById('stat-total-repos'),
      statTotalSloc: document.getElementById('stat-total-sloc'),
      sidebarDbStatus: document.getElementById('sidebar-db-status'),
      
      // Command Palette (Ctrl+K)
      btnOpenPalette: document.getElementById('btn-open-palette'),
      paletteModalOverlay: document.getElementById('palette-modal-overlay'),
      paletteSearchInput: document.getElementById('palette-search-input'),
      paletteResultsContainer: document.getElementById('palette-results-container'),

      // Global Symbol Search
      symbolSearchInput: document.getElementById('symbol-search-input'),
      symbolTypeFilter: document.getElementById('symbol-type-filter'),
      btnExecSymbolSearch: document.getElementById('btn-exec-symbol-search'),
      symbolsResultsContainer: document.getElementById('symbols-results-container'),

      // Security Audit & Export Modals
      btnRunSecurityScan: document.getElementById('btn-run-security-scan'),
      btnExportBundle: document.getElementById('btn-export-bundle'),
      securityModalOverlay: document.getElementById('security-modal-overlay'),
      btnSecurityModalClose: document.getElementById('btn-security-modal-close'),
      securityModalBody: document.getElementById('security-modal-body'),

      // Ingest Modal
      btnOpenModal: document.getElementById('btn-open-ingest-modal'),
      modalOverlay: document.getElementById('ingest-modal-overlay'),
      btnModalClose: document.getElementById('btn-modal-close'),
      btnModalCancel: document.getElementById('btn-modal-cancel'),
      btnModalSubmit: document.getElementById('btn-modal-submit'),
      modalInputUrl: document.getElementById('modal-input-url'),
      
      viewerRepoSelect: document.getElementById('viewer-repo-select'),
      graphRepoSelect: document.getElementById('graph-repo-select'),
      valVisitorsTotal: document.getElementById('val-visitors-total'),
      valVisitorsToday: document.getElementById('val-visitors-today')
    };

    this.init();
  }

  async init() {
    this.bindEvents();
    this.bindCommandPalette();
    this.bindSymbolSearch();
    this.bindSecurityAndExport();
    this.trackUniqueVisitor();
    await this.refreshGlobalIndex();
    this.handleDeepLink();
    window.addEventListener('hashchange', () => this.handleDeepLink());
    this.startLiveAutonomousPulse();
    if (window.requestIdleCallback) {
      requestIdleCallback(() => this.comparator.init());
    } else {
      setTimeout(() => this.comparator.init(), 1000);
    }
  }

  async trackUniqueVisitor() {
    try {
      let visitorId = localStorage.getItem('omnicode_visitor_id');
      if (!visitorId) {
        visitorId = 'usr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('omnicode_visitor_id', visitorId);
      }

      const res = await fetch('/api/features/visitors/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: visitorId })
      });
      const data = await res.json();
      if (data && data.total) {
        if (this.dom.valVisitorsTotal) this.dom.valVisitorsTotal.textContent = (data.total || 0).toLocaleString();
        if (this.dom.valVisitorsToday) this.dom.valVisitorsToday.textContent = `${(data.today || 0).toLocaleString()} today`;
      }
    } catch (_) {}
  }

  startLiveAutonomousPulse() {
    // Pulse real GitHub discovery tick every 60s while developer is browsing
    setInterval(async () => {
      try {
        const res = await fetch('/api/crawler/auto-harvest/real-tick?count=2');
        const data = await res.json();
        if (data.success && Array.isArray(data.repos) && data.repos.length > 0) {
          const first = data.repos[0];
          this.showToast(`Auto-Indexed from GitHub: ${first.fullName} (★${(first.stars || 0).toLocaleString()})`, 'success');
          this.refreshGlobalIndex();
        }
      } catch (_) {}
    }, 60000);
  }

  bindEvents() {
    if (this.dom.brandHomeLink) {
      this.dom.brandHomeLink.addEventListener('click', () => {
        this.resetFilters();
        this.switchTab('explorer');
      });
    }

    // Navigation Tabs
    this.dom.navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Mobile Drawer Navigation
    if (this.dom.btnMobileHamburger && this.dom.mobileDrawerOverlay) {
      this.dom.btnMobileHamburger.addEventListener('click', () => {
        this.dom.mobileDrawerOverlay.style.display = 'flex';
      });

      if (this.dom.btnCloseMobileDrawer) {
        this.dom.btnCloseMobileDrawer.addEventListener('click', () => {
          this.dom.mobileDrawerOverlay.style.display = 'none';
        });
      }

      this.dom.mobileDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === this.dom.mobileDrawerOverlay) {
          this.dom.mobileDrawerOverlay.style.display = 'none';
        }
      });

      this.dom.mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
          const tab = item.dataset.tab;
          this.switchTab(tab);
          this.dom.mobileNavItems.forEach(i => i.classList.toggle('active', i.dataset.tab === tab));
          this.dom.mobileDrawerOverlay.style.display = 'none';
        });
      });
    }

    // View Mode Layout Switcher
    if (this.dom.btnViewGrid && this.dom.btnViewList) {
      this.dom.btnViewGrid.addEventListener('click', () => this.setLayoutMode('grid'));
      this.dom.btnViewList.addEventListener('click', () => this.setLayoutMode('list'));
    }

    // Search Input
    this._searchDebounceTimer = null;
    this.dom.searchInput.addEventListener('input', () => {
      const val = this.dom.searchInput.value;
      this.dom.btnClearSearch.style.display = val.length > 0 ? 'block' : 'none';
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = setTimeout(() => {
        this.currentPage = 1;
        this.renderRepoCards();
      }, 200);
    });

    this.dom.btnClearSearch.addEventListener('click', () => {
      this.dom.searchInput.value = '';
      this.dom.btnClearSearch.style.display = 'none';
      this.currentPage = 1;
      this.renderRepoCards();
    });

    // Initialize Theme
    this.applyTheme(this.currentTheme);
    if (this.dom.btnToggleTheme) {
      this.dom.btnToggleTheme.addEventListener('click', () => {
        this.cycleTheme();
      });
    }

    // Shortcuts HUD Modal
    if (this.dom.btnOpenShortcuts && this.dom.shortcutsModalOverlay) {
      this.dom.btnOpenShortcuts.addEventListener('click', () => {
        this.dom.shortcutsModalOverlay.style.display = 'flex';
      });

      if (this.dom.btnCloseShortcuts) {
        this.dom.btnCloseShortcuts.addEventListener('click', () => {
          this.dom.shortcutsModalOverlay.style.display = 'none';
        });
      }

      this.dom.shortcutsModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.dom.shortcutsModalOverlay) {
          this.dom.shortcutsModalOverlay.style.display = 'none';
        }
      });
    }

    // Trending Radar Pills
    if (this.dom.radarPills) {
      this.dom.radarPills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.dom.radarPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const filter = pill.dataset.filter;
          if (filter === 'all') {
            this.dom.searchInput.value = '';
            this.activeFilters.domain = 'all';
            this.activeFilters.language = 'all';
            this.activeFilters.minStars = 0;
          } else if (filter === 'legends') {
            this.dom.searchInput.value = 'stars:>100000';
          } else if (filter === 'ai') {
            this.dom.searchInput.value = 'domain:"AI & Machine Learning"';
          } else if (filter === 'rust') {
            this.dom.searchInput.value = 'lang:rust';
          } else if (filter === 'go') {
            this.dom.searchInput.value = 'lang:go';
          } else if (filter === 'systems') {
            this.dom.searchInput.value = 'domain:"Kernels & Systems"';
          } else if (filter === 'web') {
            this.dom.searchInput.value = 'domain:"Web Frameworks & Runtimes"';
          }

          this.dom.btnClearSearch.style.display = this.dom.searchInput.value ? 'block' : 'none';
          this.currentPage = 1;
          this.switchTab('explorer');
          this.renderRepoCards();
        });
      });
    }

    // Quick Query Chips
    this.dom.queryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        this.dom.searchInput.value = query;
        this.dom.btnClearSearch.style.display = 'block';
        this.currentPage = 1;
        this.switchTab('explorer');
        this.renderRepoCards();
      });
    });

    // Filter Listeners
    this.dom.domainSelect.addEventListener('change', (e) => {
      this.activeFilters.domain = e.target.value;
      this.currentPage = 1;
      this.renderRepoCards();
    });

    this.dom.licenseSelect.addEventListener('change', (e) => {
      this.activeFilters.license = e.target.value;
      this.currentPage = 1;
      this.renderRepoCards();
    });

    this.dom.starsRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.activeFilters.minStars = val;
      this.dom.starDisplay.textContent = val > 0 ? `${(val / 1000).toFixed(0)}k+` : '0';
      this.currentPage = 1;
      this.renderRepoCards();
    });

    this.dom.sortBySelect.addEventListener('change', (e) => {
      this.activeFilters.sortBy = e.target.value;
      this.currentPage = 1;
      this.renderRepoCards();
    });

    this.dom.btnResetFilters.addEventListener('click', () => this.resetFilters());

    // Infinite Scroll
    this.dom.repoContainer.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.dom.repoContainer;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        this.loadMoreCards();
      }
    });

    // Ingest Modal
    this.dom.btnOpenModal.addEventListener('click', () => {
      this.dom.modalOverlay.style.display = 'flex';
      this.dom.modalInputUrl.focus();
    });

    const closeModal = () => {
      this.dom.modalOverlay.style.display = 'none';
      this.dom.modalInputUrl.value = '';
    };

    this.dom.btnModalClose.addEventListener('click', closeModal);
    this.dom.btnModalCancel.addEventListener('click', closeModal);
    this.dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.dom.modalOverlay) {
        closeModal();
      }
    });

    this.dom.btnModalSubmit.addEventListener('click', () => {
      const val = this.dom.modalInputUrl.value.trim();
      if (!val) return;
      const isLocal = val.includes(':\\') || val.startsWith('/') || val.startsWith('.');
      this.crawlerConsole.enqueueTask({
        url: val,
        type: isLocal ? 'local_dir' : 'git_url'
      });
      closeModal();
    });

    // Global Developer Keybindings
    window.addEventListener('keydown', (e) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      } else if (e.key === '?' && !inInput) {
        e.preventDefault();
        if (this.dom.shortcutsModalOverlay) {
          const isShown = this.dom.shortcutsModalOverlay.style.display === 'flex';
          this.dom.shortcutsModalOverlay.style.display = isShown ? 'none' : 'flex';
        }
      } else if (e.key.toLowerCase() === 't' && !inInput) {
        e.preventDefault();
        this.cycleTheme();
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key) && !inInput) {
        const tabMap = { '1': 'explorer', '2': 'viewer', '3': 'symbols', '4': 'comparator', '5': 'graph', '6': 'rawfiles', '7': 'crawler' };
        this.switchTab(tabMap[e.key]);
      } else if (e.key === '/' && !inInput) {
        e.preventDefault();
        this.switchTab('explorer');
        this.dom.searchInput.focus();
      } else if (e.key === 'Escape') {
        closeModal();
        this.closeCommandPalette();
        if (this.dom.securityModalOverlay) this.dom.securityModalOverlay.style.display = 'none';
        if (this.dom.mobileDrawerOverlay) this.dom.mobileDrawerOverlay.style.display = 'none';
        if (this.dom.shortcutsModalOverlay) this.dom.shortcutsModalOverlay.style.display = 'none';
        const rawPreview = document.getElementById('raw-preview-modal-overlay');
        if (rawPreview) rawPreview.style.display = 'none';
      }
    });
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omnicode_theme', theme);
    if (this.dom.themeLabelText) {
      const names = { obsidian: 'Obsidian', matrix: 'Matrix', tokyo: 'Tokyo', dracula: 'Dracula' };
      this.dom.themeLabelText.textContent = names[theme] || 'Theme';
    }
  }

  cycleTheme() {
    const idx = this.themes.indexOf(this.currentTheme);
    const nextTheme = this.themes[(idx + 1) % this.themes.length];
    this.applyTheme(nextTheme);
    const names = { obsidian: '🌌 Obsidian Dark', matrix: '🟢 Matrix Green', tokyo: '🟣 Tokyo Neon', dracula: '🧛 Dracula Pro' };
    this.showToast(`Theme: ${names[nextTheme]}`, 'info');
  }

  setLayoutMode(mode) {
    this.viewLayoutMode = mode;
    this.dom.btnViewGrid.classList.toggle('active', mode === 'grid');
    this.dom.btnViewList.classList.toggle('active', mode === 'list');
    this.dom.repoContainer.classList.toggle('list-view', mode === 'list');
  }

  bindCommandPalette() {
    this.dom.btnOpenPalette.addEventListener('click', () => this.openCommandPalette());
    this.dom.paletteModalOverlay.addEventListener('click', (e) => {
      if (e.target === this.dom.paletteModalOverlay) {
        this.closeCommandPalette();
      }
    });
    this.dom.paletteSearchInput.addEventListener('input', () => {
      this.renderPaletteResults(this.dom.paletteSearchInput.value.trim());
    });
    this.dom.paletteSearchInput.addEventListener('keydown', (e) => {
      const entries = this.dom.paletteResultsContainer.querySelectorAll('.palette-entry');
      const current = this.dom.paletteResultsContainer.querySelector('.palette-entry.palette-highlighted');
      let idx = Array.from(entries).indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (current) current.classList.remove('palette-highlighted');
        idx = (idx + 1) % entries.length;
        if (entries[idx]) { entries[idx].classList.add('palette-highlighted'); entries[idx].scrollIntoView({ block: 'nearest' }); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (current) current.classList.remove('palette-highlighted');
        idx = idx <= 0 ? entries.length - 1 : idx - 1;
        if (entries[idx]) { entries[idx].classList.add('palette-highlighted'); entries[idx].scrollIntoView({ block: 'nearest' }); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (current) current.click();
        else if (entries[0]) entries[0].click();
      }
    });
  }

  openCommandPalette() {
    this.dom.paletteModalOverlay.style.display = 'flex';
    this.dom.paletteSearchInput.value = '';
    this.renderPaletteResults('');
    setTimeout(() => this.dom.paletteSearchInput.focus(), 50);
  }

  closeCommandPalette() {
    this.dom.paletteModalOverlay.style.display = 'none';
  }

  renderPaletteResults(query) {
    const q = query.toLowerCase();
    this.dom.paletteResultsContainer.innerHTML = '';

    const results = this.repositories.filter(r => 
      !q || r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q) || r.primaryLanguage.toLowerCase().includes(q)
    ).slice(0, 10);

    if (results.length === 0) {
      this.dom.paletteResultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">No matching codebases found</div>';
      return;
    }

    results.forEach(repo => {
      const item = document.createElement('div');
      item.className = 'palette-entry';
      item.innerHTML = `
        <div>
          <div class="palette-entry-title">${repo.fullName}</div>
          <div class="palette-entry-meta">${repo.primaryLanguage} • ${(repo.stars || 0).toLocaleString()} stars • ${repo.domain || 'Systems'}</div>
        </div>
        <kbd class="kbd-tag">Jump ↵</kbd>
      `;
      item.addEventListener('click', () => {
        this.closeCommandPalette();
        this.openRepoInStudio(repo.id);
      });
      this.dom.paletteResultsContainer.appendChild(item);
    });
  }

  /* ================= GLOBAL SYMBOL SEARCH ================= */
  bindSymbolSearch() {
    if (!this.dom.btnExecSymbolSearch) return;

    const performSearch = async () => {
      const q = this.dom.symbolSearchInput.value.trim();
      const type = this.dom.symbolTypeFilter.value;
      if (!q) return;

      this.dom.symbolsResultsContainer.innerHTML = `
        <div class="omni-wave-loader">
          <div class="wave-bars-track">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
          </div>
          <span class="wave-loader-caption">Synthesizing AST symbol graph...</span>
        </div>
      `;

      try {
        const res = await fetch(`/api/features/symbols?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
          this.dom.symbolsResultsContainer.innerHTML = `<div style="grid-column: 1 / -1; padding: 50px; text-align: center; color: var(--text-muted);">No matching symbols found for "<b>${q}</b>".</div>`;
          return;
        }

        this.dom.symbolsResultsContainer.innerHTML = '';
        data.results.forEach(sym => {
          const card = document.createElement('div');
          card.className = 'symbol-result-card';
          card.innerHTML = `
            <div class="symbol-title-row">
              <span class="symbol-identifier">${sym.symbolName}</span>
              <span class="badge-domain">${sym.symbolType}</span>
            </div>
            <div class="symbol-origin-text">${sym.fullName} (${sym.language})</div>
            <div class="symbol-location-text">${sym.filePath} : Line ${sym.line}</div>
          `;
          card.addEventListener('click', async () => {
            await this.openRepoInStudio(sym.repoId);
            setTimeout(() => {
              if (this.repoViewer) {
                const targetFile = this.repoViewer.currentRepo?.files?.find(f => f.path === sym.filePath);
                if (targetFile) this.repoViewer.loadFile(targetFile);
                this.repoViewer.scrollToLine(sym.line);
              }
            }, 300);
          });
          this.dom.symbolsResultsContainer.appendChild(card);
        });

      } catch (err) {
        this.showToast(`Symbol search error: ${err.message}`, 'error');
      }
    };

    this.dom.btnExecSymbolSearch.addEventListener('click', performSearch);
    this.dom.symbolSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  /* ================= SECURITY AUDIT & EXPORT ================= */
  bindSecurityAndExport() {
    if (this.dom.btnRunSecurityScan) {
      this.dom.btnRunSecurityScan.addEventListener('click', async () => {
        const repo = this.repoViewer.currentRepo;
        if (!repo) return this.showToast('Please select a repository in Code Studio first', 'error');

        this.dom.securityModalOverlay.style.display = 'flex';
        this.dom.securityModalBody.innerHTML = `
          <div class="omni-wave-loader" style="padding: 30px 10px;">
            <div class="wave-bars-track">
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
            </div>
            <span class="wave-loader-caption">Running deep static security & complexity audit...</span>
          </div>
        `;

        try {
          const res = await fetch(`/api/features/repos/${repo.id}/security-scan`);
          const scan = await res.json();

          const issuesHtml = scan.issues.map(iss => `
            <div style="padding: 8px 12px; background: var(--bg-surface); border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); display: flex; align-items: flex-start; gap: 8px; font-size: 11.5px;">
              <span class="badge-forge">${iss.rule}</span>
              <span>${iss.message}</span>
            </div>
          `).join('');

          this.dom.securityModalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
              <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted);">HEALTH SCORE</span>
                <div style="font-size: 16px; font-weight: 700; color: var(--accent-emerald); font-family: var(--font-mono);">${scan.healthScore}%</div>
              </div>
              <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted);">MAINTAINABILITY</span>
                <div style="font-size: 16px; font-weight: 700; color: var(--accent-emerald); font-family: var(--font-mono);">${scan.maintainabilityIndex}/100</div>
              </div>
              <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle);">
                <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted);">LICENSE COMPLIANCE</span>
                <div style="font-size: 16px; font-weight: 700; color: var(--accent-emerald); font-family: var(--font-mono);">${scan.licenseScore}%</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Audit Findings</span>
              ${issuesHtml}
            </div>
          `;
        } catch (err) {
          this.dom.securityModalBody.innerHTML = `<div style="color: var(--accent-ruby);">Audit failed: ${err.message}</div>`;
        }
      });
    }

    if (this.dom.btnSecurityModalClose) {
      this.dom.btnSecurityModalClose.addEventListener('click', () => {
        this.dom.securityModalOverlay.style.display = 'none';
      });
    }

    if (this.dom.securityModalOverlay) {
      this.dom.securityModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.dom.securityModalOverlay) {
          this.dom.securityModalOverlay.style.display = 'none';
        }
      });
    }

    if (this.dom.btnExportBundle) {
      this.dom.btnExportBundle.addEventListener('click', () => {
        const repo = this.repoViewer.currentRepo;
        if (!repo) return this.showToast('Please select a repository first', 'error');
        window.open(`/api/features/repos/${repo.id}/export`, '_blank');
        this.showToast(`Exported sovereign bundle: ${repo.name}-sovereign-bundle.json`, 'success');
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    this.dom.navTabs.forEach(t => {
      const isActive = t.dataset.tab === tabName;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    this.dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === `pane-${tabName}`));

    if (this.dom.mobileNavItems) {
      this.dom.mobileNavItems.forEach(i => i.classList.toggle('active', i.dataset.tab === tabName));
    }

    if (tabName === 'graph') {
      if (this.graphVisualizer) {
        setTimeout(() => this.graphVisualizer.activate(), 60);
      }
    } else {
      if (this.graphVisualizer) {
        this.graphVisualizer.stopSimulation();
      }
    }

    if (tabName === 'rawfiles') {
      if (this.rawFilesViewer) {
        this.rawFilesViewer.populateRepoOptions(this.repositories);
        this.rawFilesViewer.fetchFiles();
      }
    } else if (tabName === 'crawler') {
      if (this.crawlerConsole) {
        this.crawlerConsole.fetchInitialStats();
      }
    } else if (tabName === 'comparator') {
      if (this.comparator) {
        this.comparator.init();
      }
    }
  }

  resetFilters() {
    this.activeFilters = {
      language: 'all',
      domain: 'all',
      license: 'all',
      minStars: 0,
      sortBy: 'stars'
    };

    this.currentPage = 1;
    this.dom.searchInput.value = '';
    this.dom.btnClearSearch.style.display = 'none';
    this.dom.domainSelect.value = 'all';
    this.dom.licenseSelect.value = 'all';
    this.dom.starsRange.value = 0;
    this.dom.starDisplay.textContent = '0';
    this.dom.sortBySelect.value = 'stars';

    const pills = this.dom.langFilterList.querySelectorAll('.lang-pill');
    pills.forEach(p => p.classList.toggle('active', p.dataset.lang === 'all'));

    this.renderRepoCards();
  }

  onRepositoryIndexed(newRepo) {
    const existingIndex = this.repositories.findIndex(r => r.id === newRepo.id || r.fullName === newRepo.fullName);
    if (existingIndex >= 0) {
      this.repositories[existingIndex] = newRepo;
    } else {
      this.repositories.unshift(newRepo);
    }

    this.searchEngine.setRepositories(this.repositories);
    
    const totalSloc = this.repositories.reduce((acc, r) => acc + (r.totalSLOC || 0), 0);
    this.dom.statTotalRepos.textContent = this.repositories.length.toLocaleString();
    this.dom.statTotalSloc.textContent = totalSloc.toLocaleString();
    
    this.populateRepoDropdowns();

    if (this.activeTab === 'explorer' && this.currentPage === 1 && !this.dom.searchInput.value) {
      this.renderRepoCards(newRepo.id);
    }
  }

  async refreshGlobalIndex() {
    try {
      const [reposRes, statsRes] = await Promise.all([
        fetch('/api/repos?limit=1000'),
        fetch('/api/search/stats')
      ]);

      const reposData = await reposRes.json();
      const statsData = await statsRes.json();

      this.repositories = reposData.repositories || [];
      this.stats = statsData;

      this.searchEngine.setRepositories(this.repositories);
      this.searchEngine.setStats(this.stats);

      this.updateSidebarStats();
      this.renderLanguagePills(statsData.languages || {});
      this.populateRepoDropdowns();
      this.renderRepoCards();

    } catch (e) {
      console.error('Failed to load global index:', e);
    }
  }

  updateSidebarStats() {
    if (!this.stats) return;
    const total = this.stats.totalRepos || this.repositories.length;
    this.dom.statTotalRepos.textContent = total.toLocaleString();
    this.dom.statTotalSloc.textContent = (this.stats.totalSLOC || 0).toLocaleString();
  }

  renderLanguagePills(langStats) {
    this.dom.langFilterList.innerHTML = '';
    
    const allPill = document.createElement('div');
    allPill.className = `lang-pill ${this.activeFilters.language === 'all' ? 'active' : ''}`;
    allPill.dataset.lang = 'all';
    allPill.textContent = 'All';
    allPill.addEventListener('click', () => {
      this.setLanguageFilter('all');
    });
    this.dom.langFilterList.appendChild(allPill);

    const langColors = {
      Rust: '#dea584',
      Go: '#00ADD8',
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      'C++': '#f34b7d',
      C: '#555555',
      Zig: '#ec915c',
      Solidity: '#AA6746',
      Elixir: '#6e4a7e'
    };

    Object.entries(langStats).forEach(([langName, count]) => {
      const pill = document.createElement('div');
      pill.className = `lang-pill ${this.activeFilters.language.toLowerCase() === langName.toLowerCase() ? 'active' : ''}`;
      pill.dataset.lang = langName;

      const color = langColors[langName] || '#8b949e';
      pill.innerHTML = `
        <span class="lang-color-dot" style="background-color: ${color}"></span>
        <span>${langName}</span>
      `;

      pill.addEventListener('click', () => {
        this.setLanguageFilter(langName);
      });

      this.dom.langFilterList.appendChild(pill);
    });
  }

  setLanguageFilter(lang) {
    this.activeFilters.language = lang;
    this.currentPage = 1;
    const pills = this.dom.langFilterList.querySelectorAll('.lang-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.lang.toLowerCase() === lang.toLowerCase());
    });
    this.renderRepoCards();
  }

  populateRepoDropdowns() {
    const currentViewerVal = this.dom.viewerRepoSelect.value;
    const currentGraphVal = this.dom.graphRepoSelect.value;

    this.dom.viewerRepoSelect.innerHTML = '';
    this.dom.graphRepoSelect.innerHTML = '';

    this.repositories.slice(0, 100).forEach(repo => {
      const opt1 = document.createElement('option');
      opt1.value = repo.id;
      opt1.textContent = `${repo.name} (${repo.primaryLanguage})`;
      this.dom.viewerRepoSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = repo.id;
      opt2.textContent = `${repo.name} (${repo.primaryLanguage})`;
      this.dom.graphRepoSelect.appendChild(opt2);
    });

    if (currentViewerVal) this.dom.viewerRepoSelect.value = currentViewerVal;
    if (currentGraphVal) this.dom.graphRepoSelect.value = currentGraphVal;

    if (this.rawFilesViewer) {
      this.rawFilesViewer.populateRepoOptions(this.repositories);
    }
  }

  loadMoreCards() {
    if (this.isLoadingMore || !this.hasMore) return;
    this.currentPage++;
    this.renderRepoCards(null, true);
  }

  renderRepoCards(highlightRepoId = null, append = false) {
    // Set up event delegation once
    if (!this._cardDelegationBound) {
      this._cardDelegationBound = true;
      this.dom.repoContainer.addEventListener('click', (e) => {
        const inspectBtn = e.target.closest('.btn-inspect-studio');
        const cloneBtn = e.target.closest('.btn-copy-clone');
        const syncBtn = e.target.closest('.btn-live-sync');
        
        if (inspectBtn) {
          this.openRepoInStudio(inspectBtn.dataset.repoid);
        } else if (cloneBtn) {
          const url = cloneBtn.dataset.giturl;
          const cmd = `git clone ${url}`;
          navigator.clipboard.writeText(cmd).then(() => {
            this.showToast(`Copied: ${cmd}`, 'success');
          });
        } else if (syncBtn) {
          this._handleLiveSync(syncBtn);
        }
      });
    }

    const rawQuery = this.dom.searchInput.value;
    const filtered = this.searchEngine.filter(rawQuery, this.activeFilters);

    this.dom.resultsCount.textContent = `Showing ${Math.min(this.currentPage * this.pageSize, filtered.length)} of ${filtered.length} matching codebases (${this.repositories.length.toLocaleString()} total in DB)`;

    if (!append) {
      this.dom.repoContainer.innerHTML = '';
    }
    const fragment = document.createDocumentFragment();

    if (filtered.length === 0) {
      this.dom.repoContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-muted);">
          <h3 style="font-size: 14px; margin-bottom: 6px; color: var(--text-primary);">No Matching Codebases Found</h3>
          <p style="font-size: 12px;">Try adjusting your search query or clearing filters.</p>
        </div>
      `;
      return;
    }

    const start = append ? (this.currentPage - 1) * this.pageSize : 0;
    const end = this.currentPage * this.pageSize;
    const visibleSlice = filtered.slice(start, end);

    this.hasMore = end < filtered.length;

    const langColors = {
      Rust: '#dea584',
      Go: '#00ADD8',
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      'C++': '#f34b7d',
      C: '#555555',
      Zig: '#ec915c',
      Solidity: '#AA6746',
      Elixir: '#6e4a7e',
      TOML: '#9c4221',
      Shell: '#89e051',
      Julia: '#a270ba',
      Nim: '#ffc200',
      V: '#5d87bf',
      Crystal: '#000100'
    };

    visibleSlice.forEach(repo => {
      const card = document.createElement('div');
      card.className = 'repo-card';
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', `${repo.fullName} repository`);

      const gitUrl = repo.gitUrl || `https://github.com/${repo.fullName}.git`;
      const webUrl = gitUrl.replace(/\.git$/, '');
      const owner = (repo.fullName && repo.fullName.includes('/')) ? repo.fullName.split('/')[0] : (repo.name || 'repo');
      const avatarUrl = repo.ownerAvatar || (repo.sourceForge === 'GitLab'
        ? `https://gitlab.com/uploads/-/system/user/avatar/${encodeURIComponent(owner)}/avatar.png`
        : `https://github.com/${encodeURIComponent(owner)}.png?size=72`);

      const languages = repo.languages || [{ name: repo.primaryLanguage || 'Other', percentage: 100 }];
      const meterBarsHtml = languages.map(l => {
        const col = langColors[l.name] || '#8b949e';
        return `<div class="meter-segment" style="width: ${l.percentage}%; background-color: ${col};" title="${l.name}: ${l.percentage}%"></div>`;
      }).join('');

      const legendHtml = languages.slice(0, 3).map(l => {
        const col = langColors[l.name] || '#8b949e';
        return `<div class="meter-label-item"><span class="lang-color-dot" style="background-color: ${col}"></span><span>${l.name} ${l.percentage}%</span></div>`;
      }).join('');

      card.innerHTML = `
        <div class="repo-card-head">
          <div class="repo-identity-group">
            <img src="${avatarUrl}" alt="${owner}" class="repo-owner-avatar" loading="lazy" decoding="async" width="36" height="36" onerror="this.onerror=null;this.src='assets/logo.jpg'">
            <div class="repo-identity">
              <a href="${webUrl}" target="_blank" rel="noopener noreferrer" class="repo-link" title="Open on GitHub" aria-label="Open ${repo.fullName} on GitHub">
                <span class="repo-owner-prefix">${owner} /</span>
                <span class="repo-name-strong">${repo.name}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <div class="repo-badges-row">
                <span class="badge-forge">${repo.sourceForge || 'GitHub'}</span>
                <span class="badge-domain">${repo.domain || 'Systems'}</span>
                <span class="badge-license">${repo.license || 'MIT'}</span>
              </div>
            </div>
          </div>
          <div class="repo-health-tag" title="Architectural Health Score: ${repo.healthScore || 95}%">
            <span>${repo.healthScore || 95}%</span>
          </div>
        </div>

        <p class="repo-desc-text">${repo.description || 'Public codebase indexed into OmniCode Sovereign Meta-Forge.'}</p>

        <div class="repo-lang-meter">
          <div class="meter-track-bar">${meterBarsHtml}</div>
          <div class="meter-labels-row">${legendHtml}</div>
        </div>

        <div class="repo-card-footer">
          <div class="footer-metrics-row">
            <div class="metric-stat-item" title="Stars">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="color: #fbbf24;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${(repo.stars || 0).toLocaleString()}</span>
            </div>
            <div class="metric-stat-item" title="Forks">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path><line x1="12" y1="12" x2="12" y2="15"></line></svg>
              <span>${(repo.forks || 0).toLocaleString()}</span>
            </div>
            <div class="metric-stat-item" title="Lines of Code">
              <span>${(repo.totalSLOC || 0).toLocaleString()} SLOC</span>
            </div>
          </div>

          <div class="footer-actions-group">
            <a href="https://github.dev/${repo.fullName}" target="_blank" rel="noopener noreferrer" class="btn-repo-tool ide-pill" style="color: #7dcfff; text-decoration: none;" title="Open in VS Code Web (github.dev)" aria-label="Open ${repo.fullName} in Web IDE">
              <span>IDE</span>
            </a>
            <button class="btn-repo-tool btn-inspect-studio" data-repoid="${repo.id}" aria-label="Inspect ${repo.fullName} in Code Studio">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Inspect</span>
            </button>
            <button class="btn-repo-tool btn-copy-clone" data-giturl="${gitUrl}" title="Copy clone command" aria-label="Copy Git clone command for ${repo.fullName}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 2px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Clone</span>
            </button>
            <button class="btn-repo-tool btn-live-sync" data-repoid="${repo.id}" title="Sync stars & forks live" aria-label="Sync metadata for ${repo.fullName}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 2px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              <span>Sync</span>
            </button>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });
    this.dom.repoContainer.appendChild(fragment);
  }

  async _handleLiveSync(btn) {
    const repoId = btn.dataset.repoid;
    btn.innerHTML = `<span style="opacity: 0.7;">Syncing...</span>`;
    try {
      const res = await fetch(`/api/repos/${repoId}/live-sync`);
      const data = await res.json();
      if (data.success) {
        this.onRepositoryIndexed(data.repo);
        this.showToast(`Live synced ${data.repo.name}: ${(data.repo.stars || 0).toLocaleString()} stars, ${(data.repo.forks || 0).toLocaleString()} forks`, 'success');
      }
    } catch (err) {
      this.showToast(`Sync error: ${err.message}`, 'error');
    } finally {
      btn.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 2px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        <span>Sync</span>
      `;
    }
  }

  async openRepoInStudio(repoId) {
    try {
      const res = await fetch(`/api/repos/${repoId}`);
      const repo = await res.json();
      this.dom.viewerRepoSelect.value = repoId;
      this.repoViewer.loadRepository(repo);
      this.switchTab('viewer');
    } catch (e) {
      this.showToast(`Failed to load repository: ${e.message}`, 'error');
    }
  }

  handleDeepLink() {
    const hash = window.location.hash;
    if (!hash || hash.length < 3) return;
    const match = hash.match(/^#\/repo\/([^\/]+)(?:\/file\/(.+?))?(?::L(\d+)(?:-(\d+))?)?$/);
    if (match) {
      const [, repoId, filePath, startLine] = match;
      this.openRepoInStudio(repoId).then(() => {
        if (filePath && this.repoViewer?.currentRepo?.files) {
          const file = this.repoViewer.currentRepo.files.find(f => f.path === decodeURIComponent(filePath));
          if (file) {
            setTimeout(() => {
              this.repoViewer.loadFile(file);
              if (startLine) this.repoViewer.scrollToLine(parseInt(startLine, 10));
            }, 200);
          }
        }
      });
    }
  }

  async loadGraphForRepo(repoId) {
    try {
      const res = await fetch(`/api/repos/${repoId}/graph`);
      const graphData = await res.json();
      this.dom.graphRepoSelect.value = repoId;
      this.graphVisualizer.setGraphData(graphData);
    } catch (e) {
      console.error('Failed to load graph:', e);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon toast-icon-${type}">${icons[type] || icons.info}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-dismiss" title="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toast.querySelector('.toast-dismiss').addEventListener('click', () => {
      toast.classList.add('toast-leaving');
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-leaving');
        setTimeout(() => toast.remove(), 250);
      }
    }, 4000);

    // Limit to 5 visible toasts
    while (container.children.length > 5) {
      container.firstChild.remove();
    }
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new OmniApp();
});
