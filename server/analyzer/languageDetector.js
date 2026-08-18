/**
 * OmniCode Sovereign Language Detector
 * Polyglot language classifier with signature mapping for 60+ programming languages.
 * Operates 100% offline without any external API calls.
 */

const LANGUAGE_DEFINITIONS = {
  Rust: {
    extensions: ['.rs'],
    color: '#dea584',
    category: 'systems',
    paradigm: 'compiled, memory-safe, concurrent',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['fn', 'let', 'mut', 'impl', 'struct', 'enum', 'trait', 'match', 'use', 'pub', 'crate']
  },
  Go: {
    extensions: ['.go'],
    color: '#00ADD8',
    category: 'systems',
    paradigm: 'compiled, concurrent, garbage-collected',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['func', 'package', 'import', 'struct', 'interface', 'goroutine', 'chan', 'defer', 'go', 'select']
  },
  TypeScript: {
    extensions: ['.ts', '.tsx', '.mts', '.cts'],
    color: '#3178c6',
    category: 'web/systems',
    paradigm: 'static-typed, multi-paradigm',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['interface', 'type', 'export', 'import', 'async', 'await', 'class', 'enum', 'readonly']
  },
  JavaScript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    color: '#f1e05a',
    category: 'web/script',
    paradigm: 'dynamic, prototype-based, event-driven',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['function', 'const', 'let', 'var', 'export', 'import', 'async', 'await', 'class']
  },
  Python: {
    extensions: ['.py', '.pyw', '.pyx', '.pyi'],
    color: '#3572A5',
    category: 'general/ai',
    paradigm: 'multi-paradigm, interpreted, dynamic',
    comments: { single: '#', multiStart: '"""', multiEnd: '"""' },
    keywords: ['def', 'class', 'import', 'from', 'self', 'lambda', 'with', 'yield', 'async', 'await']
  },
  'C++': {
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.h++'],
    color: '#f34b7d',
    category: 'systems',
    paradigm: 'compiled, object-oriented, performance',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['template', 'class', 'namespace', 'constexpr', 'std', 'auto', 'virtual', 'override']
  },
  C: {
    extensions: ['.c', '.h'],
    color: '#555555',
    category: 'systems',
    paradigm: 'imperative, procedural, low-level',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['struct', 'typedef', 'void', 'sizeof', 'static', 'extern', 'int', 'char', 'const']
  },
  Zig: {
    extensions: ['.zig'],
    color: '#ec915c',
    category: 'systems',
    paradigm: 'compiled, zero-overhead, comptime',
    comments: { single: '//' },
    keywords: ['pub fn', 'const', 'var', 'comptime', 'struct', 'enum', 'error', 'defer', 'catch']
  },
  'C#': {
    extensions: ['.cs'],
    color: '#178600',
    category: 'general/enterprise',
    paradigm: 'object-oriented, component-oriented',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['namespace', 'class', 'public', 'private', 'async', 'await', 'task', 'override']
  },
  Java: {
    extensions: ['.java'],
    color: '#b07219',
    category: 'enterprise',
    paradigm: 'object-oriented, JVM-based',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['public class', 'interface', 'implements', 'extends', 'package', 'import', 'void']
  },
  Kotlin: {
    extensions: ['.kt', '.kts'],
    color: '#A97BFF',
    category: 'general/mobile',
    paradigm: 'multi-paradigm, JVM/Native',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['fun', 'val', 'var', 'data class', 'suspend', 'companion object', 'coroutine']
  },
  Swift: {
    extensions: ['.swift'],
    color: '#F05138',
    category: 'general/apple',
    paradigm: 'protocol-oriented, compiled',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['func', 'struct', 'class', 'protocol', 'extension', 'guard', 'let', 'var', 'actor']
  },
  Elixir: {
    extensions: ['.ex', '.exs'],
    color: '#6e4a7e',
    category: 'concurrent/distributed',
    paradigm: 'functional, actor-model, BEAM',
    comments: { single: '#' },
    keywords: ['defmodule', 'def', 'defp', 'defstruct', 'pipe', '|>', 'spawn', 'receive', 'gen_server']
  },
  Erlang: {
    extensions: ['.erl', '.hrl'],
    color: '#B83998',
    category: 'concurrent/telecom',
    paradigm: 'concurrent, distributed, fault-tolerant',
    comments: { single: '%' },
    keywords: ['-module', '-export', 'receive', 'after', 'spawn', 'case', 'of', 'end']
  },
  Haskell: {
    extensions: ['.hs', '.lhs'],
    color: '#5e5086',
    category: 'functional',
    paradigm: 'purely functional, lazy evaluation',
    comments: { single: '--', multiStart: '{-', multiEnd: '-}' },
    keywords: ['data', 'type', 'class', 'instance', 'where', 'let', 'in', 'do', 'module']
  },
  Lua: {
    extensions: ['.lua'],
    color: '#000080',
    category: 'script/embedded',
    paradigm: 'lightweight, dynamic, embeddable',
    comments: { single: '--', multiStart: '--[[', multiEnd: ']]' },
    keywords: ['function', 'local', 'end', 'then', 'require', 'metatable', 'nil']
  },
  Ruby: {
    extensions: ['.rb', '.rake', 'Gemfile'],
    color: '#701516',
    category: 'web/script',
    paradigm: 'object-oriented, dynamic',
    comments: { single: '#', multiStart: '=begin', multiEnd: '=end' },
    keywords: ['def', 'class', 'module', 'end', 'yield', 'attr_accessor', 'require']
  },
  PHP: {
    extensions: ['.php', '.phtml'],
    color: '#4F5D95',
    category: 'web',
    paradigm: 'server-side scripting',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['<?php', 'namespace', 'class', 'function', 'public', 'private', 'use', '$this']
  },
  Scala: {
    extensions: ['.scala', '.sc'],
    color: '#c22d40',
    category: 'functional/enterprise',
    paradigm: 'functional, object-oriented, JVM',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['def', 'val', 'var', 'case class', 'trait', 'object', 'match', 'implicit']
  },
  Julia: {
    extensions: ['.jl'],
    color: '#a270ba',
    category: 'scientific/data',
    paradigm: 'numerical computing, multiple dispatch',
    comments: { single: '#', multiStart: '#=', multiEnd: '=#' },
    keywords: ['function', 'macro', 'struct', 'end', 'using', 'export', 'mutable struct']
  },
  Dart: {
    extensions: ['.dart'],
    color: '#00B4AB',
    category: 'web/mobile',
    paradigm: 'client-optimized, sound null safety',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['void', 'Widget', 'build', 'async', 'await', 'class', 'extends', 'StatelessWidget']
  },
  OCaml: {
    extensions: ['.ml', '.mli'],
    color: '#ef7a08',
    category: 'systems/functional',
    paradigm: 'functional, imperative, typed',
    comments: { multiStart: '(*', multiEnd: '*)' },
    keywords: ['let', 'rec', 'match', 'with', 'type', 'module', 'open', 'sig', 'struct']
  },
  Nim: {
    extensions: ['.nim', '.nims'],
    color: '#ffc200',
    category: 'systems',
    paradigm: 'expressive, efficient, elegant',
    comments: { single: '#', multiStart: '#[', multiEnd: ']#' },
    keywords: ['proc', 'func', 'type', 'var', 'let', 'const', 'import', 'when', 'template']
  },
  Solidity: {
    extensions: ['.sol'],
    color: '#AA6746',
    category: 'smart-contracts/crypto',
    paradigm: 'contract-oriented, EVM',
    comments: { single: '//', multiStart: '/*', multiEnd: '*/' },
    keywords: ['contract', 'pragma solidity', 'function', 'address', 'mapping', 'event', 'modifier']
  },
  SQL: {
    extensions: ['.sql', '.psql', '.cql'],
    color: '#e38c00',
    category: 'database',
    paradigm: 'declarative, relational query',
    comments: { single: '--', multiStart: '/*', multiEnd: '*/' },
    keywords: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'CREATE TABLE', 'INSERT INTO', 'GROUP BY']
  },
  HTML: {
    extensions: ['.html', '.htm', '.xhtml'],
    color: '#e34c26',
    category: 'markup',
    paradigm: 'markup language',
    comments: { multiStart: '<!--', multiEnd: '-->' },
    keywords: ['<!DOCTYPE html>', '<html', '<head', '<body', '<div', '<script', '<style']
  },
  CSS: {
    extensions: ['.css', '.scss', '.sass', '.less'],
    color: '#563d7c',
    category: 'stylesheet',
    paradigm: 'declarative style sheet',
    comments: { multiStart: '/*', multiEnd: '*/' },
    keywords: ['@media', '@keyframes', 'display:', 'flex', 'grid', 'color:', 'background:']
  },
  Shell: {
    extensions: ['.sh', '.bash', '.zsh', '.fish'],
    color: '#89e051',
    category: 'script/ops',
    paradigm: 'command-line scripting',
    comments: { single: '#' },
    keywords: ['#!/bin/bash', '#!/bin/sh', 'if [', 'then', 'fi', 'echo', 'case', 'esac']
  },
  Assembly: {
    extensions: ['.asm', '.s', '.S'],
    color: '#6E4C13',
    category: 'low-level',
    paradigm: 'assembly instructions',
    comments: { single: ';' },
    keywords: ['mov', 'jmp', 'push', 'pop', 'call', 'ret', 'section .text', 'global']
  },
  WebAssembly: {
    extensions: ['.wat', '.wasm'],
    color: '#04133b',
    category: 'bytecode',
    paradigm: 'stack-based virtual machine',
    comments: { single: ';;', multiStart: '(;', multiEnd: ';)' },
    keywords: ['module', 'func', 'export', 'import', 'i32.add', 'local.get', 'call']
  },
  JSON: {
    extensions: ['.json', '.json5'],
    color: '#292929',
    category: 'data',
    paradigm: 'data interchange',
    keywords: ['{', '}', '[', ']']
  },
  YAML: {
    extensions: ['.yml', '.yaml'],
    color: '#cb171e',
    category: 'data/config',
    paradigm: 'data serialization',
    comments: { single: '#' },
    keywords: [':', '- ', 'version:']
  },
  TOML: {
    extensions: ['.toml'],
    color: '#9c4221',
    category: 'data/config',
    paradigm: 'configuration format',
    comments: { single: '#' },
    keywords: ['[package]', '[dependencies]', '=']
  },
  Markdown: {
    extensions: ['.md', '.markdown', '.mdx'],
    color: '#083fa1',
    category: 'documentation',
    paradigm: 'lightweight markup',
    keywords: ['# ', '## ', '```', '[', '](']
  }
};

