/**
 * OmniCode Code Studio & Polyglot Syntax Highlighter
 */

class OmniRepoViewer {
  constructor() {
    this.currentRepo = null;
    this.currentFile = null;
    this.viewMode = 'code'; // 'code' | 'readme'

    this.dom = {
      repoSelect: document.getElementById('viewer-repo-select'),
      officialGitLink: document.getElementById('btn-official-git-link'),
      btnOpenVsCodeWeb: document.getElementById('btn-open-vscode-web'),
      btnOpenGitpod: document.getElementById('btn-open-gitpod'),
      btnQuickClone: document.getElementById('btn-quick-clone'),
      treeList: document.getElementById('viewer-tree-list'),
      fileCount: document.getElementById('viewer-file-count'),
      symbolList: document.getElementById('viewer-symbol-list'),
      symbolCount: document.getElementById('viewer-symbol-count'),
      breadcrumbRepo: document.getElementById('breadcrumb-repo-name'),
      breadcrumbFile: document.getElementById('breadcrumb-file-path'),
      metricLanguage: document.getElementById('metric-language'),
      metricSloc: document.getElementById('metric-sloc'),
      metricComplexity: document.getElementById('metric-complexity'),
      btnCopyCode: document.getElementById('btn-copy-code'),
      lineNumbers: document.getElementById('editor-line-numbers'),
      codeContent: document.getElementById('editor-code-content'),
      
      // Segmented Sidebar Tabs
      segTree: document.getElementById('seg-btn-tree'),
      segSymbols: document.getElementById('seg-btn-symbols'),
      segArch: document.getElementById('seg-btn-arch'),
      paneTree: document.getElementById('studio-pane-tree'),
      paneSymbols: document.getElementById('studio-pane-symbols'),
      paneArch: document.getElementById('studio-pane-arch'),

      // Architecture Inspector elements
      archGrade: document.getElementById('arch-grade'),
      archComplexityDesc: document.getElementById('arch-complexity-desc'),
      archAlgoClass: document.getElementById('arch-algo-class'),
      archFunctionList: document.getElementById('arch-function-list'),
      
      // Dual mode elements
      btnModeCode: document.getElementById('btn-mode-code'),
      btnModeReadme: document.getElementById('btn-mode-readme'),
      codeSurface: document.getElementById('viewport-code-surface'),
      readmeSurface: document.getElementById('viewport-readme-surface'),
      renderedReadme: document.getElementById('rendered-readme-content')
    };

    this.bindEvents();
  }

