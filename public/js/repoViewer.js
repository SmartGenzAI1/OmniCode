/**
 * OmniCode Code Studio & Polyglot Syntax Highlighter
 * Ultra-fast polyglot syntax tokenization engine & robust Markdown/README renderer.
 */

// Comprehensive keyword registries by language
const KEYWORDS_BY_LANG = {
  rust: new Set([
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super',
    'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'yield', 'macro_rules'
  ]),
  go: new Set([
    'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
    'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
    'return', 'select', 'struct', 'switch', 'type', 'var', 'iota', 'nil', 'make', 'new',
    'len', 'cap', 'append', 'copy', 'delete', 'panic', 'recover'
  ]),
  python: new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'case', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
    'in', 'is', 'lambda', 'match', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
    'try', 'while', 'with', 'yield', 'self', 'cls'
  ]),
  javascript: new Set([
    'abstract', 'arguments', 'async', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
    'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else',
    'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for',
    'function', 'get', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int',
    'interface', 'let', 'long', 'native', 'new', 'null', 'of', 'package', 'private',
    'protected', 'public', 'return', 'set', 'short', 'static', 'super', 'switch',
    'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
    'var', 'void', 'volatile', 'while', 'with', 'yield', 'from'
  ]),
  typescript: new Set([
    'abstract', 'any', 'as', 'asserts', 'async', 'await', 'boolean', 'break', 'case', 'catch',
    'class', 'const', 'constructor', 'continue', 'debugger', 'declare', 'default', 'delete',
    'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
    'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is',
    'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null', 'number', 'object', 'of',
    'override', 'package', 'private', 'protected', 'public', 'readonly', 'require', 'return',
    'satisfies', 'set', 'static', 'string', 'super', 'switch', 'symbol', 'this', 'throw',
    'true', 'try', 'type', 'typeof', 'undefined', 'unique', 'unknown', 'var', 'void',
    'while', 'with', 'yield'
  ]),
  cpp: new Set([
    'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept',
    'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t',
    'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
    'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete',
    'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
    'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
    'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private',
    'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast', 'requires', 'return',
    'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch',
    'synchronized', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef',
    'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile',
    'wchar_t', 'while', 'xor', 'xor_eq'
  ]),
  c: new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
    'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register',
    'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
    'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', '_Alignas', '_Alignof',
    '_Atomic', '_Bool', '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert',
    '_Thread_local'
  ]),
  java: new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
    'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
    'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
    'interface', 'long', 'native', 'new', 'package', 'permits', 'private', 'protected',
    'public', 'record', 'return', 'sealed', 'short', 'static', 'strictfp', 'super',
    'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'var',
    'void', 'volatile', 'while', 'yield', 'non-sealed'
  ]),
  php: new Set([
    'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
    'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo',
    'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch',
    'endwhile', 'enum', 'eval', 'exit', 'extends', 'final', 'finally', 'fn', 'for',
    'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once',
    'instanceof', 'insteadof', 'interface', 'isset', 'list', 'match', 'namespace', 'new',
    'or', 'print', 'private', 'protected', 'public', 'readonly', 'require', 'require_once',
    'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while',
    'xor', 'yield', 'parent', 'self'
  ]),
  ruby: new Set([
    'alias', 'and', 'BEGIN', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do',
    'else', 'elsif', 'END', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module',
    'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super',
    'then', 'true', 'undef', 'unless', 'until', 'when', 'while', 'yield', 'attr_reader',
    'attr_writer', 'attr_accessor', 'require', 'require_relative', 'include', 'extend',
    'puts', 'print', 'p', 'lambda', 'proc', 'raise'
  ]),
  shell: new Set([
    'case', 'do', 'done', 'elif', 'else', 'esac', 'fi', 'for', 'function', 'if', 'in',
    'select', 'then', 'until', 'while', 'time', 'echo', 'printf', 'read', 'cd', 'pwd',
    'export', 'source', 'alias', 'unalias', 'set', 'unset', 'shift', 'exit', 'return',
    'local', 'declare', 'typeset', 'readonly', 'trap', 'exec', 'eval', 'sudo', 'git',
    'npm', 'yarn', 'pnpm', 'cargo', 'docker', 'kubectl', 'cat', 'ls', 'mkdir', 'rm',
    'cp', 'mv', 'chmod', 'chown', 'curl', 'wget', 'grep', 'sed', 'awk'
  ]),
  solidity: new Set([
    'abstract', 'anonymous', 'as', 'assembly', 'assert', 'break', 'calldata', 'case', 'catch',
    'constant', 'constructor', 'continue', 'contract', 'default', 'delete', 'do', 'else',
    'emit', 'enum', 'error', 'event', 'external', 'fallback', 'for', 'function', 'if',
    'immutable', 'import', 'indexed', 'interface', 'internal', 'is', 'leave', 'library',
    'mapping', 'memory', 'modifier', 'new', 'override', 'payable', 'pragma', 'private',
    'public', 'pure', 'receive', 'require', 'return', 'returns', 'revert', 'solidity',
    'storage', 'struct', 'super', 'switch', 'this', 'try', 'type', 'unchecked', 'using',
    'view', 'virtual', 'while', 'wei', 'gwei', 'ether', 'seconds', 'minutes', 'hours', 'days', 'weeks'
  ]),
  zig: new Set([
    'addrspace', 'align', 'allowzero', 'and', 'anyerror', 'anyframe', 'anytype', 'asm',
    'async', 'await', 'break', 'callconv', 'catch', 'comptime', 'const', 'continue',
    'defer', 'else', 'enum', 'errdefer', 'error', 'export', 'extern', 'fn', 'for',
    'if', 'inline', 'linksection', 'noalias', 'noinline', 'nosuspend', 'opaque', 'or',
    'orelse', 'packed', 'pub', 'resume', 'return', 'struct', 'suspend', 'switch',
    'test', 'threadlocal', 'try', 'union', 'unreachable', 'usingnamespace', 'var',
    'volatile', 'while'
  ]),
  html: new Set([
    'doctype', 'html', 'head', 'body', 'title', 'meta', 'link', 'style', 'script', 'div',
    'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'input', 'form',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'nav', 'header',
    'footer', 'section', 'article', 'aside', 'main', 'svg', 'path', 'pre', 'code', 'img',
    'select', 'option', 'textarea', 'iframe', 'canvas', 'video', 'audio'
  ]),
  css: new Set([
    'import', 'media', 'keyframes', 'font-face', 'supports', 'charset', 'namespace',
    'page', 'layer', 'container', 'important', 'from', 'to'
  ]),
  json: new Set([]),
  yaml: new Set(['true', 'false', 'yes', 'no', 'on', 'off', 'null', '~'])
};

