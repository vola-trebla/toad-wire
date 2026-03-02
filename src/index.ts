// src/index.ts
import 'dotenv/config';
import { initSentry } from './utils/sentry.js';
import { startHealthServer } from './health/server.js';
import { startScheduler } from './orchestration/scheduler.js';
import { restoreFeedHealthFromDB } from './ingestion/feed-health.js';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';
import { logger } from './utils/logger.js';
import { initBreakingCooldown } from './orchestration/state.js';

async function main(): Promise<void> {
  initSentry();
  startHealthServer();
  await restoreFeedHealthFromDB();
  await initBreakingCooldown();
  startScheduler();
  logger.info('🐸 El Sapo Cripto arrancó! Esperando el horario...');
}

main().catch((err) => {
  logger.info('❌ Fatal startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  process.exit(0);
});
