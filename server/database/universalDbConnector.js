/**
 * OmniCode Universal Cloud Database Connector
 * Connects seamlessly to free cloud databases (Neon, Supabase, Render, Railway, PostgreSQL).
 * Auto-creates schema, synchronizes repositories, and enables persistent public storage.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class UniversalDbConnector {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionUrl = process.env.DATABASE_URL || null;
    this.providerName = 'Local Sovereign WAL Engine';
    this.syncedCount = 0;
    this.lastError = null;

    if (this.connectionUrl) {
      this.connect(this.connectionUrl).catch(err => {
        console.warn('[CloudDB] Auto-connection from env failed:', err.message);
      });
    }
  }

  async connect(databaseUrl) {
    if (!databaseUrl || typeof databaseUrl !== 'string') {
      throw new Error('Database URL is required');
    }

    const trimmedUrl = databaseUrl.trim();
    this.lastError = null;

    try {
      // Determine Provider
      if (trimmedUrl.includes('neon.tech')) {
        this.providerName = 'Neon Serverless Postgres';
      } else if (trimmedUrl.includes('supabase.co') || trimmedUrl.includes('supabase.com')) {
        this.providerName = 'Supabase PostgreSQL';
      } else if (trimmedUrl.includes('render.com')) {
        this.providerName = 'Render PostgreSQL';
      } else if (trimmedUrl.includes('railway')) {
        this.providerName = 'Railway PostgreSQL';
      } else if (trimmedUrl.includes('aivencloud.com')) {
        this.providerName = 'Aiven Cloud PostgreSQL';
      } else {
        this.providerName = 'Cloud PostgreSQL Database';
      }

      // Close previous pool if exists
      if (this.pool) {
        await this.pool.end().catch(() => {});
      }

      // Initialize Postgres Pool with SSL
      this.pool = new Pool({
        connectionString: trimmedUrl,
        ssl: trimmedUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      // Test connection & initialize schema
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS omnicode_repositories (
            id VARCHAR(120) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            full_name VARCHAR(250) NOT NULL,
            git_url TEXT NOT NULL,
            primary_language VARCHAR(80),
            domain VARCHAR(100),
            license VARCHAR(60),
            stars BIGINT DEFAULT 0,
            forks BIGINT DEFAULT 0,
            total_sloc BIGINT DEFAULT 0,
            health_score INTEGER DEFAULT 95,
            raw_payload JSONB,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_omni_lang ON omnicode_repositories (primary_language);
          CREATE INDEX IF NOT EXISTS idx_omni_stars ON omnicode_repositories (stars DESC);
        `);
      } finally {
        client.release();
      }

      this.isConnected = true;
      this.connectionUrl = trimmedUrl;

      // Save to local .env if available
      try {
        const envPath = path.join(__dirname, '../../.env');
        fs.writeFileSync(envPath, `DATABASE_URL="${trimmedUrl}"\n`, 'utf8');
      } catch (e) {
        // Non-critical
      }

      console.log(`[CloudDB] Successfully connected to ${this.providerName}! Schema initialized.`);
      return {
        success: true,
        provider: this.providerName,
        message: `Connected successfully to ${this.providerName}`
      };
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      console.error('[CloudDB] Connection failed:', err.message);
      throw err;
    }
  }

  async syncRepositories(repositories) {
    if (!this.isConnected || !this.pool || !Array.isArray(repositories) || repositories.length === 0) {
      return { synced: 0 };
    }

    let successCount = 0;
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO omnicode_repositories (
          id, name, full_name, git_url, primary_language, domain, license, stars, forks, total_sloc, health_score, raw_payload, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks,
          total_sloc = EXCLUDED.total_sloc,
          health_score = EXCLUDED.health_score,
          raw_payload = EXCLUDED.raw_payload,
          updated_at = CURRENT_TIMESTAMP
      `;

      for (const repo of repositories) {
        try {
          await client.query(queryText, [
            repo.id,
            repo.name || 'unknown',
            repo.fullName || repo.name || 'unknown',
            repo.gitUrl || `https://github.com/${repo.fullName}.git`,
            repo.primaryLanguage || 'Other',
            repo.domain || 'Systems',
            repo.license || 'MIT',
            repo.stars || 0,
            repo.forks || 0,
            repo.totalSLOC || 0,
            repo.healthScore || 95,
            JSON.stringify(repo)
          ]);
          successCount++;
        } catch (e) {
          // Continue with next repo
        }
      }

      await client.query('COMMIT');
      this.syncedCount += successCount;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[CloudDB] Batch sync transaction failed:', err.message);
    } finally {
      client.release();
    }

    return { synced: successCount };
  }

  async insertRepository(repo) {
    if (!this.isConnected || !this.pool || !repo || !repo.id) return false;
    try {
      const client = await this.pool.connect();
      try {
        const queryText = `
          INSERT INTO omnicode_repositories (
            id, name, full_name, git_url, primary_language, domain, license, stars, forks, total_sloc, health_score, raw_payload, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            stars = EXCLUDED.stars,
            forks = EXCLUDED.forks,
            total_sloc = EXCLUDED.total_sloc,
            health_score = EXCLUDED.health_score,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = CURRENT_TIMESTAMP
        `;
        await client.query(queryText, [
          repo.id,
          repo.name || 'unknown',
          repo.fullName || repo.name || 'unknown',
          repo.gitUrl || `https://github.com/${repo.fullName}.git`,
          repo.primaryLanguage || 'Other',
          repo.domain || 'Systems',
          repo.license || 'MIT',
          repo.stars || 0,
          repo.forks || 0,
          repo.totalSLOC || 0,
          repo.healthScore || 95,
          JSON.stringify(repo)
        ]);
        this.syncedCount++;
        return true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[CloudDB] Single repo insert note:', err.message);
      return false;
    }
  }

  async fetchAllRepositories(limit = 10000) {
    if (!this.isConnected || !this.pool) return [];
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT raw_payload FROM omnicode_repositories
          ORDER BY stars DESC
          LIMIT $1
        `, [limit]);
        return result.rows.map(row => {
          if (typeof row.raw_payload === 'string') {
            try { return JSON.parse(row.raw_payload); } catch (_) { return null; }
          }
          return row.raw_payload;
        }).filter(Boolean);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[CloudDB] Failed to fetch repositories from Cloud DB:', err.message);
      return [];
    }
  }

  async countRepositories() {
    if (!this.isConnected || !this.pool) return 0;
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT COUNT(*) as cnt FROM omnicode_repositories');
        return parseInt(result.rows[0]?.cnt, 10) || 0;
      } finally {
        client.release();
      }
    } catch (e) {
      return 0;
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      provider: this.providerName,
      connectionUrlMasked: this.connectionUrl ? this.connectionUrl.replace(/:([^@]+)@/, ':****@') : null,
      syncedCount: this.syncedCount,
      lastError: this.lastError
    };
  }
}

module.exports = new UniversalDbConnector();
