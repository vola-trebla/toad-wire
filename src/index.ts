import 'dotenv/config';
import cron from 'node-cron';
import { type FeedArticle, fetchFeeds } from './sources/rss.js';
import { fetchPrices, formatPricesPost, formatPricesPostX } from './sources/prices.js';
import { isDuplicate, saveArticle, markAsPosted } from './pipeline/dedup.js';
import { generateGoodNight, summarizeArticle } from './pipeline/summarize.js';
import { formatPostTelegram, formatPostX } from './pipeline/format.js';
import { sendToTelegram, sendToTelegramWithPhoto } from './pipeline/post.js';
import { logger } from './utils/logger.js';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';
import { rankArticles } from './pipeline/ranker.js';
import { fetchFearGreed } from './sources/feargreed.js';
import { filterSimilar } from './pipeline/similarity.js';
import { initSentry } from './utils/sentry.js';
import { startHealthServer, updateLastPosted } from './health/server.js';
import { runBackup } from './utils/backup.js';
import { collectMarketSnapshot } from './sources/market-snapshot.js';
import { generateBatch } from './pipeline/batch-generator.js';
import {
  enqueueMicroPosts,
  getNextUnposted,
  markMicroPostAsPosted,
  getPendingCount,
  cleanOldMicroPosts,
} from './queue/micro-posts.js';
import { isXEnabled, postTweet } from './channels/twitter.js';
import {
  createXBudgetState,
  canTweet,
  recordTweet,
  formatBudgetStatus,
} from './channels/x-rate-limiter.js';
import { clusterByStory, applyClusterBoosts } from './pipeline/story-cluster.js';
import { scoreArticles, SCORE_THRESHOLDS } from './pipeline/scorer.js';
import { checkFeedHealth, reportFeedHealth } from './sources/feed-health.js';
import { createCircuitState, withCircuit } from './utils/circuit-breaker.js';
import {
  generateNightImage,
  generatePostImage,
  type ImageSentiment,
} from './images/generate-image.js';

initSentry();

// Circuit breakers for external APIs
const telegramCircuit = createCircuitState('telegram');
const xCircuit = createCircuitState('x-api');
const geminiCircuit = createCircuitState('gemini');

startHealthServer();

// X rate limiter state — persists in memory, resets on restart (acceptable)
const xBudgetState = createXBudgetState();

// Unused headlines from last news pipeline run — shared between pipeline and batch
let lastUnusedHeadlines: string[] = [];

const BLACKLIST = [
  'nft game',
  'play-to-earn',
  'p2e',
  'sponsored',
  'press release',
  'partner content',
  'promoted',
  'advertisement',
  'podcast recap',
  'weekly roundup',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLACKLIST.some((term) => lower.includes(term));
}

// 🌅 10:00 — Morning digest with prices
async function runMorningDigest(): Promise<void> {
  logger.info('🌅 Starting morning digest...');
  try {
    const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

    const tgPost = formatPricesPost(prices, fearGreed);
    const xPost = await formatPricesPostX(prices, fearGreed);

    await sendToTelegram(tgPost);
    await postTweet(xPost);

    await runNewsPipeline(1);
  } catch (error) {
    logger.error(`❌ Morning digest error: ${error}`);
  }
}

