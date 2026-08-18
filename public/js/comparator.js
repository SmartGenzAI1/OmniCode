/**
 * OmniCode Polyglot Algorithm Comparator Matrix Controller
 */

class OmniComparator {
  constructor() {
    this.algorithms = [];
    this.currentAlgo = null;
    this.dom = {
      algoSelect: document.getElementById('comparator-algo-select'),
      matrixContainer: document.getElementById('comparator-matrix-container')
    };

    this.bindEvents();
  }

  bindEvents() {
    this.dom.algoSelect.addEventListener('change', (e) => {
      this.loadAlgorithm(e.target.value);
    });
  }

  async init() {
    try {
      const res = await fetch('/api/comparator/algorithms');
      const data = await res.json();
      this.algorithms = data.algorithms || [];
      this.renderSelect();
      if (this.algorithms.length > 0) {
        this.loadAlgorithm(this.algorithms[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch algorithms:', e);
    }
  }

  renderSelect() {
    this.dom.algoSelect.innerHTML = '';
    this.algorithms.forEach(algo => {
      const opt = document.createElement('option');
      opt.value = algo.id;
      opt.textContent = `${algo.title} (${algo.availableLanguages.join(', ')})`;
      this.dom.algoSelect.appendChild(opt);
    });
  }

  async loadAlgorithm(algoId) {
    try {
      const res = await fetch(`/api/comparator/algorithms/${algoId}`);
      const algo = await res.json();
      this.currentAlgo = algo;
      this.renderMatrix(algo);
    } catch (e) {
      console.error('Failed to load algorithm details:', e);
    }
  }

  renderMatrix(algo) {
    this.dom.matrixContainer.innerHTML = '';
    const implementations = algo.implementations || {};

    const langColors = {
      Rust: '#dea584',
      Go: '#00ADD8',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      'C++': '#f34b7d',
      Zig: '#ec915c',
      Elixir: '#6e4a7e'
    };

    for (const [lang, code] of Object.entries(implementations)) {
      const card = document.createElement('div');
      card.className = 'matrix-code-card';

      const color = langColors[lang] || '#8b949e';

      card.innerHTML = `
        <div class="matrix-card-header">
          <div class="matrix-lang-badge">
            <span class="lang-dot" style="background-color: ${color}"></span>
            <span>${lang} Implementation</span>
          </div>
          <button class="btn-copy-code" data-lang="${lang}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre class="matrix-card-body"><code>${this.escapeAndHighlight(code)}</code></pre>
      `;

      card.querySelector('.btn-copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
          if (window.app) window.app.showToast(`${lang} implementation copied!`, 'success');
        });
      });

      this.dom.matrixContainer.appendChild(card);
    }
  }

  escapeAndHighlight(code) {
    if (!code) return '';
    let safe = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const keywords = ['pub', 'fn', 'struct', 'impl', 'let', 'mut', 'func', 'type', 'export', 'class', 'const', 'def', 'return', 'if', 'else', 'for', 'while', 'import', 'package'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    const commentRegex = /(\/\/.*?$|#.*?$|\/\*[\s\S]*?\*\/)/gm;

    safe = safe.replace(commentRegex, '<span class="syn-comment">$1</span>');
    safe = safe.replace(keywordRegex, '<span class="syn-keyword">$1</span>');
    return safe;
  }
}

window.OmniComparator = OmniComparator;