  bindEvents() {
    if (this.dom.repoSelect) {
      this.dom.repoSelect.addEventListener('change', (e) => {
        if (window.app && e.target.value) {
          window.app.openRepoInStudio(e.target.value);
        }
      });
    }

    // Sidebar Segment Switcher (Files / Symbols / Architecture)
    const segButtons = [
      { btn: this.dom.segTree, pane: this.dom.paneTree },
      { btn: this.dom.segSymbols, pane: this.dom.paneSymbols },
      { btn: this.dom.segArch, pane: this.dom.paneArch }
    ];

    segButtons.forEach(({ btn, pane }) => {
      if (btn && pane) {
        btn.addEventListener('click', () => {
          segButtons.forEach(s => {
            if (s.btn) s.btn.classList.remove('active');
            if (s.pane) s.pane.style.display = 'none';
          });
          btn.classList.add('active');
          pane.style.display = 'block';
        });
      }
    });

    if (this.dom.btnQuickClone) {
      this.dom.btnQuickClone.addEventListener('click', () => {
        if (this.currentRepo) {
          const cmd = `git clone ${this.currentRepo.gitUrl || `https://github.com/${this.currentRepo.fullName}.git`}`;
          navigator.clipboard.writeText(cmd).then(() => {
            if (window.app) window.app.showToast(`Copied clone command: ${cmd}`, 'success');
          });
        }
      });
    }

    if (this.dom.btnCopyCode) {
      this.dom.btnCopyCode.addEventListener('click', () => {
        if (this.currentFile && this.currentFile.content) {
          navigator.clipboard.writeText(this.currentFile.content).then(() => {
            if (window.app) window.app.showToast('Source code copied to clipboard!', 'success');
          });
        }
      });
    }

    if (this.dom.btnModeCode && this.dom.btnModeReadme) {
      this.dom.btnModeCode.addEventListener('click', () => {
        this.setViewMode('code');
      });

      this.dom.btnModeReadme.addEventListener('click', () => {
        this.setViewMode('readme');
      });
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.dom.btnModeCode.classList.toggle('active', mode === 'code');
    this.dom.btnModeReadme.classList.toggle('active', mode === 'readme');

    if (mode === 'readme') {
      this.dom.codeSurface.style.display = 'none';
      this.dom.readmeSurface.style.display = 'block';
      this.renderReadmeContent();
    } else {
      this.dom.codeSurface.style.display = 'flex';
      this.dom.readmeSurface.style.display = 'none';
    }
  }

  loadRepository(repo) {
    if (!repo) return;
    this.currentRepo = repo;
    this.dom.breadcrumbRepo.textContent = repo.name;
    
    // Update Direct GitHub link
    const fullName = repo.fullName || repo.name;
    const gitUrl = repo.gitUrl || `https://github.com/${fullName}.git`;
    const webUrl = gitUrl.replace(/\.git$/, '');
    this.dom.officialGitLink.href = webUrl;
    this.dom.officialGitLink.title = `View ${fullName} on GitHub`;

    // Update Web IDE Links
    if (this.dom.btnOpenVsCodeWeb) {
      this.dom.btnOpenVsCodeWeb.href = `https://github.dev/${fullName}`;
      this.dom.btnOpenVsCodeWeb.title = `Open ${fullName} in VS Code Web (github.dev)`;
    }
    if (this.dom.btnOpenGitpod) {
      this.dom.btnOpenGitpod.href = `https://gitpod.io/#https://github.com/${fullName}`;
      this.dom.btnOpenGitpod.title = `Launch ${fullName} dev environment in Gitpod`;
    }

    // Populate file count
    const files = repo.files || [];
    this.dom.fileCount.textContent = files.length;

    // Render tree
    this.renderFileTree(files);

    // Select first file if available
    if (files.length > 0) {
      this.loadFile(files[0]);
    } else {
      this.clearViewer();
    }

    if (this.viewMode === 'readme') {
      this.renderReadmeContent();
    }
  }

  renderReadmeContent() {
    if (!this.currentRepo) return;
    const raw = this.currentRepo.readme || `# ${this.currentRepo.name}\n\n${this.currentRepo.description || 'No README documentation available.'}`;
    this.dom.renderedReadme.innerHTML = this.parseSimpleMarkdown(raw);
  }

  parseSimpleMarkdown(md) {
    if (!md) return '';
    // Escape HTML entities FIRST to prevent XSS
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Now apply markdown formatting on the safe string
    html = html
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*?)\*/gim, '<i>$1</i>')
      .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br />');