// 📰 News pipeline — returns unused headlines for batch generation
async function runNewsPipeline(limit = 5): Promise<void> {
  logger.info('📰 Starting news pipeline...');

  const allArticles = await fetchFeeds();
  const filtered = allArticles.filter((a) => isRelevant(a.title));

  logger.info(`🔍 After filter: ${filtered.length} of ${allArticles.length}`);

  const nonDuplicates: FeedArticle[] = [];
  for (const article of filtered) {
    if (await isDuplicate(article.url)) continue;
    nonDuplicates.push(article);
  }

  const fresh = await filterSimilar(nonDuplicates);

  // Score articles — log breakdown for threshold calibration
  const snapshot = await collectMarketSnapshot();
  const scored = scoreArticles(fresh, snapshot);

  // Log top-5 breakdown
  logger.info('📊 Score breakdown (top 5):');
  scored.slice(0, 5).forEach((a, i) => {
    logger.info(
      `  ${i + 1}. [${a.source}] ${a.importanceScore.toFixed(3)} — ${a.title.slice(0, 60)}`,
    );
    logger.info(
      `     auth=${a.scoreBreakdown.authority.toFixed(2)} × fresh=${a.scoreBreakdown.freshness.toFixed(2)}` +
        ` + kw=${a.scoreBreakdown.keywordBoost.toFixed(2)}` +
        ` + ctx=${a.scoreBreakdown.contextBoost.toFixed(2)}` +
        ` − dup=${a.scoreBreakdown.duplicatePenalty.toFixed(2)}` +
        ` − spam=${a.scoreBreakdown.spamPenalty.toFixed(2)}`,
    );
  });

  const MAX_RANKER_INPUT = 15;
  const ranked =
    (await withCircuit(
      geminiCircuit,
      () => rankArticles(scored.slice(0, MAX_RANKER_INPUT), limit * 3),
      logger,
    )) ?? [];

  // Save unused headlines for afternoon batch
  const rankedUrls = new Set(ranked.map((a) => a.url));
  lastUnusedHeadlines = fresh.filter((a) => !rankedUrls.has(a.url)).map((a) => a.title);

  logger.info(`📦 Unused headlines saved: ${lastUnusedHeadlines.length}`);

  let posted = 0;

  for (const article of ranked) {
    if (posted >= limit) break;

    const summary =
      (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

    if (!summary) continue;

    // Telegram post
    const tgPost = formatPostTelegram(article, summary);
    const image = await generatePostImage(
      summary.summary,
      summary.sentiment as ImageSentiment,
      summary.category,
    );

    if (image) {
      await withCircuit(telegramCircuit, () => sendToTelegramWithPhoto(image.data, tgPost), logger);
    } else {
      await withCircuit(telegramCircuit, () => sendToTelegram(tgPost), logger);
    }

    // X post (if enabled)
    if (isXEnabled()) {
      const xPost = formatPostX(article, summary);
      await withCircuit(xCircuit, () => postTweet(xPost), logger);
    }

    await saveArticle(article);
    await markAsPosted(article.url);
    updateLastPosted();

    posted++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  logger.info(`✅ Posted: ${posted}`);
}

// 🌙 21:00 — Evening digest
async function runEveningDigest(): Promise<void> {
  logger.info('🌙 Starting evening digest...');
  try {
    const goodNightMsg = await generateGoodNight();

    // Generate night image
    const image = await generateNightImage(goodNightMsg);

    if (image) {
      await withCircuit(
        telegramCircuit,
        () => sendToTelegramWithPhoto(image.data, goodNightMsg),
        logger,
      );
    } else {
      await withCircuit(telegramCircuit, () => sendToTelegram(goodNightMsg), logger);
    }

    // X — text only (no image on Twitter)
    await withCircuit(xCircuit, () => postTweet(goodNightMsg), logger);
  } catch (error) {
    logger.error(`❌ Evening digest error: ${error}`);
  }
}

// 🎲 09:30 — Morning batch generation (market_vibe + philosophy)
async function runMorningBatches(): Promise<void> {
  logger.info('🎲 Starting morning batch generation...');
  try {
    const snapshot = await collectMarketSnapshot();
    const [vibePosts, philosophyPosts] = await Promise.all([
      generateBatch('market_vibe', snapshot),
      generateBatch('philosophy', snapshot),
    ]);
    logger.info(
      `🎲 Morning batches ready — vibe: ${vibePosts.length}, philosophy: ${philosophyPosts.length}`,
    );
    await enqueueMicroPosts(vibePosts);
    await enqueueMicroPosts(philosophyPosts);
    const pending = await getPendingCount();
    logger.info(`📊 Queue size after morning batches: ${pending}`);
  } catch (error) {
    logger.error(`❌ Morning batch error: ${error}`);
  }
}

// 🎲 13:30 — Afternoon batch (raw_headlines from morning pipeline)
async function runAfternoonBatch(): Promise<void> {
  logger.info('🎲 Starting afternoon batch generation...');
  try {
    if (lastUnusedHeadlines.length === 0) {
      logger.warn('⚠️ No unused headlines available, skipping raw_headlines batch');
      return;
    }
    const snapshot = await collectMarketSnapshot(lastUnusedHeadlines);
    const posts = await generateBatch('raw_headlines', snapshot);
    logger.info(`🎲 Afternoon batch ready — raw_headlines: ${posts.length}`);
    await enqueueMicroPosts(posts);
    const pending = await getPendingCount();
    logger.info(`📊 Queue size after afternoon batch: ${pending}`);
  } catch (error) {
    logger.error(`❌ Afternoon batch error: ${error}`);
  }
}

// 💊 13:45 — DegenTime (one chaotic post from unused headlines)
async function runDegenTime(): Promise<void> {
  logger.info('💊 Starting DegenTime...');
  try {
    if (lastUnusedHeadlines.length === 0) {
      logger.warn('⚠️ No unused headlines for DegenTime, skipping');
      return;
    }
    const snapshot = await collectMarketSnapshot(lastUnusedHeadlines);
    const posts = await generateBatch('degen_time', snapshot);
    if (posts.length > 0) {
      await enqueueMicroPosts(posts);
      logger.info(`💊 DegenTime enqueued: ${posts[0]!.text}`);
    }
  } catch (error) {
    logger.error(`❌ DegenTime error: ${error}`);
  }
}

// 📤 Dispatcher — every 20 min, 08:00–23:00
// @ts-ignore
async function dispatchNextMicroPost(): Promise<void> {
  // 1. Check rate limits before doing anything
  const rateCheck = canTweet(xBudgetState);
  if (!rateCheck.allowed) {
    logger.debug(
      `⏸️ X dispatch skipped: ${rateCheck.reason} — ${formatBudgetStatus(xBudgetState)}`,
    );
    return;
  }

  // 2. Pull next queued post
  const post = await getNextUnposted('x');
  if (!post) {
    logger.debug('📭 No micro-posts in queue');
    return;
  }

  // 3. Build tweet text
  const hashtags = JSON.parse(post.hashtags) as string[];
  const fullText = `${post.mood} ${post.text}\n\n${hashtags.join(' ')}`;

  // 4. Post to X (guarded by isXEnabled inside postTweet)
  if (isXEnabled()) {
    const success = await postTweet(fullText);
    if (!success) {
      // Leave post as unposted — will retry on next dispatch cycle
      logger.warn(`⚠️ Tweet failed for micro-post #${post.id}, will retry next cycle`);
      return;
    }
    recordTweet(xBudgetState);
  } else {
    // Dry-run: mark as posted so queue doesn't accumulate stale items
    logger.info(`📝 [DRY-RUN X] ${fullText}`);
  }

  // 5. Mark as dispatched
  await markMicroPostAsPosted(post.id);

  const pending = await getPendingCount();
  logger.info(
    `📤 Dispatched micro-post #${post.id} [${post.batchType}] — ${formatBudgetStatus(xBudgetState)} — remaining: ${pending}`,
  );
}

// In-memory lock — prevents same article triggering twice during processing
const breakingInProgress = new Set<string>();

// 🚨 Breaking News Scanner — every 10 min, 07:00–23:00
// Lightweight: RSS fetch + algorithmic scoring only, zero LLM RPD
async function scanForBreaking(): Promise<void> {
  try {
    const allArticles = await fetchFeeds();
    const filtered = allArticles.filter((a) => isRelevant(a.title));

    // URL-only dedup (no embeddings — keep it fast)
    const fresh: FeedArticle[] = [];
    for (const article of filtered) {
      if (await isDuplicate(article.url)) continue;
      fresh.push(article);
    }

    if (fresh.length === 0) return;

    const snapshot = await collectMarketSnapshot();
    const scored = scoreArticles(fresh, snapshot);

    // Story clustering — detect multi-source breaking events
    const clusters = clusterByStory(fresh);
    applyClusterBoosts(scored, clusters);

    // Fast-track: Tier-1 + score > 1.05 + security/crisis category
    // Catches "first-to-publish" breaking before cluster forms
    const FAST_TRACK_CATEGORIES =
      /hack|exploit|breach|crash|collapse|bankrupt|liquidat|sec|ban|arrest/i;
    const fastTrack = scored.find(
      (a) =>
        a.tier === 1 &&
        a.importanceScore > 1.05 &&
        FAST_TRACK_CATEGORIES.test(a.title) &&
        !breakingInProgress.has(a.url),
    );

    if (fastTrack) {
      logger.info(
        `⚡ Fast-track breaking: "${fastTrack.title}" (score: ${fastTrack.importanceScore.toFixed(2)})`,
      );
    }

    // Standard breaking threshold
    const breaking = scored.filter((a) => a.importanceScore > SCORE_THRESHOLDS.BREAKING);

    // Pick top candidate — fast-track takes priority over standard breaking
    const top = fastTrack ?? breaking[0];
    if (!top) return;

    logger.info(`🚨 Breaking detected: "${top.title}" (score: ${top.importanceScore.toFixed(2)})`);

    // Fast in-memory guard (handles concurrent scans)
    if (breakingInProgress.has(top.url)) {
      logger.info('🚨 Breaking already in progress, skipping');
      return;
    }

    breakingInProgress.add(top.url);
    try {
      await runBreakingNewsPipeline(top);
    } finally {
      breakingInProgress.delete(top.url);
    }
  } catch (error) {
    logger.error(`❌ Breaking news scan error: ${error}`);
  }
}

// 🚨 Breaking News Pipeline — immediate publish, no schedule
async function runBreakingNewsPipeline(article: FeedArticle): Promise<void> {
  logger.info(`🚨 Running breaking pipeline for: ${article.title}`);

  // Early save — lock article BEFORE processing to prevent race conditions
  // Worst case: article "burns" in dedup if pipeline fails after this point
  // Best case: prevents double-publish on parallel pipeline runs
  await saveArticle(article);
  await markAsPosted(article.url);

  const summary =
    (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

  if (summary) {
    const tgPost = `🚨 ${formatPostTelegram(article, summary)}`;
    await withCircuit(telegramCircuit, () => sendToTelegram(tgPost), logger);

    if (isXEnabled()) {
      const xPost = formatPostX(article, summary);
      await withCircuit(xCircuit, () => postTweet(`🚨 ${xPost}`), logger);
    }
  } else {
    // Budget exhausted fallback — title-only
    const fallback = `🚨 *BREAKING*\n\n${article.title}\n\n🔗 ${article.url}`;
    await withCircuit(telegramCircuit, () => sendToTelegram(fallback), logger);
    if (isXEnabled()) {
      await withCircuit(xCircuit, () => postTweet(`🚨 ${article.title}\n${article.url}`), logger);
    }
  }

  updateLastPosted();
  logger.info(`🚨 Breaking pipeline complete: "${article.title}"`);
}

const TIMEZONE = 'America/Montevideo';

cron.schedule('0 2 * * *', () => runBackup(), { timezone: TIMEZONE });
cron.schedule('30 9 * * *', () => void runMorningBatches(), { timezone: TIMEZONE });
cron.schedule('0 10 * * *', () => void runMorningDigest(), { timezone: TIMEZONE });
cron.schedule('0 12 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('30 13 * * *', () => void runAfternoonBatch(), { timezone: TIMEZONE });
cron.schedule('0 15 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 18 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 21 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 23 * * *', () => void runEveningDigest(), { timezone: TIMEZONE });
cron.schedule(
  '0 0 * * 0',
  async () => {
    db.run(sql`DELETE FROM articles WHERE created_at < datetime('now', '-7 days')`);
    logger.info('🗑️ Old articles cleaned up');
    await cleanOldMicroPosts(7);
  },
  { timezone: TIMEZONE },
);
// cron.schedule('*/20 8-23 * * *', () => void dispatchNextMicroPost(), { timezone: TIMEZONE });
cron.schedule('45 13 * * *', () => void runDegenTime(), { timezone: TIMEZONE });
// Breaking news scanner — every 10 min, 07:00–23:00
cron.schedule('*/10 7-23 * * *', () => void scanForBreaking(), { timezone: TIMEZONE });

// Feed health check — every 30 min
cron.schedule('*/30 * * * *', () => void checkFeedHealth(), { timezone: TIMEZONE });

// Weekly feed health report — Monday 09:00
cron.schedule('0 9 * * 1', () => void reportFeedHealth(), { timezone: TIMEZONE });

logger.info('🐸 El Sapo Cripto arrancó! Esperando el horario...');

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  process.exit(0);
});
