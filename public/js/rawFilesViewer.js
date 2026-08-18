/**
 * OmniCode Raw Files & Tree Catalog Engine
 * Interactive global repository raw file browser with language branding icons,
 * search filters, code previews, and 1-click Code Studio jumping.
 */

class OmniRawFilesViewer {
  constructor() {
    this.dom = {
      pane: document.getElementById('pane-rawfiles'),
      searchInput: document.getElementById('rawfiles-search-input'),
      langFilter: document.getElementById('rawfiles-lang-select'),
      repoFilter: document.getElementById('rawfiles-repo-select'),
      filesContainer: document.getElementById('rawfiles-grid-container'),
      countBadge: document.getElementById('rawfiles-total-badge'),
      paginationContainer: document.getElementById('rawfiles-pagination'),
      
      // Raw Preview Modal
      previewModal: document.getElementById('raw-preview-modal-overlay'),
      previewTitle: document.getElementById('raw-preview-title'),
      previewMeta: document.getElementById('raw-preview-meta'),
      previewCode: document.getElementById('raw-preview-code'),
      btnCopyRaw: document.getElementById('btn-copy-raw-file'),
      btnOpenInStudio: document.getElementById('btn-open-in-studio'),
      btnCloseModal: document.getElementById('btn-close-raw-preview')
    };

    this.currentPage = 1;
    this.currentLimit = 36;
    this.currentData = null;
    this.activeFile = null;
    this.debounceTimer = null;

    this.bindEvents();
  }

