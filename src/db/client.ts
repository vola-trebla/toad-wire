import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { articles } from './schema.js';
import { logger } from '../utils/logger.js';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? 'dev.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema: { articles } });

// Create table if not exists
db.run(sql`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    published_at TEXT NOT NULL,
    posted INTEGER DEFAULT 0,
    embedding TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add embedding column to existing DB if not exists
try {
  db.run(sql`ALTER TABLE articles ADD COLUMN embedding TEXT`);
  logger.info('✅ Added embedding column');
} catch {
  // Column already exists, skip
}
