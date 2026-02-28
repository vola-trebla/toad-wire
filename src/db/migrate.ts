/**
 * DB Migration Runner
 *
 * Runs on every app startup. All operations are idempotent:
 * - ALTER TABLE: wrapped in try/catch (SQLite throws if column exists)
 * - CREATE TABLE: uses IF NOT EXISTS
 *
 * Safe to run multiple times.
 */

import { db } from './client.js';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

async function addColumn(table: string, column: string, type: string): Promise<void> {
  try {
    db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`));
    logger.info(`🗄️ Added column: ${table}.${column}`);
  } catch {
    // Column already exists — skip silently
  }
}

export async function runMigrations(): Promise<void> {
  logger.info('🗄️ Running DB migrations...');

  // articles — v2.0 new columns
  await addColumn('articles', 'tier', 'INTEGER');
  await addColumn('articles', 'authority', 'REAL');
  await addColumn('articles', 'category', 'TEXT');
  await addColumn('articles', 'sentiment', 'TEXT');
  await addColumn('articles', 'importance_score', 'REAL');
  await addColumn('articles', 'tweet', 'TEXT');
  await addColumn('articles', 'cluster_id', 'TEXT');

  // feed_health — new table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS feed_health (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      source                TEXT NOT NULL UNIQUE,
      url                   TEXT NOT NULL,
      tier                  INTEGER NOT NULL,
      authority             REAL NOT NULL,
      enabled               INTEGER DEFAULT 1,
      health_status         TEXT DEFAULT 'healthy',
      consecutive_failures  INTEGER DEFAULT 0,
      last_successful_fetch TEXT,
      total_fetches         INTEGER DEFAULT 0,
      total_articles        INTEGER DEFAULT 0,
      updated_at            TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // pipeline_runs — new table
  db.run(sql`
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
    )
  `);

  logger.info('✅ DB migrations complete');
}