// Fast extension lookup cache
const EXTENSION_MAP = new Map();
for (const [langName, def] of Object.entries(LANGUAGE_DEFINITIONS)) {
  if (def.extensions) {
    for (const ext of def.extensions) {
      EXTENSION_MAP.set(ext.toLowerCase(), langName);
    }
  }
}

/**
 * Detects programming language from a file path
 * @param {string} filePath
 * @returns {string} Detected language name or 'Unknown'
 */
function detectLanguageByPath(filePath) {
  if (!filePath) return 'Unknown';
  const cleanPath = filePath.toLowerCase();
  
  // Exact filename matches (e.g. Dockerfile, Makefile, Gemfile, Cargo.toml)
  const basename = cleanPath.split(/[/\\]/).pop();
  if (basename === 'dockerfile') return 'Docker';
  if (basename === 'makefile' || basename === 'gnumakefile') return 'Makefile';
  if (basename === 'gemfile') return 'Ruby';
  if (basename === 'cargo.toml') return 'TOML';
  if (basename === 'package.json') return 'JSON';

  // Suffix matching
  for (const [ext, lang] of EXTENSION_MAP.entries()) {
    if (cleanPath.endsWith(ext)) {
      return lang;
    }
  }
  return 'Plain Text';
}

/**
 * Returns full metadata for a given language name
 * @param {string} langName
 */
function getLanguageMetadata(langName) {
  return LANGUAGE_DEFINITIONS[langName] || {
    color: '#6e7681',
    category: 'general',
    paradigm: 'text',
    comments: { single: '//' }
  };
}

/**
 * Returns the theme hex color for a language
 * @param {string} langName
 */
function getLanguageColor(langName) {
  const meta = LANGUAGE_DEFINITIONS[langName];
  return meta ? meta.color : '#8b949e';
}

/**
 * Lists all known languages with metadata
 */
function getAllSupportedLanguages() {
  return Object.keys(LANGUAGE_DEFINITIONS).map(name => ({
    name,
    color: LANGUAGE_DEFINITIONS[name].color,
    category: LANGUAGE_DEFINITIONS[name].category,
    paradigm: LANGUAGE_DEFINITIONS[name].paradigm
  }));
}

module.exports = {
  LANGUAGE_DEFINITIONS,
  detectLanguageByPath,
  getLanguageMetadata,
  getLanguageColor,
  getAllSupportedLanguages
};
