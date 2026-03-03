// src/social/mention-pipeline.ts
import { db } from '../db/client.js';
import { xInteractions } from '../db/schema.js';
import { logger } from '../utils/logger.js';
import { pollMentions } from './x-monitor.js';
import { generateReply } from './x-responder.js';
import { replyToTweet } from '../delivery/publisher.js';
import { eq, sql, and } from 'drizzle-orm';
import { xBudgetState } from '../orchestration/state.js';
import { canTweet, recordTweet } from '../delivery/x-rate-limiter.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markSkipped(tweetId: string, reason: string): Promise<void> {
  await db
    .update(xInteractions)
    .set({ skipped: true, skipReason: reason })
    .where(eq(xInteractions.tweetId, tweetId));
}

async function recordReply(tweetId: string, replyId: string, replyText: string): Promise<void> {
  await db
    .update(xInteractions)
    .set({
      replyId,
      replyText,
      repliedAt: new Date().toISOString(),
    })
    .where(eq(xInteractions.tweetId, tweetId));
}

// ─── Mention Reply Pipeline ───────────────────────────────────────────────────

export async function runMentionReplyPipeline(): Promise<void> {
  const dryRun = process.env.X_REPLY_DRY_RUN === 'true';

  try {
    await pollMentions();

    // Fetch unprocessed mentions (no reply, not skipped)
    const pending = await db
      .select()
      .from(xInteractions)
      .where(
        and(
          eq(xInteractions.type, 'mention'),
          eq(xInteractions.skipped, false),
          sql`${xInteractions.replyId} IS NULL`,
        ),
      )
      .orderBy(xInteractions.createdAt)
      .limit(5);

    if (pending.length === 0) return;

    logger.info(`📬 Processing ${pending.length} pending mentions`);

    for (const mention of pending) {
      // Check reply budget
      const budgetCheck = canTweet(xBudgetState);
      if (!budgetCheck.allowed) {
        logger.debug(`⏸️ Reply budget exhausted: ${budgetCheck.reason}`);
        break;
      }

      // Skip low engagement
      if ((mention.engagementScore ?? 0) < 3) {
        await markSkipped(mention.tweetId, 'low_engagement');
        continue;
      }

      // Generate reply
      const reply = await generateReply({
        authorHandle: mention.authorHandle,
        content: mention.content,
      });

      if (!reply) {
        await markSkipped(mention.tweetId, 'low_confidence');
        continue;
      }

      // Random jitter 1-5 min
      const jitter = 60_000 + Math.random() * 240_000;
      logger.debug(`⏳ Jitter ${Math.round(jitter / 1000)}s before reply`);
      await new Promise((resolve) => setTimeout(resolve, jitter));

      if (dryRun) {
        logger.info(`📝 [DRY RUN] Would reply to @${mention.authorHandle}: "${reply.text}"`);
        await db
          .update(xInteractions)
          .set({
            replyText: reply.text,
            personaMode: 'dry_run',
            repliedAt: new Date().toISOString(),
          })
          .where(eq(xInteractions.tweetId, mention.tweetId));
        continue;
      }

      // Send reply
      const success = await replyToTweet(mention.tweetId, reply.text);
      if (!success) {
        await markSkipped(mention.tweetId, 'send_failed');
        continue;
      }

      await recordReply(mention.tweetId, mention.tweetId, reply.text);
      recordTweet(xBudgetState);

      logger.info(`↩️ Replied to @${mention.authorHandle} [${reply.tone}]: "${reply.text}"`);
    }
  } catch (error) {
    logger.error(`❌ runMentionReplyPipeline error: ${error}`);
  }
}
