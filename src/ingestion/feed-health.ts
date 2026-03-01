/**
 * Feed Health Monitor
 *
 * Tracks RSS source availability and persists state to feed_health table.
 * Sends Telegram alert when a source goes dead (10+ consecutive failures).
 * Generates weekly health report every Monday 09:00.
 */

import { db } from '../db/client.js';
import { feedHealth } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { FEEDS, type FeedConfig } from './feeds.config.js';
import { sendToTelegram } from '../delivery/telegram.js';
import { logger } from '../utils/logger.js';

const DEAD_THRESHOLD = 10;
const DEGRADED_THRESHOLD = 3;

// ─── DB sync ─────────────────────────────────────────────────────────────────

/**
 * Upserts feed health state from in-memory FeedConfig to DB.
 * Called after each fetchFeeds() cycle.
 */
export async function syncFeedHealthToDB(feed: FeedConfig): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(feedHealth)
      .where(eq(feedHealth.source, feed.source))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(feedHealth).values({
        source: feed.source,
        url: feed.url,
        tier: feed.tier,
        authority: feed.authority,
        enabled: feed.enabled,
        healthStatus: feed.healthStatus,
        consecutiveFailures: feed.consecutiveFailures,
        lastSuccessfulFetch: feed.lastSuccessfulFetch ?? null,
        totalFetches: 1,
        totalArticles: 0,
      });
    } else {
      await db
        .update(feedHealth)
        .set({
          healthStatus: feed.healthStatus,
          consecutiveFailures: feed.consecutiveFailures,
          lastSuccessfulFetch: feed.lastSuccessfulFetch ?? null,
          enabled: feed.enabled,
          totalFetches: (existing[0]!.totalFetches ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(feedHealth.source, feed.source));
    }
  } catch (error) {
    logger.error(`❌ Failed to sync feed health for ${feed.source}: ${error}`);
  }
}

// ─── Health check cron ────────────────────────────────────────────────────────

/**
 * Lightweight health check: HEAD request to each active feed.
 * Updates in-memory FeedConfig state + syncs to DB.
 * Sends Telegram alert if source transitions to 'dead'.
 *
 * Called by cron every 30 min.
 */
export async function checkFeedHealth(): Promise<void> {
  logger.info('🏥 Running feed health check...');

  for (const feed of FEEDS.filter((f) => f.enabled)) {
    const wasDeadBefore = feed.healthStatus === 'dead';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(feed.url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);

      feed.consecutiveFailures = 0;
      feed.healthStatus = 'healthy';
      feed.lastSuccessfulFetch = new Date().toISOString();
    } catch {
      feed.consecutiveFailures++;

      if (feed.consecutiveFailures >= DEAD_THRESHOLD) {
        feed.healthStatus = 'dead';

        // Alert only on transition to dead (not every check)
        if (!wasDeadBefore) {
          const msg =
            `⚠️ *Feed muerto*\n\n` +
            `Fuente: *${feed.source}*\n` +
            `Tier: ${feed.tier} | Authority: ${feed.authority}\n` +
            `Fallos consecutivos: ${feed.consecutiveFailures}\n` +
            `URL: ${feed.url}`;
          await sendToTelegram(msg).catch(() => {});
          logger.warn(`🚨 Feed ${feed.source} is DEAD — Telegram alert sent`);
        }
      } else if (feed.consecutiveFailures >= DEGRADED_THRESHOLD) {
        feed.healthStatus = 'degraded';
        logger.warn(`⚠️ Feed ${feed.source} degraded (${feed.consecutiveFailures} failures)`);
      }
    }

    await syncFeedHealthToDB(feed);
  }

  const dead = FEEDS.filter((f) => f.healthStatus === 'dead').map((f) => f.source);
  const degraded = FEEDS.filter((f) => f.healthStatus === 'degraded').map((f) => f.source);
  logger.info(
    `🏥 Health check done — dead: [${dead.join(', ') || 'none'}], degraded: [${degraded.join(', ') || 'none'}]`,
  );
}

// ─── Weekly report cron ───────────────────────────────────────────────────────

/**
 * Sends a weekly feed health summary to Telegram.
 * Called by cron every Monday 09:00.
 */
export async function reportFeedHealth(): Promise<void> {
  logger.info('📊 Generating weekly feed health report...');

  const healthy = FEEDS.filter((f) => f.enabled && f.healthStatus === 'healthy');
  const degraded = FEEDS.filter((f) => f.enabled && f.healthStatus === 'degraded');
  const dead = FEEDS.filter((f) => f.enabled && f.healthStatus === 'dead');

  const lines: string[] = [
    `📊 *Reporte Semanal — Fuentes RSS*\n`,
    `✅ Saludables: ${healthy.length}`,
    `⚠️ Degradadas: ${degraded.length}${degraded.length > 0 ? ` (${degraded.map((f) => f.source).join(', ')})` : ''}`,
    `💀 Muertas: ${dead.length}${dead.length > 0 ? ` (${dead.map((f) => f.source).join(', ')})` : ''}`,
    `\nTotal activas: ${FEEDS.filter((f) => f.enabled).length} / ${FEEDS.length}`,
  ];

  await sendToTelegram(lines.join('\n'));
  logger.info('📊 Weekly feed health report sent');
}