// Built-in types & classes across languages
const BUILTIN_TYPES = new Set([
  // Rust
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc',
  'Arc', 'Cell', 'RefCell', 'Mutex', 'RwLock', 'HashMap', 'HashSet', 'BTreeMap', 'BTreeSet',
  'Pin', 'Future', 'Send', 'Sync', 'Clone', 'Copy', 'Debug', 'Display', 'Default',
  'Path', 'PathBuf', 'File', 'Read', 'Write', 'Into', 'From', 'TryInto', 'TryFrom',
  // Go
  'string', 'byte', 'rune', 'error', 'int', 'int8', 'int16', 'int32', 'int64',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'float32', 'float64',
  'complex64', 'complex128', 'any', 'Context', 'Reader', 'Writer', 'Closer', 'Handler',
  'Buffer', 'WaitGroup',
  // Python
  'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'bytes', 'bytearray',
  'object', 'type', 'Any', 'Optional', 'Union', 'List', 'Dict', 'Set', 'Tuple',
  'Callable', 'Iterable', 'Iterator', 'Generator', 'Coroutine', 'Sequence', 'Mapping',
  'Literal', 'TypeVar', 'Generic', 'Protocol',
  // TypeScript / JavaScript
  'Number', 'Boolean', 'Symbol', 'BigInt', 'Object', 'Array', 'Function', 'Promise',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Date', 'RegExp', 'Error', 'Uint8Array', 'Uint16Array',
  'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'DataView', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit',
  'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Parameters', 'InstanceType', 'Awaited',
  'HTMLElement', 'Event', 'Document', 'Window', 'Node', 'Element', 'JSON', 'Math', 'Reflect', 'Proxy',
  // C / C++
  'size_t', 'ptrdiff_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t',
  'uint32_t', 'uint64_t', 'vector', 'unordered_map', 'unordered_set', 'pair', 'unique_ptr',
  'shared_ptr', 'weak_ptr', 'deque', 'stack', 'queue', 'priority_queue', 'optional',
  'variant', 'span', 'string_view', 'uintptr_t', 'intptr_t',
  // Java
  'Integer', 'Long', 'Double', 'Float', 'Character', 'Short', 'ArrayList', 'LinkedList',
  'TreeMap', 'TreeSet', 'CompletableFuture', 'Thread', 'Runnable', 'Exception',
  'RuntimeException', 'Throwable', 'StringBuilder', 'StringBuffer', 'System', 'Objects',
  // Solidity
  'address', 'uint256', 'uint128', 'uint64', 'uint32', 'uint16', 'uint8', 'int256',
  'int128', 'int64', 'int32', 'int16', 'int8', 'bytes32', 'bytes16', 'bytes8', 'bytes4',
  'bytes1', 'mapping', 'ERC20', 'ERC721', 'ERC1155', 'IERC20', 'Ownable',
  // Zig
  'c_int', 'c_uint', 'c_long', 'c_ulong', 'c_char', 'c_void', 'Allocator', 'ArrayList',
  'AutoHashMap', 'StringHashMap'
]);

