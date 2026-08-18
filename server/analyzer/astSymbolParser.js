/**
 * OmniCode Sovereign AST & Symbol Parser
 * Extracts symbols (functions, structs, classes, interfaces, enums, exports)
 * and dependency graph relationships across polyglot source trees.
 */

const { detectLanguageByPath } = require('./languageDetector');

/**
 * Extracts declared symbols from source code based on language
 * @param {string} content
 * @param {string} filePath
 */
function extractSymbols(content, filePath) {
  if (!content || typeof content !== 'string') return [];
  
  const lang = detectLanguageByPath(filePath);
  const symbols = [];
  const lines = content.split(/\r?\n/);

  // Polyglot symbol pattern matchers
  const rules = {
    Rust: [
      { type: 'function', regex: /^\s*(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<[^>]*>)?\s*\(/ },
      { type: 'struct', regex: /^\s*(?:pub\s+)?struct\s+([a-zA-Z0-9_]+)/ },
      { type: 'enum', regex: /^\s*(?:pub\s+)?enum\s+([a-zA-Z0-9_]+)/ },
      { type: 'trait', regex: /^\s*(?:pub\s+)?trait\s+([a-zA-Z0-9_]+)/ },
      { type: 'impl', regex: /^\s*impl(?:\s*<[^>]*>)?\s+(?:[a-zA-Z0-9_:]+\s+for\s+)?([a-zA-Z0-9_:]+)/ }
    ],
    Go: [
      { type: 'function', regex: /^func\s+(?:\([^\)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/ },
      { type: 'struct', regex: /^type\s+([a-zA-Z0-9_]+)\s+struct/ },
      { type: 'interface', regex: /^type\s+([a-zA-Z0-9_]+)\s+interface/ }
    ],
    TypeScript: [
      { type: 'function', regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/ },
      { type: 'class', regex: /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_]+)/ },
      { type: 'interface', regex: /^\s*(?:export\s+)?interface\s+([a-zA-Z0-9_]+)/ },
      { type: 'type', regex: /^\s*(?:export\s+)?type\s+([a-zA-Z0-9_]+)\s*=/ },
      { type: 'enum', regex: /^\s*(?:export\s+)?enum\s+([a-zA-Z0-9_]+)/ },
      { type: 'const-fn', regex: /^\s*(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^\)]*\)\s*=>/ }
    ],
    JavaScript: [
      { type: 'function', regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/ },
      { type: 'class', regex: /^\s*(?:export\s+)?class\s+([a-zA-Z0-9_]+)/ },
      { type: 'const-fn', regex: /^\s*(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^\)]*\)\s*=>/ }
    ],
    Python: [
      { type: 'function', regex: /^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(/ },
      { type: 'class', regex: /^\s*class\s+([a-zA-Z0-9_]+)/ }
    ],
    'C++': [
      { type: 'class', regex: /^\s*(?:class|struct)\s+([a-zA-Z0-9_]+)(?:\s*:\s*[^{]+)?\s*\{?/ },
      { type: 'namespace', regex: /^\s*namespace\s+([a-zA-Z0-9_]+)/ },
      { type: 'function', regex: /^\s*(?:inline|static|virtual|constexpr)?\s*[a-zA-Z0-9_<>\*&:]+\s+([a-zA-Z0-9_]+)\s*\([^\)]*\)\s*(?:const|override|noexcept)?\s*\{?/ }
    ],
    C: [
      { type: 'struct', regex: /^\s*(?:typedef\s+)?struct\s+([a-zA-Z0-9_]+)?\s*\{?/ },
      { type: 'function', regex: /^\s*(?:static\s+)?[a-zA-Z0-9_\*]+\s+([a-zA-Z0-9_]+)\s*\([^\)]*\)\s*\{?/ }
    ],
    Zig: [
      { type: 'function', regex: /^\s*(?:pub\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(/ },
      { type: 'struct', regex: /^\s*(?:pub\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*struct/ }
    ]
  };

  const activeRules = rules[lang] || rules['JavaScript'];

  lines.forEach((line, idx) => {
    for (const rule of activeRules) {
      const match = line.match(rule.regex);
      if (match && match[1]) {
        symbols.push({
          name: match[1],
          type: rule.type,
          line: idx + 1,
          signature: line.trim().slice(0, 100)
        });
        break;
      }
    }
  });

  return symbols;
}

/**
 * Extracts import/require/use dependencies from a source file
 * @param {string} content
 * @param {string} filePath
 */
function extractDependencies(content, filePath) {
  if (!content || typeof content !== 'string') return [];
  const lang = detectLanguageByPath(filePath);
  const deps = new Set();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (lang === 'Rust') {
      const m = trimmed.match(/^use\s+([a-zA-Z0-9_]+)/);
      if (m && m[1] !== 'crate' && m[1] !== 'super' && m[1] !== 'self') deps.add(m[1]);
    } else if (lang === 'Go') {
      const m = trimmed.match(/^import\s+["']([^"']+)["']/);
      if (m) deps.add(m[1].split('/').pop());
    } else if (lang === 'TypeScript' || lang === 'JavaScript') {
      const m1 = trimmed.match(/^import\s+.*?from\s+['"]([^'"]+)['"]/);
      const m2 = trimmed.match(/require\(['"]([^'"]+)['"]\)/);
      if (m1) deps.add(m1[1]);
      if (m2) deps.add(m2[1]);
    } else if (lang === 'Python') {
      const m1 = trimmed.match(/^import\s+([a-zA-Z0-9_]+)/);
      const m2 = trimmed.match(/^from\s+([a-zA-Z0-9_]+)/);
      if (m1) deps.add(m1[1]);
      if (m2) deps.add(m2[1]);
    } else if (lang === 'C++' || lang === 'C') {
      const m = trimmed.match(/^#include\s+[<"]([^>"]+)[>"]/);
      if (m) deps.add(m[1]);
    }
  }

  return Array.from(deps);
}

/**
 * Constructs a node-and-link dependency graph representation of repository files
 * @param {Array<{path: string, content: string}>} files
 */
function buildRepositoryGraph(files = []) {
  const nodes = [];
  const links = [];
  const fileMap = new Map();

  files.forEach((file, index) => {
    const lang = detectLanguageByPath(file.path);
    const symbols = extractSymbols(file.content || '', file.path);
    const deps = extractDependencies(file.content || '', file.path);
    
    const node = {
      id: file.path,
      name: file.path.split(/[/\\]/).pop(),
      group: lang,
      symbolsCount: symbols.length,
      symbols: symbols.slice(0, 10),
      size: Math.max(8, Math.min(30, 8 + Math.sqrt(symbols.length * 5))),
      deps
    };

    nodes.push(node);
    fileMap.set(node.name, node.id);
  });

  // Connect links
  nodes.forEach(sourceNode => {
    sourceNode.deps.forEach(dep => {
      const targetBase = dep.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '');
      for (const [targetName, targetId] of fileMap.entries()) {
        if (targetId !== sourceNode.id && targetName.includes(targetBase)) {
          links.push({
            source: sourceNode.id,
            target: targetId,
            relationship: 'imports'
          });
        }
      }
    });
  });

  return { nodes, links };
}

module.exports = {
  extractSymbols,
  extractDependencies,
  buildRepositoryGraph
};
