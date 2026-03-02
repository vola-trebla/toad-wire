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
  // runDegenTime,
  runEveningDigest,
  scanForBreaking,
  runMondayBriefing,
  runWeeklySummary,
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
      await cleanOldMicroPosts(90);
    },
    { timezone: TIMEZONE },
  );

  // ─── Feed Health ───────────────────────────────────────────────────────────

  cron.schedule('*/30 * * * *', () => void checkFeedHealth(), { timezone: TIMEZONE });
  cron.schedule('0 8 * * 1', () => void reportFeedHealth(), { timezone: TIMEZONE }); // Monday 8:00 — before briefing

  // ─── Monday Briefing — 9:00 ────────────────────────────────────────────────

  cron.schedule('0 9 * * 1', () => void runMondayBriefing(), { timezone: TIMEZONE });

  // ─── Morning — 9:30 (Tue–Sun) / 9:45 (Mon) / 10:00 ───────────────────────
  // Mon batches delayed to 9:45 to avoid overlap with Monday Briefing (9:00, uses Gemini Pro)

  cron.schedule('30 9 * * 2-7', () => void runMorningBatches(), { timezone: TIMEZONE }); // Tue–Sun 9:30
  cron.schedule('45 9 * * 1', () => void runMorningBatches(), { timezone: TIMEZONE }); // Mon 9:45
  cron.schedule('0 10 * * 2-7', () => void runMorningDigest(), { timezone: TIMEZONE }); // Tue–Sun (Mon has briefing)

  // ─── Late Morning — 11:00 Tue–Sun ─────────────────────────────────────────
  // Closes 3h gap between morning digest (10:00) and midday news (13:00)

  cron.schedule('0 11 * * 2-7', () => void runNewsPipeline(1), { timezone: TIMEZONE });

  // ─── Midday — 13:00 ────────────────────────────────────────────────────────

  cron.schedule('0 13 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('30 13 * * *', () => void runAfternoonBatch(), { timezone: TIMEZONE });
  // cron.schedule('45 13 * * *', () => void runDegenTime(), { timezone: TIMEZONE });

  // ─── Weekend Afternoon — 15:00 Sat–Sun ────────────────────────────────────
  // Closes 3.5h gap between afternoon batch (13:30) and prime time (17:00)

  cron.schedule('0 15 * * 6,0', () => void runNewsPipeline(1), { timezone: TIMEZONE });

  // ─── Prime Time Weekdays — 18:00 / 20:00 / 22:00 ──────────────────────────

  cron.schedule('0 18 * * 1-5', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 20 * * 1-5', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 22 * * 1-5', () => void runNewsPipeline(1), { timezone: TIMEZONE });

  // ─── Prime Time Weekend — 17:00 / 19:00 / 21:00 / 23:00 ───────────────────

  cron.schedule('0 17 * * 6,0', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 19 * * 6,0', () => void runNewsPipeline(1), { timezone: TIMEZONE });
  cron.schedule('0 21 * * 0', () => void runNewsPipeline(1), { timezone: TIMEZONE }); // Sunday only — Saturday has weekly summary
  cron.schedule('0 23 * * 6,0', () => void runNewsPipeline(1), { timezone: TIMEZONE });

  // ─── Evening Digest — 22:30 / 23:30 ───────────────────────────────────────

  cron.schedule('30 22 * * 1-5', () => void runEveningDigest(), { timezone: TIMEZONE }); // weekdays
  cron.schedule('30 23 * * 6,0', () => void runEveningDigest(), { timezone: TIMEZONE }); // weekend

  // ─── Weekly Summary — Saturday 21:00 ──────────────────────────────────────

  cron.schedule('0 21 * * 6', () => void runWeeklySummary(), { timezone: TIMEZONE });

  // ─── Breaking News — every 10 min, 7:00–23:00 ─────────────────────────────
  // Threshold: 1.30 | Cooldown: 2h between posts

  cron.schedule('*/10 7-23 * * *', () => void scanForBreaking(), { timezone: TIMEZONE });

  // ─── Micro-post Dispatcher (paused) ───────────────────────────────────────
  // cron.schedule('*/20 8-23 * * *', () => void dispatchNextMicroPost(), { timezone: TIMEZONE });

  logger.info('📅 Scheduler started');
}