// Literal constants & booleans
const CONSTANTS_SET = new Set([
  'true', 'false', 'True', 'False', 'null', 'None', 'nil', 'undefined',
  'NaN', 'Infinity', 'nullptr', 'Some', 'Ok', 'Err', 'SUCCESS', 'FAILURE'
]);

// Non-function statement keywords that are followed by '(' in code
const CONTROL_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'switch', 'catch', 'do', 'return', 'throw',
  'sizeof', 'typeof', 'instanceof', 'decltype', 'alignof', 'concept', 'requires',
  'with', 'match', 'case', 'yield', 'import', 'require', 'new', 'delete'
]);

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    if (this.dom.btnModeCode) this.dom.btnModeCode.classList.toggle('active', mode === 'code');
    if (this.dom.btnModeReadme) this.dom.btnModeReadme.classList.toggle('active', mode === 'readme');

    if (mode === 'readme') {
      if (this.dom.codeSurface) this.dom.codeSurface.style.display = 'none';
      if (this.dom.readmeSurface) this.dom.readmeSurface.style.display = 'block';
      this.renderReadmeContent();
    } else {
      if (this.dom.codeSurface) this.dom.codeSurface.style.display = 'flex';
      if (this.dom.readmeSurface) this.dom.readmeSurface.style.display = 'none';
    }
  }

  loadRepository(repo) {
    if (!repo) return;
    
    // Support passing repo ID or full repo object
    if (typeof repo === 'string') {
      if (window.app && Array.isArray(window.app.repositories)) {
        const found = window.app.repositories.find(r => r.id === repo || r.name === repo || r.fullName === repo);
        if (found) {
          repo = found;
        } else {
          repo = { name: repo, fullName: repo, files: [] };
        }
      } else {
        repo = { name: repo, fullName: repo, files: [] };
      }
    }

    this.currentRepo = repo;
    if (this.dom.breadcrumbRepo) this.dom.breadcrumbRepo.textContent = repo.name;
    
    // Update Direct GitHub link
    const fullName = repo.fullName || repo.name;
    const gitUrl = repo.gitUrl || `https://github.com/${fullName}.git`;
    const webUrl = gitUrl.replace(/\.git$/, '');
    if (this.dom.officialGitLink) {
      this.dom.officialGitLink.href = webUrl;
      this.dom.officialGitLink.title = `View ${fullName} on GitHub`;
    }

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
    if (this.dom.fileCount) this.dom.fileCount.textContent = files.length;

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

  selectFile(filePath) {
    if (!this.currentRepo || !this.currentRepo.files) return;
    const file = this.currentRepo.files.find(f => f.path === filePath || f.path === decodeURIComponent(filePath));
    if (file) {
      this.setViewMode('code');
      this.loadFile(file);
    }
  }

  renderReadmeContent() {
    if (!this.currentRepo || !this.dom.renderedReadme) return;
    const raw = this.currentRepo.readme || `# ${this.currentRepo.name}\n\n${this.currentRepo.description || 'No README documentation available.'}`;
    this.dom.renderedReadme.innerHTML = this.parseSimpleMarkdown(raw);

    // Bind markdown code block copy buttons
    this.dom.renderedReadme.querySelectorAll('.md-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const encoded = btn.getAttribute('data-code');
        if (encoded) {
          const rawCode = decodeURIComponent(encoded);
          navigator.clipboard.writeText(rawCode).then(() => {
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<span style="color: var(--accent-emerald);">✓ Copied!</span>`;
            setTimeout(() => { btn.innerHTML = originalContent; }, 1800);
            if (window.app) window.app.showToast('Code block copied to clipboard!', 'success');
          });
        }
      });
    });
  }

  /**
   * Robust, clean Markdown & README Rendering Engine
   */
  parseSimpleMarkdown(md) {
    if (!md || typeof md !== 'string') return '';

    // Step 1: Normalize line endings
    let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Step 2: Extract fenced code blocks first to protect code content
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length;
      const cleanLang = (lang || '').trim().toLowerCase();
      const rawCode = code.replace(/\n$/, '');
      const highlighted = this.highlightSyntax(rawCode, cleanLang);
      const displayLang = cleanLang ? cleanLang.toUpperCase() : 'CODE';

      const blockHtml = `
        <div class="md-code-block">
          <div class="md-code-header">
            <div class="md-code-lang-badge">
              <span class="md-code-dot"></span>
              <span>${escapeHtml(displayLang)}</span>
            </div>
            <button class="md-copy-btn" data-code="${encodeURIComponent(rawCode)}" title="Copy code snippet">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre class="md-pre"><code class="md-code-surface">${highlighted}</code></pre>
        </div>
      `;
      codeBlocks.push(blockHtml);
      return `\n\n%%OMNICODEBLOCK${index}%%\n\n`;
    });

    // Step 3: Parse Tables
    text = text.replace(/((?:^[ \t]*\|[^\n]+\|[ \t]*\n?)+)/gm, (tableBlock) => {
      const lines = tableBlock.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return tableBlock;

      // Check if second line is a header separator |---|---|
      const dividerMatch = lines[1].match(/^\|?\s*([:\-|\s]+)\s*\|?$/);
      if (!dividerMatch) return tableBlock;

      const dividerCols = lines[1].split('|').map(c => c.trim()).filter(c => c.length > 0);
      const alignments = dividerCols.map(col => {
        const left = col.startsWith(':');
        const right = col.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        return 'left';
      });

      const parseRow = (rowStr, tag) => {
        let cells = rowStr.split('|');
        if (cells[0].trim() === '') cells.shift();
        if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
        return '<tr>' + cells.map((c, i) => {
          const align = alignments[i] || 'left';
          const cellContent = this.formatInlineMarkdown(c.trim());
          return `<${tag} style="text-align: ${align};">${cellContent}</${tag}>`;
        }).join('') + '</tr>';
      };

      const thead = '<thead>' + parseRow(lines[0], 'th') + '</thead>';
      const tbodyRows = lines.slice(2).map(r => parseRow(r, 'td')).join('');
      const tbody = '<tbody>' + tbodyRows + '</tbody>';

      return `<div class="md-table-wrap"><table class="md-table">${thead}${tbody}</table></div>\n\n`;
    });

    // Step 4: Parse Line-by-Line structures (Headings, Blockquotes, Alerts, Lists, HR)
    const lines = text.split('\n');
    const resultLines = [];
    let inList = false;
    let listType = null; // 'ul' | 'ol'
    let inQuote = false;
    let quoteBuffer = [];

    const flushQuote = () => {
      if (quoteBuffer.length > 0) {
        const fullQuote = quoteBuffer.join('\n');
        const alertMatch = fullQuote.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?([\s\S]*)$/i);
        if (alertMatch) {
          const type = alertMatch[1].toUpperCase();
          const content = this.formatInlineMarkdown(alertMatch[2].trim());
          const icons = {
            NOTE: 'ℹ️',
            TIP: '💡',
            IMPORTANT: '📌',
            WARNING: '⚠️',
            CAUTION: '🛑'
          };
          resultLines.push(`
            <div class="md-alert md-alert-${type.toLowerCase()}">
              <div class="md-alert-title"><span class="md-alert-icon">${icons[type] || '📌'}</span> ${type}</div>
              <div class="md-alert-body">${content}</div>
            </div>
          `);
        } else {
          resultLines.push(`
            <blockquote class="md-blockquote">
              <p>${this.formatInlineMarkdown(fullQuote)}</p>
            </blockquote>
          `);
        }
        quoteBuffer = [];
      }
      inQuote = false;
    };

    const flushList = () => {
      if (inList) {
        resultLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block placeholder
      if (line.includes('%%OMNICODEBLOCK')) {
        flushQuote();
        flushList();
        resultLines.push(line);
        continue;
      }

      // Table wrapper
      if (line.includes('<div class="md-table-wrap">') || line.includes('</table></div>')) {
        flushQuote();
        flushList();
        resultLines.push(line);
        continue;
      }

      // Blockquotes
      const quoteMatch = line.match(/^[ \t]*>[ \t]?(.*)$/);
      if (quoteMatch) {
        flushList();
        inQuote = true;
        quoteBuffer.push(quoteMatch[1]);
        continue;
      } else if (inQuote) {
        flushQuote();
      }

      // Horizontal rules
      if (/^[ \t]*([*_-][ \t]*){3,}[ \t]*$/.test(line)) {
        flushList();
        resultLines.push('<hr class="md-hr" />');
        continue;
      }

      // Headings H1 - H6
      const headingMatch = line.match(/^[ \t]*(#{1,6})[ \t]+(.*)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const slug = headingText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const formatted = this.formatInlineMarkdown(headingText);
        resultLines.push(`
          <h${level} class="md-heading md-h${level}" id="${slug}">
            <a href="#${slug}" class="md-heading-anchor" title="Direct anchor link">
              <span class="md-anchor-hash">#</span>
            </a>
            <span>${formatted}</span>
          </h${level}>
        `);
        continue;
      }

      // Task List items: - [ ] or - [x]
      const taskMatch = line.match(/^[ \t]*[-*+][ \t]+\[([ xX])\][ \t]+(.*)$/);
      if (taskMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          resultLines.push('<ul class="md-list md-task-list">');
          inList = true;
          listType = 'ul';
        }
        const isChecked = taskMatch[1].toLowerCase() === 'x';
        const itemContent = this.formatInlineMarkdown(taskMatch[2].trim());
        resultLines.push(`
          <li class="md-task-item ${isChecked ? 'is-completed' : ''}">
            <span class="md-task-checkbox ${isChecked ? 'checked' : 'unchecked'}">
              ${isChecked ? '✓' : ''}
            </span>
            <span class="md-task-text">${itemContent}</span>
          </li>
        `);
        continue;
      }

      // Unordered list items: - item, * item, + item
      const ulMatch = line.match(/^[ \t]*[-*+][ \t]+(.*)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          resultLines.push('<ul class="md-list">');
          inList = true;
          listType = 'ul';
        }
        const itemContent = this.formatInlineMarkdown(ulMatch[1].trim());
        resultLines.push(`<li>${itemContent}</li>`);
        continue;
      }

      // Ordered list items: 1. item
      const olMatch = line.match(/^[ \t]*\d+\.[ \t]+(.*)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          resultLines.push('<ol class="md-list md-list-ordered">');
          inList = true;
          listType = 'ol';
        }
        const itemContent = this.formatInlineMarkdown(olMatch[1].trim());
        resultLines.push(`<li>${itemContent}</li>`);
        continue;
      }

      // Blank line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular Paragraph text
      flushList();
      const pContent = this.formatInlineMarkdown(line.trim());
      if (pContent) {
        resultLines.push(`<p class="md-p">${pContent}</p>`);
      }
    }

    flushQuote();
    flushList();

    let outputHtml = resultLines.join('\n');

    // Step 5: Restore code blocks
    codeBlocks.forEach((blockHtml, idx) => {
      outputHtml = outputHtml.replace(`%%OMNICODEBLOCK${idx}%%`, blockHtml);
    });

    return `<div class="markdown-document">${outputHtml}</div>`;
  }

  /**
   * Inline Markdown formatter (bold, italics, strikethrough, code, links, images)
   */
  formatInlineMarkdown(str) {
    if (!str) return '';
    let res = str;

    // 1. Protect inline code first (using token placeholder with no underscores/asterisks)
    const inlineCodes = [];
    res = res.replace(/`([^`]+)`/g, (match, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code class="md-inline-code">${escapeHtml(code)}</code>`);
      return `%%OMNIINLINECODE${idx}%%`;
    });

    // 2. Escape raw HTML entities
    res = res
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 3. Images and Badges: ![alt](url)
    res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const cleanUrl = url.trim().replace(/^javascript:/i, '#');
      return `<img class="md-img-badge" src="${cleanUrl}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
    });

    // 4. Links: [text](url)
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const cleanUrl = url.trim().replace(/^javascript:/i, '#');
      return `<a class="md-link" href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // 5. Bold & Italics & Strikethrough
    res = res.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-bold">$1</strong>');
    res = res.replace(/__([^_]+)__/g, '<strong class="md-bold">$1</strong>');
    res = res.replace(/\*([^*]+)\*/g, '<em class="md-italic">$1</em>');
    res = res.replace(/_([^_]+)_/g, '<em class="md-italic">$1</em>');
    res = res.replace(/~~([^~]+)~~/g, '<del class="md-del">$1</del>');

    // 6. Restore inline code
    inlineCodes.forEach((codeHtml, idx) => {
      res = res.replace(`%%OMNIINLINECODE${idx}%%`, codeHtml);
    });

    return res;
  }

  renderFileTree(files) {
    if (!this.dom.treeList) return;
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
    if (this.dom.treeList) {
      const items = this.dom.treeList.querySelectorAll('.tree-node-item');
      items.forEach(i => i.classList.toggle('active', i.dataset.path === file.path));
    }

    // Update breadcrumbs and metrics
    if (this.dom.breadcrumbFile) this.dom.breadcrumbFile.textContent = file.path;
    if (this.dom.metricLanguage) this.dom.metricLanguage.textContent = file.language || 'Plain Text';
    if (this.dom.metricSloc) this.dom.metricSloc.textContent = `${file.codeLines || file.totalLines || 0} SLOC`;
    if (this.dom.metricComplexity) this.dom.metricComplexity.textContent = `Complexity: ${file.complexity || 1}`;

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
    if (!this.dom.symbolCount || !this.dom.symbolList) return;
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
    if (!this.dom.lineNumbers) return;
    const lineElements = this.dom.lineNumbers.children;
    if (lineElements && lineElements[lineNum - 1]) {
      lineElements[lineNum - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Visual pulse
      lineElements[lineNum - 1].classList.add('line-highlighted');
      setTimeout(() => {
        lineElements[lineNum - 1].classList.remove('line-highlighted');
      }, 2000);
    }
  }

  renderCode(rawContent, language) {
    if (!this.dom.lineNumbers || !this.dom.codeContent) return;
    const lines = rawContent.split(/\r?\n/);
    
    // Generate line numbers with click-to-highlight
    this.dom.lineNumbers.innerHTML = '';
    for (let i = 1; i <= lines.length; i++) {
      const lineEl = document.createElement('div');
      lineEl.textContent = i;
      lineEl.addEventListener('click', () => {
        this.dom.lineNumbers.querySelectorAll('.line-highlighted').forEach(el => el.classList.remove('line-highlighted'));
        lineEl.classList.add('line-highlighted');
      });
      this.dom.lineNumbers.appendChild(lineEl);
    }

    // Apply high-performance token syntax highlighting
    const highlightedCode = this.highlightSyntax(rawContent, language);
    this.dom.codeContent.innerHTML = `<code>${highlightedCode}</code>`;
  }

  /**
   * OmniCode Polyglot Token Syntax Engine
   * Supports: Rust, Go, Python, TypeScript, JavaScript, C/C++, Java, PHP, Ruby, Shell, Solidity, Zig, HTML, CSS, JSON, YAML.
   */
  highlightSyntax(code, language) {
    if (!code || typeof code !== 'string') return '';

    const lang = (language || '').toLowerCase().trim();
    const langKey = (
      lang.includes('rust') || lang === 'rs' ? 'rust' :
      lang.includes('python') || lang === 'py' ? 'python' :
      lang.includes('go') || lang === 'golang' ? 'go' :
      lang.includes('typescript') || lang === 'ts' || lang === 'tsx' ? 'typescript' :
      lang.includes('javascript') || lang === 'js' || lang === 'jsx' ? 'javascript' :
      lang.includes('c++') || lang === 'cpp' || lang === 'hpp' || lang === 'cc' ? 'cpp' :
      lang === 'c' || lang === 'h' ? 'c' :
      lang.includes('java') ? 'java' :
      lang.includes('php') ? 'php' :
      lang.includes('ruby') || lang === 'rb' ? 'ruby' :
      lang.includes('sh') || lang.includes('bash') || lang === 'zsh' ? 'shell' :
      lang.includes('solidity') || lang === 'sol' ? 'solidity' :
      lang.includes('zig') ? 'zig' :
      lang.includes('html') || lang === 'xml' || lang === 'svg' ? 'html' :
      lang.includes('css') || lang === 'scss' || lang === 'sass' || lang === 'less' ? 'css' :
      lang.includes('json') ? 'json' :
      lang.includes('yaml') || lang === 'yml' ? 'yaml' : 'generic'
    );

    const langKeywords = KEYWORDS_BY_LANG[langKey] || KEYWORDS_BY_LANG.typescript;

    // Master Polyglot Lexer Regex
    const TOKEN_REGEX = new RegExp([
      // Group 1: Attributes, Decorators, Preprocessor directives, !important (MUST BE BEFORE general '#' comments)
      '(#\\!*\\[[^\\]\\r\\n]*\\]|#\\s*(?:include|define|undef|ifdef|ifndef|if|elif|else|endif|pragma|error|warning)\\b[^\\r\\n]*|@[a-zA-Z_][a-zA-Z0-9_.]*|!important\\b)',
      // Group 2: Comments (multiline /* */, <!-- -->, single-line //, #, --)
      '(/\\*[\\s\\S]*?\\*/|<!--[\\s\\S]*?-->|//[^\\r\\n]*|#[^\\r\\n]*|--[^\\r\\n]*)',
      // Group 3: Strings (template literals, triple-quotes, double/single quotes, raw strings)
      '(`(?:[^`\\\\]|\\\\.)*`|"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|r#*"(?:[\\s\\S]*?)"#*)',
      // Group 4: Numbers (Hex, Binary, Octal, Floats, Scientific, Integers with type suffixes)
      '(\\b0[xX][0-9a-fA-F_]+n?\\b|\\b0[bB][01_]+n?\\b|\\b0[oO][0-7_]+n?\\b|\\b\\d+(?:_\\d+)*(?:\\.\\d+(?:_\\d+)*)?(?:[eE][+-]?\\d+)?(?:f32|f64|u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|n|L|f)?\\b)',
      // Group 5: Function invocations / declarations (identifier followed by '(')
      '(\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\())',
      // Group 6: General Word Identifiers (keywords, types, variables)
      '(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)',
      // Group 7: Multi-character & Single-character Operators
      '(===|!==|==|!=|<=|>=|=>|->|::|\\+\\+|--|\\+=|-=|\\*=|/=|%=|&=|\\|=|\\^=|<<=|>>=|&&|\\|\\||\\?\\?|\\.\\.\\.|\\.\\.|<<|>>|[-+*/%&|^~!?=<>:])'
    ].join('|'), 'g');

    let result = '';
    let lastIndex = 0;
    let match;

    TOKEN_REGEX.lastIndex = 0;
    while ((match = TOKEN_REGEX.exec(code)) !== null) {
      // Append any unmatched text before this token
      if (match.index > lastIndex) {
        result += escapeHtml(code.slice(lastIndex, match.index));
      }

      const tok = match[0];

      if (match[1]) {
        // Attribute / Decorator / Preprocessor
        result += `<span class="syn-attr">${escapeHtml(tok)}</span>`;
      } else if (match[2]) {
        // Comment
        result += `<span class="syn-comment">${escapeHtml(tok)}</span>`;
      } else if (match[3]) {
        // String
        result += `<span class="syn-string">${escapeHtml(tok)}</span>`;
      } else if (match[4]) {
        // Number
        result += `<span class="syn-number">${escapeHtml(tok)}</span>`;
      } else if (match[5]) {
        // Function definition / invocation
        if (CONTROL_KEYWORDS.has(tok)) {
          result += `<span class="syn-keyword">${tok}</span>`;
        } else if (langKeywords.has(tok)) {
          result += `<span class="syn-keyword">${tok}</span>`;
        } else if (BUILTIN_TYPES.has(tok)) {
          result += `<span class="syn-type">${tok}</span>`;
        } else {
          result += `<span class="syn-func">${tok}</span>`;
        }
      } else if (match[6]) {
        // Word Identifier
        if (langKeywords.has(tok)) {
          result += `<span class="syn-keyword">${tok}</span>`;
        } else if (CONSTANTS_SET.has(tok)) {
          result += `<span class="syn-number">${tok}</span>`;
        } else if (BUILTIN_TYPES.has(tok)) {
          result += `<span class="syn-type">${tok}</span>`;
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(tok) && tok !== tok.toUpperCase()) {
          // PascalCase identifier (custom types / structs / classes / traits)
          result += `<span class="syn-type">${tok}</span>`;
        } else {
          result += escapeHtml(tok);
        }
      } else if (match[7]) {
        // Operator
        result += `<span class="syn-operator">${escapeHtml(tok)}</span>`;
      } else {
        result += escapeHtml(tok);
      }

      lastIndex = match.index + tok.length;
    }

    if (lastIndex < code.length) {
      result += escapeHtml(code.slice(lastIndex));
    }

    return result;
  }

  clearViewer() {
    this.currentFile = null;
    if (this.dom.breadcrumbFile) this.dom.breadcrumbFile.textContent = 'No files available';
    if (this.dom.metricLanguage) this.dom.metricLanguage.textContent = '--';
    if (this.dom.metricSloc) this.dom.metricSloc.textContent = '--';
    if (this.dom.metricComplexity) this.dom.metricComplexity.textContent = '--';
    if (this.dom.lineNumbers) this.dom.lineNumbers.innerHTML = '';
    if (this.dom.codeContent) this.dom.codeContent.innerHTML = '<code>// No files indexed in this repository.</code>';
    if (this.dom.symbolList) this.dom.symbolList.innerHTML = '';
    if (this.dom.symbolCount) this.dom.symbolCount.textContent = '0';
  }
}

// Static accessors for OmniRepoViewer
OmniRepoViewer.highlightSyntax = function(code, language) {
  return OmniRepoViewer.prototype.highlightSyntax(code, language);
};

OmniRepoViewer.parseSimpleMarkdown = function(md) {
  return OmniRepoViewer.prototype.parseSimpleMarkdown(md);
};

window.OmniRepoViewer = OmniRepoViewer;
