import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { articles, personaState, xInteractions, xMonitoredAccounts } from './schema.js';
import { logger } from '../utils/logger.js';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? 'dev.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, {
  schema: { articles, xInteractions, xMonitoredAccounts, personaState },
});

migrate(db, { migrationsFolder: './drizzle' });
logger.info('✅ DB migrations applied');
