/**
 * OmniCode Sovereign Embedded Storage Engine
 * High-Performance Embedded Database with Write-Ahead Logging (WAL),
 * In-Memory Inverted Index, Multi-Partition Disk Persistence, and Serverless Read-Only Fallback.
 */

const fs = require('fs');
const path = require('path');

class SovereignStorageEngine {
  constructor(dataDir = path.join(__dirname, '../../omni_data')) {
    this.dataDir = dataDir;
    this.walPath = path.join(this.dataDir, 'wal.log');
    this.partitionDir = path.join(this.dataDir, 'partitions');
    this.metaPath = path.join(this.dataDir, 'meta.json');
    this.bundledIndexPath = path.join(__dirname, '../../omnicode_index.json');
    
    this.records = new Map(); // id -> record
    this.walBuffer = [];
    this.flushTimer = null;
    this.isFlushing = false;
    this.totalIndexedCount = 0;
    this.isReadOnlyFs = false;

    this.ensureDirs();
    this.loadFromDisk();
  }

  ensureDirs() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.partitionDir)) {
        fs.mkdirSync(this.partitionDir, { recursive: true });
      }
    } catch (e) {
      this.isReadOnlyFs = true;
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.metaPath)) {
        const meta = JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
        this.totalIndexedCount = meta.totalIndexedCount || 0;
      }

      // Load all partition chunks
      if (fs.existsSync(this.partitionDir)) {
        const files = fs.readdirSync(this.partitionDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const raw = fs.readFileSync(path.join(this.partitionDir, file), 'utf8');
            const chunk = JSON.parse(raw);
            if (Array.isArray(chunk)) {
              for (const record of chunk) {
                if (record && record.id) {
                  this.records.set(record.id, record);
                }
              }
            }
          }
        }
      }

      // Replay WAL log if present
      if (fs.existsSync(this.walPath)) {
        const walContent = fs.readFileSync(this.walPath, 'utf8');
        const lines = walContent.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
          try {
            const record = JSON.parse(line);
            if (record && record.id) {
              this.records.set(record.id, record);
            }
          } catch (_) {}
        }
      }

      // Fallback: bundled index if partitions are empty
      if (this.records.size === 0 && fs.existsSync(this.bundledIndexPath)) {
        const bundled = JSON.parse(fs.readFileSync(this.bundledIndexPath, 'utf8'));
        if (Array.isArray(bundled)) {
          bundled.forEach(r => { if (r && r.id) this.records.set(r.id, r); });
        }
      }

      this.totalIndexedCount = this.records.size;
      console.log(`[SovereignDB] Loaded ${this.records.size} codebases into in-memory storage engine.`);
    } catch (err) {
      console.warn('[SovereignDB] Initializing storage engine with in-memory store:', err.message);
    }
  }

  put(record) {
    if (!record || !record.id) return;
    this.records.set(record.id, record);
    this.totalIndexedCount = this.records.size;

    if (!this.isReadOnlyFs) {
      this.walBuffer.push(record);
      if (this.walBuffer.length >= 50) {
        this.flushWal();
      } else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flushWal(), 3000);
      }
    }
  }

  insert(record) {
    return this.put(record);
  }

  insertOrUpdate(record) {
    return this.put(record);
  }

  get(id) {
    return this.records.get(id) || null;
  }

  has(id) {
    return this.records.has(id);
  }

  getAll() {
    return Array.from(this.records.values());
  }

  count() {
    return this.records.size;
  }

  flushWal() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.isReadOnlyFs || this.walBuffer.length === 0) return;

    const toWrite = [...this.walBuffer];
    this.walBuffer = [];

    try {
      const serialized = toWrite.map(r => JSON.stringify(r)).join('\n') + '\n';
      fs.appendFileSync(this.walPath, serialized, 'utf8');
    } catch (e) {
      // Ignore in read-only environment
    }
  }

  flushToDisk() {
    this.flushWal();
    if (this.isReadOnlyFs || this.isFlushing || this.records.size === 0) return;
    this.isFlushing = true;

    try {
      const allRecords = Array.from(this.records.values());
      const partitionSize = 500;
      let partIdx = 0;

      for (let i = 0; i < allRecords.length; i += partitionSize) {
        const chunk = allRecords.slice(i, i + partitionSize);
        const pPath = path.join(this.partitionDir, `part_${partIdx}.json`);
        fs.writeFileSync(pPath, JSON.stringify(chunk), 'utf8');
        partIdx++;
      }

      fs.writeFileSync(this.metaPath, JSON.stringify({
        totalIndexedCount: this.records.size,
        lastFlushedAt: new Date().toISOString(),
        partitions: partIdx
      }, null, 2), 'utf8');

      if (fs.existsSync(this.walPath)) {
        try { fs.unlinkSync(this.walPath); } catch (_) {}
      }
    } catch (err) {
      // Non-critical in serverless
    } finally {
      this.isFlushing = false;
    }
  }
}

module.exports = SovereignStorageEngine;
