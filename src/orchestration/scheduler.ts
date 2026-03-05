// src/orchestration/scheduler.ts
import cron from 'node-cron';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { runBackup } from '../utils/backup.js';
import { checkFeedHealth, reportFeedHealth } from '../ingestion/feed-health.js';
import { cleanOldMicroPosts } from '../queue/micro-posts.js';
import { logger } from '../utils/logger.js';
import { TIMEZONE } from '../utils/constants.js';
import { runMorningDigest, runNewsPipeline } from './news-pipeline.js';
import { runMondayBriefing, runWeeklySummary } from './special-pipeline.js';
import { invalidateSnapshotCache } from '../market/market-snapshot.js';
import { pollMentions, pollMonitoredTimelines, searchCryptoLatam } from '../social/x-monitor.js';
import { runMentionReplyPipeline } from '../social/mention-pipeline.js';

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
  cron.schedule('0 7 * * 1', () => void reportFeedHealth(), { timezone: TIMEZONE }); // Monday 7:00 — before briefing

  // ─── Monday Briefing — 9:00 ────────────────────────────────────────────────

  cron.schedule('0 9 * * 1', () => void runMondayBriefing(), { timezone: TIMEZONE });

  // ─── Morning Digest — 08:00 daily ─────────────────────────────────────────
  // Fresh snapshot before posting, then digest + top article

  cron.schedule(
    '0 8 * * *',
    async () => {
      invalidateSnapshotCache();
      await runMorningDigest();
    },
    { timezone: TIMEZONE },
  );

  // ─── Evening News — 19:00 / 20:00 / 21:00 daily ───────────────────────────
  // Fresh snapshot before each slot

  cron.schedule(
    '0 19 * * *',
    async () => {
      invalidateSnapshotCache();
      await runNewsPipeline(1);
    },
    { timezone: TIMEZONE },
  );

  cron.schedule(
    '0 20 * * *',
    async () => {
      invalidateSnapshotCache();
      await runNewsPipeline(1);
    },
    { timezone: TIMEZONE },
  );

  cron.schedule(
    '0 21 * * *',
    async () => {
      invalidateSnapshotCache();
      await runNewsPipeline(1);
    },
    { timezone: TIMEZONE },
  );

  // ─── Weekly Summary — Saturday 21:00 ──────────────────────────────────────
  // Note: overrides evening news slot on Saturday — pipeline runs after summary

  cron.schedule('0 21 * * 6', () => void runWeeklySummary(), { timezone: TIMEZONE });

  // ─── X Monitor — polling 9:00–23:00 ───────────────────────────────────────

  // cron.schedule('*/3 9-23 * * *', () => void pollMentions(), { timezone: TIMEZONE });
  // cron.schedule('0 */2 9-23 * * *', () => void pollMonitoredTimelines(), { timezone: TIMEZONE });
  // cron.schedule('0 */2 9-23 * * *', () => void searchCryptoLatam(), { timezone: TIMEZONE });
  // cron.schedule('0 */4 9-23 * * *', () => void runMentionReplyPipeline(), { timezone: TIMEZONE });

  logger.info('📅 Scheduler started');
}