  bindEvents() {
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.currentPage = 1;
          this.fetchFiles();
        }, 300);
      });
    }

    if (this.dom.langFilter) {
      this.dom.langFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.fetchFiles();
      });
    }

    if (this.dom.repoFilter) {
      this.dom.repoFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.fetchFiles();
      });
    }

    // Modal Events
    if (this.dom.btnCloseModal && this.dom.previewModal) {
      this.dom.btnCloseModal.addEventListener('click', () => {
        this.dom.previewModal.style.display = 'none';
      });
      this.dom.previewModal.addEventListener('click', (e) => {
        if (e.target === this.dom.previewModal) {
          this.dom.previewModal.style.display = 'none';
        }
      });
    }

    if (this.dom.btnCopyRaw) {
      this.dom.btnCopyRaw.addEventListener('click', () => {
        if (this.activeFile && this.activeFile.content) {
          navigator.clipboard.writeText(this.activeFile.content);
          if (window.app) window.app.showToast(`Copied ${this.activeFile.name} to clipboard!`, 'success');
        }
      });
    }

    if (this.dom.btnOpenInStudio) {
      this.dom.btnOpenInStudio.addEventListener('click', () => {
        if (this.activeFile && window.app) {
          this.dom.previewModal.style.display = 'none';
          window.app.switchTab('viewer');
          if (window.app.repoViewer) {
            window.app.repoViewer.loadRepository(this.activeFile.repoId);
            setTimeout(() => {
              window.app.repoViewer.selectFile(this.activeFile.path);
            }, 250);
          }
        }
      });
    }
  }

  populateRepoOptions(repositories) {
    if (!this.dom.repoFilter || !Array.isArray(repositories)) return;
    const currentVal = this.dom.repoFilter.value;
    let html = '<option value="">All Repositories (2,500+)</option>';
    repositories.slice(0, 500).forEach(r => {
      html += `<option value="${r.name}">${r.fullName || r.name} (${r.primaryLanguage || 'Code'})</option>`;
    });
    this.dom.repoFilter.innerHTML = html;
    if (currentVal) this.dom.repoFilter.value = currentVal;
  }

  async fetchFiles() {
    if (!this.dom.filesContainer) return;

    this.dom.filesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 20px; margin-bottom: 8px;">⚡</div>
        <div>Streaming raw file catalog across all codebases...</div>
      </div>
    `;

    const q = this.dom.searchInput ? this.dom.searchInput.value.trim() : '';
    const lang = this.dom.langFilter ? this.dom.langFilter.value : '';
    const repo = this.dom.repoFilter ? this.dom.repoFilter.value : '';

    try {
      const url = `/api/features/raw-files?q=${encodeURIComponent(q)}&language=${encodeURIComponent(lang)}&repo=${encodeURIComponent(repo)}&page=${this.currentPage}&limit=${this.currentLimit}`;
      const res = await fetch(url);
      const data = await res.json();
      this.currentData = data;
      this.renderFiles(data);
    } catch (e) {
      this.dom.filesContainer.innerHTML = `<div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--accent-ruby);">Failed to load files: ${e.message}</div>`;
    }
  }

  getFileIcon(language, filename) {
    const lang = (language || '').toLowerCase();
    const name = (filename || '').toLowerCase();

    if (lang === 'rust' || name.endsWith('.rs') || name === 'cargo.toml') {
      return `<span class="file-brand-icon icon-rust">🦀</span>`;
    }
    if (lang === 'python' || name.endsWith('.py') || name === 'pyproject.toml' || name === 'requirements.txt') {
      return `<span class="file-brand-icon icon-python">🐍</span>`;
    }
    if (lang === 'go' || name.endsWith('.go') || name === 'go.mod') {
      return `<span class="file-brand-icon icon-go">🐹</span>`;
    }
    if (lang === 'typescript' || name.endsWith('.ts') || name.endsWith('.tsx')) {
      return `<span class="file-brand-icon icon-ts">TS</span>`;
    }
    if (lang === 'javascript' || name.endsWith('.js') || name.endsWith('.jsx') || name === 'package.json') {
      return `<span class="file-brand-icon icon-js">JS</span>`;
    }
    if (lang === 'c++' || name.endsWith('.cpp') || name.endsWith('.hpp') || name === 'cmakelists.txt') {
      return `<span class="file-brand-icon icon-cpp">C++</span>`;
    }
    if (lang === 'c' || name.endsWith('.c') || name.endsWith('.h')) {
      return `<span class="file-brand-icon icon-c">C</span>`;
    }
    if (lang === 'zig' || name.endsWith('.zig')) {
      return `<span class="file-brand-icon icon-zig">⚡</span>`;
    }
    if (lang === 'solidity' || name.endsWith('.sol')) {
      return `<span class="file-brand-icon icon-sol">💎</span>`;
    }
    if (name.endsWith('.md') || name === 'readme.md') {
      return `<span class="file-brand-icon icon-md">📝</span>`;
    }
    if (name.endsWith('.json') || name.endsWith('.toml') || name.endsWith('.yaml') || name.endsWith('.yml')) {
      return `<span class="file-brand-icon icon-config">⚙️</span>`;
    }
    return `<span class="file-brand-icon icon-generic">📄</span>`;
  }

  renderFiles(data) {
    if (!this.dom.filesContainer) return;

    if (this.dom.countBadge) {
      this.dom.countBadge.textContent = `${(data.total || 0).toLocaleString()} Files`;
    }

    if (!data.files || data.files.length === 0) {
      this.dom.filesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 50px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 10px;">📂</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">No raw files match query</div>
          <div style="font-size: 12px; margin-top: 4px;">Try searching for a different file extension, filename, or clearing language filters.</div>
        </div>
      `;
      if (this.dom.paginationContainer) this.dom.paginationContainer.innerHTML = '';
      return;
    }

    const fragment = document.createDocumentFragment();

    data.files.forEach(f => {
      const card = document.createElement('div');
      card.className = 'raw-file-card';
      
      const icon = this.getFileIcon(f.language, f.name);
      const sizeKb = (f.size / 1024).toFixed(1);

      card.innerHTML = `
        <div class="raw-card-top">
          ${icon}
          <div class="raw-card-info">
            <span class="raw-card-name" title="${f.path}">${f.name}</span>
            <span class="raw-card-repo" title="Repository: ${f.repoFullName}">🏛️ ${f.repoFullName}</span>
          </div>
        </div>

        <div class="raw-card-path" title="${f.path}">${f.path}</div>

        <div class="raw-card-tags">
          <span class="raw-tag lang-tag">${f.language}</span>
          <span class="raw-tag">${f.totalLines} lines</span>
          <span class="raw-tag">${sizeKb} KB</span>
          <span class="raw-tag">★ ${(f.repoStars || 0).toLocaleString()}</span>
        </div>

        <div class="raw-card-actions">
          <button class="btn-raw-action btn-preview" title="Quick Raw Preview">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Preview</span>
          </button>
          <button class="btn-raw-action btn-studio" title="Open in Full Code Studio">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            <span>Studio</span>
          </button>
          <button class="btn-raw-action btn-copy" title="Copy Raw Source Code">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      `;

      // Event Listeners
      card.querySelector('.btn-preview').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPreviewModal(f);
      });

      card.querySelector('.btn-studio').addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) {
          window.app.switchTab('viewer');
          if (window.app.repoViewer) {
            window.app.repoViewer.loadRepository(f.repoId);
            setTimeout(() => {
              window.app.repoViewer.selectFile(f.path);
            }, 250);
          }
        }
      });

      card.querySelector('.btn-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        if (f.content) {
          navigator.clipboard.writeText(f.content);
          if (window.app) window.app.showToast(`Copied ${f.name} code to clipboard!`, 'success');
        }
      });

      card.addEventListener('click', () => {
        this.openPreviewModal(f);
      });

      fragment.appendChild(card);
    });

    this.dom.filesContainer.innerHTML = '';
    this.dom.filesContainer.appendChild(fragment);

    this.renderPagination(data.total, data.page, data.totalPages);
  }

  renderPagination(total, page, totalPages) {
    if (!this.dom.paginationContainer) return;
    if (totalPages <= 1) {
      this.dom.paginationContainer.innerHTML = '';
      return;
    }

    let html = `
      <div class="raw-pagination-bar">
        <button class="btn-pagination-step" ${page <= 1 ? 'disabled' : ''} id="btn-raw-prev">← Previous</button>
        <span class="pagination-indicator">Page <strong>${page}</strong> of <strong>${totalPages}</strong></span>
        <button class="btn-pagination-step" ${page >= totalPages ? 'disabled' : ''} id="btn-raw-next">Next →</button>
      </div>
    `;

    this.dom.paginationContainer.innerHTML = html;

    const prevBtn = document.getElementById('btn-raw-prev');
    const nextBtn = document.getElementById('btn-raw-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.fetchFiles();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.fetchFiles();
        }
      });
    }
  }

  openPreviewModal(file) {
    this.activeFile = file;
    if (!this.dom.previewModal) return;

    if (this.dom.previewTitle) {
      this.dom.previewTitle.textContent = `${file.name} — ${file.repoFullName}`;
    }

    if (this.dom.previewMeta) {
      this.dom.previewMeta.innerHTML = `
        <span class="meta-pill">${file.language}</span>
        <span class="meta-pill">${file.totalLines} Lines</span>
        <span class="meta-pill">${(file.size / 1024).toFixed(1)} KB</span>
        <span class="meta-pill">Complexity: ${file.complexity}</span>
        <span class="meta-pill">Path: ${file.path}</span>
      `;
    }

    if (this.dom.previewCode) {
      const code = file.content || '// Empty or binary source';
      this.dom.previewCode.textContent = code;
    }

    this.dom.previewModal.style.display = 'flex';
  }
}

window.OmniRawFilesViewer = OmniRawFilesViewer;
