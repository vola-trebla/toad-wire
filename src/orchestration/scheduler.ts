// src/orchestration/scheduler.ts
import cron from 'node-cron';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { runBackup } from '../utils/backup.js';
import { checkFeedHealth, reportFeedHealth } from '../ingestion/feed-health.js';
import { cleanOldMicroPosts } from '../queue/micro-posts.js';
import { logger } from '../utils/logger.js';
import { TIMEZONE } from '../utils/constants.js';
import {
  runMorningDigest,
  runNewsPipeline,
  runMorningBatches,
  runAfternoonBatch,
  runDegenTime,
  runEveningDigest,
  scanForBreaking,
  // dispatchNextMicroPost,
} from './pipelines.js';

export function startScheduler(): void {
  if (process.env.NODE_ENV === 'development') {
    logger.warn('⚠️ Scheduler disabled in development mode. Use debug scripts instead.');
    return;
  }

  // ─── Maintenance ───────────────────────────────────────────────────────────
  cron.schedule('0 2 * * *', () => runBackup(), { timezone: TIMEZONE });

  cron.schedule(
    '0 0 * * 0',
    async () => {
      db.run(sql`DELETE FROM articles WHERE created_at < datetime('now', '-7 days')`);
      logger.info('🗑️ Old articles cleaned up');
      await cleanOldMicroPosts(7);
    },
    { timezone: TIMEZONE },
  );

  // ─── Content Pipeline ──────────────────────────────────────────────────────
  cron.schedule('30 9 * * *', () => void runMorningBatches(), { timezone: TIMEZONE });
  cron.schedule('0 10 * * *', () => void runMorningDigest(), { timezone: TIMEZONE });
  cron.schedule('0 12 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('30 13 * * *', () => void runAfternoonBatch(), { timezone: TIMEZONE });
  cron.schedule('45 13 * * *', () => void runDegenTime(), { timezone: TIMEZONE });
  cron.schedule('0 15 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 18 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 21 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 23 * * *', () => void runEveningDigest(), { timezone: TIMEZONE });

  // ─── Micro-post Dispatcher (currently paused — enable when X is stable) ───
  // cron.schedule('*/20 8-23 * * *', () => void dispatchNextMicroPost(), { timezone: TIMEZONE });

  // ─── Breaking News ─────────────────────────────────────────────────────────
  cron.schedule('*/10 7-23 * * *', () => void scanForBreaking(), { timezone: TIMEZONE });

  // ─── Feed Health ───────────────────────────────────────────────────────────
  cron.schedule('*/30 * * * *', () => void checkFeedHealth(), { timezone: TIMEZONE });
  cron.schedule('0 9 * * 1', () => void reportFeedHealth(), { timezone: TIMEZONE });

  logger.info('📅 Scheduler started');
}
