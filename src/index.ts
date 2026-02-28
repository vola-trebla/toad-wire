import 'dotenv/config';
import cron from 'node-cron';
import { type FeedArticle, fetchFeeds } from './sources/rss.js';
import { fetchPrices, formatPricesPost } from './sources/prices.js';
import { isDuplicate, saveArticle, markAsPosted } from './pipeline/dedup.js';
import { generateGoodNight, summarizeArticle } from './pipeline/summarize.js';
import { formatPostTelegram, formatPostX } from './pipeline/format.js';
import { sendToTelegram } from './pipeline/post.js';
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

initSentry();
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

    const post = formatPricesPost(prices, fearGreed);

    await sendToTelegram(post);
    await postTweet(post);
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
  const MAX_RANKER_INPUT = 15;
  const ranked = await rankArticles(fresh.slice(0, MAX_RANKER_INPUT), limit * 3);

  // Save unused headlines for afternoon batch
  const rankedUrls = new Set(ranked.map((a) => a.url));
  lastUnusedHeadlines = fresh.filter((a) => !rankedUrls.has(a.url)).map((a) => a.title);

  logger.info(`📦 Unused headlines saved: ${lastUnusedHeadlines.length}`);

  let posted = 0;

  for (const article of ranked) {
    if (posted >= limit) break;

    const summary = await summarizeArticle(article);
    if (!summary) continue;

    // Telegram post
    const tgPost = formatPostTelegram(article, summary);
    await sendToTelegram(tgPost);

    // X post (if enabled)
    if (isXEnabled()) {
      const xPost = formatPostX(article, summary);
      await postTweet(xPost);
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
    await sendToTelegram(goodNightMsg);
    await postTweet(goodNightMsg);
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
cron.schedule('*/20 8-23 * * *', () => void dispatchNextMicroPost(), { timezone: TIMEZONE });
cron.schedule('45 13 * * *', () => void runDegenTime(), { timezone: TIMEZONE });

logger.info('🐸 El Sapo Cripto arrancó! Esperando el horario...');

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  process.exit(0);
});
