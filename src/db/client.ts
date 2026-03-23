import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
// import { mkdirSync } from 'fs';
// import { dirname } from 'path';
import { articles, personaState, xInteractions, xMonitoredAccounts } from './schema.js';
import { logger } from '../utils/logger.js';

// 🐸 Stateless amnesty: we are moving to GitHub Actions, so we don't need a persistent DB.
// Using :memory: ensures zero-latency, zero-timeout, and absolute statelessness.
const dbPath = ':memory:';

// const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? 'dev.db';
// mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, {
  schema: { articles, xInteractions, xMonitoredAccounts, personaState },
});

// We still run migrations on startup to initialize the in-memory schema
migrate(db, { migrationsFolder: './drizzle' });
logger.info('✅ DB initialized in stateless mode (In-Memory)');
