/**
 * OmniCode Sovereign Metric Analyzer
 * Evaluates SLOC, Comment Density, Cyclomatic Complexity, License & Domain Classification.
 */

const { detectLanguageByPath, getLanguageMetadata } = require('./languageDetector');

// Common SPDX License Signatures
const LICENSE_PATTERNS = [
  { name: 'MIT', regex: /(permission is hereby granted, free of charge|MIT License|MIT\s+license)/i },
  { name: 'Apache-2.0', regex: /(Apache License,\s+Version 2\.0|http:\/\/www\.apache\.org\/licenses\/LICENSE-2\.0)/i },
  { name: 'GPL-3.0', regex: /(GNU General Public License|GPLv3|version 3 of the License)/i },
  { name: 'GPL-2.0', regex: /(GNU General Public License, version 2|GPLv2)/i },
  { name: 'BSD-3-Clause', regex: /(Redistribution and use in source and binary forms|BSD 3-Clause)/i },
  { name: 'BSD-2-Clause', regex: /(BSD 2-Clause|Simplified BSD License)/i },
  { name: 'MPL-2.0', regex: /(Mozilla Public License, v\. 2\.0|MPL-2\.0)/i },
  { name: 'Unlicense', regex: /(This is free and unencumbered software released into the public domain|unlicense\.org)/i },
  { name: 'AGPL-3.0', regex: /(GNU Affero General Public License|AGPLv3)/i },
  { name: 'ISC', regex: /(Permission to use, copy, modify, and\/or distribute this software for any purpose|ISC License)/i }
];

// Project Category Detection Keywords
const DOMAIN_TAXONOMY = [
  { category: 'Compilers & Languages', keywords: ['compiler', 'ast', 'lexer', 'parser', 'transpiler', 'bytecode', 'vm', 'interpreter', 'llvm', 'codegen'] },
  { category: 'Kernels & Systems', keywords: ['kernel', 'operating system', 'driver', 'posix', 'scheduler', 'memory management', 'bootloader', 'syscall', 'embedded'] },
  { category: 'AI & Machine Learning', keywords: ['neural network', 'deep learning', 'transformer', 'llm', 'tensor', 'pytorch', 'tensorflow', 'model', 'inference', 'embedding'] },
  { category: 'Databases & Storage', keywords: ['database', 'kv store', 'b-tree', 'lsm-tree', 'sql', 'query engine', 'storage engine', 'distributed database', 'redis', 'sqlite'] },
  { category: 'Web Frameworks & Runtimes', keywords: ['http', 'web framework', 'router', 'middleware', 'runtime', 'ssr', 'react', 'vue', 'fastify', 'express', 'deno', 'bun'] },
  { category: 'Distributed Systems & Cloud', keywords: ['distributed', 'raft', 'paxos', 'consensus', 'grpc', 'microservices', 'kubernetes', 'orchestration', 'cluster', 'load balancer'] },
  { category: 'Game Engines & Graphics', keywords: ['game engine', 'graphics', 'vulkan', 'opengl', 'directx', 'shader', 'renderer', 'physics', 'godot', '3d', 'raytracing'] },
  { category: 'Cryptography & Security', keywords: ['crypto', 'cipher', 'hash', 'signature', 'tls', 'encryption', 'zero-knowledge', 'blockchain', 'auth', 'security'] },
  { category: 'Developer Tools & CLI', keywords: ['cli', 'terminal', 'linter', 'formatter', 'debugger', 'profiler', 'git', 'editor', 'neovim', 'shell'] },
  { category: 'Networking & Protocols', keywords: ['tcp', 'udp', 'quic', 'websocket', 'dns', 'packet', 'proxy', 'reverse proxy', 'network'] }
];

/**
 * Analyzes code content for lines, comments, and cyclomatic complexity
 * @param {string} content
 * @param {string} filePath
 */
function analyzeCodeMetrics(content, filePath) {
  if (typeof content !== 'string') {
    return { totalLines: 0, codeLines: 0, commentLines: 0, blankLines: 0, complexity: 1 };
  }

  const lang = detectLanguageByPath(filePath);
  const langMeta = getLanguageMetadata(lang);
  const lines = content.split(/\r?\n/);
  
  let blankLines = 0;
  let commentLines = 0;
  let codeLines = 0;
  let inMultiComment = false;
  let branchCount = 0;

  const singleComment = langMeta.comments?.single;
  const multiStart = langMeta.comments?.multiStart;
  const multiEnd = langMeta.comments?.multiEnd;

  // Regex for cyclomatic decision points
  const branchRegex = /\b(if|else\s+if|elif|case|match|switch|for|while|catch|except|&&|\|\||\?)\b/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      blankLines++;
      continue;
    }

    if (inMultiComment) {
      commentLines++;
      if (multiEnd && line.includes(multiEnd)) {
        inMultiComment = false;
      }
      continue;
    }

    if (multiStart && line.startsWith(multiStart)) {
      commentLines++;
      if (!multiEnd || !line.includes(multiEnd, multiStart.length)) {
        inMultiComment = true;
      }
      continue;
    }

    if (singleComment && line.startsWith(singleComment)) {
      commentLines++;
      continue;
    }

    codeLines++;

    // Calculate branches for complexity
    const matches = line.match(branchRegex);
    if (matches) {
      branchCount += matches.length;
    }
  }

  // Cyclomatic complexity = 1 + decision points
  const complexity = 1 + branchCount;

  return {
    language: lang,
    totalLines: lines.length,
    codeLines,
    commentLines,
    blankLines,
    complexity,
    commentRatio: lines.length > 0 ? ((commentLines / lines.length) * 100).toFixed(1) : '0.0'
  };
}

/**
 * Detects license from file contents or text (e.g. LICENSE, README, source headers)
 * @param {string} licenseContent
 * @returns {string} SPDX License Identifier or 'Custom / Proprietary'
 */
function detectLicense(licenseContent) {
  if (!licenseContent) return 'Unknown';
  for (const { name, regex } of LICENSE_PATTERNS) {
    if (regex.test(licenseContent)) {
      return name;
    }
  }
  return 'Custom / Other';
}

/**
 * Automatically categorizes repository into technical domain based on description, tags, and files
 * @param {string} name
 * @param {string} description
 * @param {string[]} topics
 * @param {string[]} filePaths
 * @returns {string} Domain Category
 */
function classifyDomain(name = '', description = '', topics = [], filePaths = []) {
  const combinedText = `${name} ${description} ${topics.join(' ')} ${filePaths.join(' ')}`.toLowerCase();
  
  let bestCategory = 'General Systems & Utilities';
  let highestScore = 0;

  for (const domain of DOMAIN_TAXONOMY) {
    let score = 0;
    for (const kw of domain.keywords) {
      if (combinedText.includes(kw.toLowerCase())) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCategory = domain.category;
    }
  }

  return bestCategory;
}

/**
 * Computes health score from test coverage presence, documentation, license, and maintainability
 */
function calculateRepoHealth(metrics) {
  let score = 70; // baseline
  if (metrics.license && metrics.license !== 'Unknown') score += 10;
  if (metrics.hasReadme) score += 10;
  if (metrics.hasTests) score += 10;
  if (metrics.commentRatio && parseFloat(metrics.commentRatio) > 10) score += 5;
  if (metrics.complexityPerFile && metrics.complexityPerFile < 25) score += 5;
  return Math.min(100, score);
}

module.exports = {
  analyzeCodeMetrics,
  detectLicense,
  classifyDomain,
  calculateRepoHealth
};
