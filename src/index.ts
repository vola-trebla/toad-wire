import 'dotenv/config';
import { initSentry } from './utils/sentry.js';
import { startHealthServer } from './health/server.js';
import { startScheduler } from './orchestration/scheduler.js';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';
import { logger } from './utils/logger.js';

initSentry();
startHealthServer();
startScheduler();

logger.info('🐸 El Sapo Cripto arrancó! Esperando el horario...');

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  process.exit(0);
});
