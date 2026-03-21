// src/orchestration/digest-pipeline.ts
import { generateGoodNight } from '../content/summarize.js';
import { logger } from '../utils/logger.js';
import { generateBatch } from '../content/batch-generator.js';
import type { MarketSnapshot } from '../market/market-snapshot.js';
import {
  enqueueMicroPosts,
  getNextUnposted,
  markMicroPostAsPosted,
  getPendingCount,
} from '../queue/micro-posts.js';
import { isXEnabled, postTweet } from '../delivery/twitter.js';
import { canTweet, recordTweet, formatBudgetStatus } from '../delivery/x-rate-limiter.js';
import { generateNightImage } from '../images/generate-image.js';
import { xBudgetState, getUnusedHeadlines } from './state.js';
import { withPipelineMetrics } from './helpers.js';
import { publish, content } from '../delivery/publisher.js';

function emptySnapshot(unusedHeadlines: string[] = []): MarketSnapshot {
  return {
    prices: [],
    fearGreed: null,
    unusedHeadlines,
    marketMood: 'neutral',
    timeOfDay: 'morning',
    volatilityAlerts: [],
  };
}

// ─── Morning Batches ──────────────────────────────────────────────────────────

export async function runMorningBatches(): Promise<void> {
  logger.info('🎲 Starting morning batch generation...');
  try {
    const stub = emptySnapshot();
    const philosophyPosts = await generateBatch('philosophy', stub);
    logger.info(`🎲 Morning batch ready — philosophy: ${philosophyPosts.length}`);
    await enqueueMicroPosts(philosophyPosts);
    const pending = await getPendingCount();
    logger.info(`📊 Queue size after morning batches: ${pending}`);
  } catch (error) {
    logger.error(`❌ Morning batch error: ${error}`);
  }
}

// ─── Afternoon Batch ──────────────────────────────────────────────────────────

export async function runAfternoonBatch(): Promise<void> {
  logger.info('🎲 Starting afternoon batch generation...');
  try {
    const headlines = getUnusedHeadlines();
    if (headlines.length === 0) {
      logger.warn('⚠️ No unused headlines available, skipping raw_headlines batch');
      return;
    }
    const stub = emptySnapshot(headlines);
    const posts = await generateBatch('raw_headlines', stub);
    logger.info(`🎲 Afternoon batch ready — raw_headlines: ${posts.length}`);
    await enqueueMicroPosts(posts);
    const pending = await getPendingCount();
    logger.info(`📊 Queue size after afternoon batch: ${pending}`);
  } catch (error) {
    logger.error(`❌ Afternoon batch error: ${error}`);
  }
}

// ─── Degen Time ───────────────────────────────────────────────────────────────

export async function runDegenTime(): Promise<void> {
  logger.info('💊 Starting DegenTime...');
  try {
    const headlines = getUnusedHeadlines();
    if (headlines.length === 0) {
      logger.warn('⚠️ No unused headlines for DegenTime, skipping');
      return;
    }
    const stub = emptySnapshot(headlines);
    const posts = await generateBatch('degen_time', stub);
    if (posts.length > 0) {
      await enqueueMicroPosts(posts);
      logger.info(`💊 DegenTime enqueued: ${posts[0]!.text}`);
    }
  } catch (error) {
    logger.error(`❌ DegenTime error: ${error}`);
  }
}

// ─── Micro-post Dispatcher ────────────────────────────────────────────────────
// TODO :: dispatchNextMicroPost
export async function dispatchNextMicroPost(): Promise<void> {
  const rateCheck = canTweet(xBudgetState);
  if (!rateCheck.allowed) {
    logger.debug(
      `⏸️ X dispatch skipped: ${rateCheck.reason} — ${formatBudgetStatus(xBudgetState)}`,
    );
    return;
  }

  const post = await getNextUnposted('x');
  if (!post) {
    logger.debug('📭 No micro-posts in queue');
    return;
  }

  const hashtags = JSON.parse(post.hashtags) as string[];
  const fullText = `${post.mood} ${post.text}\n\n${hashtags.join(' ')}`;

  if (isXEnabled()) {
    const success = await postTweet(fullText);
    if (!success) {
      logger.warn(`⚠️ Tweet failed for micro-post #${post.id}, will retry next cycle`);
      return;
    }
    recordTweet(xBudgetState);
  } else {
    logger.info(`📝 [DRY-RUN X] ${fullText}`);
  }

  await markMicroPostAsPosted(post.id);
  const pending = await getPendingCount();
  logger.info(
    `📤 Dispatched micro-post #${post.id} [${post.batchType}] — ${formatBudgetStatus(xBudgetState)} — remaining: ${pending}`,
  );
}

// ─── Evening Digest ───────────────────────────────────────────────────────────

export async function runEveningDigest(): Promise<void> {
  logger.info('🌙 Starting evening digest...');

  await withPipelineMetrics('evening', async () => {
    const goodNightMsg = await generateGoodNight();
    const image = await generateNightImage(goodNightMsg);

    await publish({
      telegram: content(goodNightMsg, image?.data),
      x: undefined,
    });
  });
}