    return html;
  }

  renderFileTree(files) {
    this.dom.treeList.innerHTML = '';
    files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'tree-node-item';
      item.dataset.path = file.path;
      item.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        <span>${file.path}</span>
      `;
      item.addEventListener('click', () => {
        this.setViewMode('code');
        this.loadFile(file);
      });
      this.dom.treeList.appendChild(item);
    });
  }

  loadFile(file) {
    this.currentFile = file;

    // Highlight active tree item
    const items = this.dom.treeList.querySelectorAll('.tree-node-item');
    items.forEach(i => i.classList.toggle('active', i.dataset.path === file.path));

    // Update breadcrumbs and metrics
    this.dom.breadcrumbFile.textContent = file.path;
    this.dom.metricLanguage.textContent = file.language || 'Plain Text';
    this.dom.metricSloc.textContent = `${file.codeLines || file.totalLines || 0} SLOC`;
    this.dom.metricComplexity.textContent = `Complexity: ${file.complexity || 1}`;

    // Render Symbols
    this.renderSymbols(file.symbols || []);

    // Render Architecture & AST Analysis
    this.renderArchitecture(file);

    // Render Code & Line Numbers
    this.renderCode(file.content || '', file.language);
  }

  renderArchitecture(file) {
    if (!this.dom.archGrade) return;

    const comp = file.complexity || 1;
    const lines = file.codeLines || 10;
    const symbols = file.symbols || [];

    // Grade calculation
    let grade = 'A+';
    let desc = 'Clean, modular, low cognitive branching';
    let algoClass = 'O(1) Constant / O(N) Sequential';

    if (comp > 25 || lines > 500) {
      grade = 'C';
      desc = 'High branching complexity. Consider decomposing routines.';
      algoClass = 'O(N²) Nested Iteration';
    } else if (comp > 12 || lines > 200) {
      grade = 'B+';
      desc = 'Moderate cyclomatic branching. Production solid.';
      algoClass = 'O(N log N) Divide & Conquer';
    } else if (comp > 6) {
      grade = 'A';
      desc = 'Very maintainable, standard control flow.';
      algoClass = 'O(N) Linear Scan';
    }

    this.dom.archGrade.textContent = grade;
    this.dom.archGrade.style.color = grade.startsWith('A') ? 'var(--accent-emerald)' : (grade.startsWith('B') ? 'var(--accent-cyan)' : 'var(--accent-amber)');
    if (this.dom.archComplexityDesc) this.dom.archComplexityDesc.textContent = desc;
    if (this.dom.archAlgoClass) this.dom.archAlgoClass.textContent = algoClass;

    // Functions list
    if (this.dom.archFunctionList) {
      const funcs = symbols.filter(s => s.type === 'function' || s.type === 'method' || s.type === 'class' || s.type === 'struct');
      if (funcs.length === 0) {
        this.dom.archFunctionList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); padding: 4px;">No top-level functions in this file.</div>';
      } else {
        this.dom.archFunctionList.innerHTML = funcs.slice(0, 15).map(fn => `
          <div class="arch-func-item" data-line="${fn.line || 1}">
            <span>${fn.type === 'class' || fn.type === 'struct' ? '🏛️' : '⚡'} ${fn.name}</span>
            <span class="arch-func-line">L${fn.line || 1}</span>
          </div>
        `).join('');

        this.dom.archFunctionList.querySelectorAll('.arch-func-item').forEach(el => {
          el.addEventListener('click', () => {
            const line = parseInt(el.getAttribute('data-line'), 10) || 1;
            this.scrollToLine(line);
          });
        });
      }
    }
  }

  renderSymbols(symbols) {
    this.dom.symbolCount.textContent = symbols.length;
    this.dom.symbolList.innerHTML = '';

    if (symbols.length === 0) {
      this.dom.symbolList.innerHTML = '<div style="padding: 12px 16px; font-size: 11px; color: var(--text-low);">No symbols extracted</div>';
      return;
    }

    symbols.forEach(sym => {
      const item = document.createElement('div');
      item.className = 'symbol-row-item';
      item.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="symbol-type-pill">${sym.type}</span>
          <span>${sym.name}</span>
        </div>
        <span class="symbol-line-tag">L${sym.line}</span>
      `;
      item.addEventListener('click', () => {
        this.scrollToLine(sym.line);
      });
      this.dom.symbolList.appendChild(item);
    });
  }

  scrollToLine(lineNum) {
    const lineElements = this.dom.lineNumbers.children;
    if (lineElements && lineElements[lineNum - 1]) {
      lineElements[lineNum - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  renderCode(rawContent, language) {
    const lines = rawContent.split(/\r?\n/);
    
    // Generate line numbers with click-to-highlight
    this.dom.lineNumbers.innerHTML = '';
    for (let i = 1; i <= lines.length; i++) {
      const lineEl = document.createElement('div');
      lineEl.textContent = i;
      lineEl.addEventListener('click', () => {
        // Clear previous highlights
        this.dom.lineNumbers.querySelectorAll('.line-highlighted').forEach(el => el.classList.remove('line-highlighted'));
        lineEl.classList.add('line-highlighted');
      });
      this.dom.lineNumbers.appendChild(lineEl);
    }

    // Apply fast token syntax highlighting
    const highlightedCode = this.highlightSyntax(rawContent, language);
    this.dom.codeContent.innerHTML = `<code>${highlightedCode}</code>`;
  }

  highlightSyntax(code, language) {
    if (!code) return '';

    // HTML escape first
    let safe = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tokenize in priority order: strings, comments, then keywords/numbers
    // This prevents highlighting keywords inside strings or comments
    const tokens = [];
    let remaining = safe;
    let offset = 0;

    // Match strings, comments, keywords, and numbers with a single combined regex
    const combinedRegex = /(&quot;(?:[^&]|&(?!quot;))*?&quot;|'(?:[^'\\]|\\.)*?'|`(?:[^`\\]|\\.)*?`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g;

    const keywords = new Set([
      'fn', 'let', 'mut', 'impl', 'struct', 'enum', 'trait', 'pub', 'crate', 'use', 'match',
      'func', 'package', 'import', 'interface', 'chan', 'defer', 'go', 'select', 'type',
      'function', 'const', 'var', 'class', 'export', 'async', 'await', 'return', 'if', 'else',
      'def', 'self', 'lambda', 'with', 'yield', 'from', 'as', 'try', 'except', 'for', 'while',
      'template', 'namespace', 'constexpr', 'virtual', 'override', 'public', 'private',
      'contract', 'pragma', 'modifier', 'event', 'mapping', 'address', 'uint256',
      'defmodule', 'defp', 'defstruct', 'pipe', 'new', 'delete', 'throw', 'catch',
      'true', 'false', 'null', 'nil', 'None', 'void', 'bool', 'int', 'float', 'string',
      'static', 'final', 'abstract', 'extends', 'implements', 'super', 'this',
      'require', 'module', 'exports', 'include', 'define'
    ]);

    // First pass: protect strings and comments
    const parts = [];
    let lastIdx = 0;
    let match;

    combinedRegex.lastIndex = 0;
    while ((match = combinedRegex.exec(safe)) !== null) {
      // Push text before this match
      if (match.index > lastIdx) {
        parts.push({ type: 'code', text: safe.slice(lastIdx, match.index) });
      }
      // Determine if it's a string or comment
      const m = match[0];
      if (m.startsWith('//') || m.startsWith('/*') || m.startsWith('#')) {
        parts.push({ type: 'comment', text: m });
      } else {
        parts.push({ type: 'string', text: m });
      }
      lastIdx = match.index + m.length;
    }
    if (lastIdx < safe.length) {
      parts.push({ type: 'code', text: safe.slice(lastIdx) });
    }

    // Second pass: highlight keywords and numbers in code segments only
    const keywordRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const numberRegex = /\b(\d+(\.\d+)?(e[+-]?\d+)?)\b/gi;

    return parts.map(part => {
      if (part.type === 'comment') {
        return `<span class="syn-comment">${part.text}</span>`;
      }
      if (part.type === 'string') {
        return `<span class="syn-string">${part.text}</span>`;
      }
      // Code: highlight keywords and numbers
      let text = part.text;
      text = text.replace(keywordRegex, (full, word) => {
        if (keywords.has(word)) {
          return `<span class="syn-keyword">${word}</span>`;
        }
        return full;
      });
      text = text.replace(numberRegex, '<span class="syn-number">$1</span>');
      return text;
    }).join('');
  }

  clearViewer() {
    this.currentFile = null;
    this.dom.breadcrumbFile.textContent = 'No files available';
    this.dom.metricLanguage.textContent = '--';
    this.dom.metricSloc.textContent = '--';
    this.dom.metricComplexity.textContent = '--';
    this.dom.lineNumbers.innerHTML = '';
    this.dom.codeContent.innerHTML = '<code>// No files indexed in this repository.</code>';
    this.dom.symbolList.innerHTML = '';
    this.dom.symbolCount.textContent = '0';
  }
}

window.OmniRepoViewer = OmniRepoViewer;
