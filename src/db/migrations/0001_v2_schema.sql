-- Migration: v2.0 schema extensions
-- Safe: all new columns are nullable, existing data untouched
-- Run once on Railway via: sqlite3 /data/sapo.db < 0001_v2_schema.sql

-- ── articles table: new v2.0 columns ─────────────────────────────────────────
ALTER TABLE articles ADD COLUMN tier INTEGER;
ALTER TABLE articles ADD COLUMN authority REAL;
ALTER TABLE articles ADD COLUMN category TEXT;
ALTER TABLE articles ADD COLUMN sentiment TEXT;
ALTER TABLE articles ADD COLUMN importance_score REAL;
ALTER TABLE articles ADD COLUMN tweet TEXT;
ALTER TABLE articles ADD COLUMN cluster_id TEXT;

-- ── feed_health table (new) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_health (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  source              TEXT NOT NULL UNIQUE,
  url                 TEXT NOT NULL,
  tier                INTEGER NOT NULL,
  authority           REAL NOT NULL,
  enabled             INTEGER DEFAULT 1,
  health_status       TEXT DEFAULT 'healthy',
  consecutive_failures INTEGER DEFAULT 0,
  last_successful_fetch TEXT,
  total_fetches       INTEGER DEFAULT 0,
  total_articles      INTEGER DEFAULT 0,
  updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── pipeline_runs table (new) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  type                  TEXT NOT NULL,
  started_at            TEXT NOT NULL,
  completed_at          TEXT,
  articles_fetched      INTEGER DEFAULT 0,
  articles_filtered     INTEGER DEFAULT 0,
  articles_posted       INTEGER DEFAULT 0,
  micro_posts_generated INTEGER DEFAULT 0,
  flash_rpd_used        INTEGER DEFAULT 0,
  flash_lite_rpd_used   INTEGER DEFAULT 0,
  duration_ms           INTEGER,
  error                 TEXT
);