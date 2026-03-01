// src/orchestration/pipelines.ts
import { type FeedArticle, fetchFeeds } from '../sources/rss.js';
import { fetchPrices, formatPricesPost, formatPricesPostX } from '../sources/prices.js';
import { isDuplicate, saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { generateGoodNight, summarizeArticle } from '../content/summarize.js';
import { formatPostTelegram, formatPostX } from '../content/format.js';
import { sendToTelegram, sendToTelegramWithPhoto } from '../delivery/telegram.js';
import { logger } from '../utils/logger.js';
import { rankArticles } from '../intelligence/ranker.js';
import { fetchFearGreed } from '../sources/feargreed.js';
import { filterSimilar } from '../ingestion/similarity.js';
import { updateLastPosted } from '../health/server.js';
import { collectMarketSnapshot } from '../sources/market-snapshot.js';
import { generateBatch } from '../content/batch-generator.js';
import {
  enqueueMicroPosts,
  getNextUnposted,
  markMicroPostAsPosted,
  getPendingCount,
} from '../queue/micro-posts.js';
import { isXEnabled, postTweet } from '../delivery/twitter.js';
import { canTweet, recordTweet, formatBudgetStatus } from '../delivery/x-rate-limiter.js';
import { clusterByStory, applyClusterBoosts } from '../intelligence/story-cluster.js';
import { scoreArticles, SCORE_THRESHOLDS } from '../intelligence/scorer.js';
import { withCircuit } from '../utils/circuit-breaker.js';
import {
  generateNightImage,
  generatePostImage,
  type ImageSentiment,
} from '../images/generate-image.js';
import { BLACKLIST, MAX_RANKER_INPUT, FAST_TRACK_CATEGORIES } from '../utils/constants.js';
import {
  telegramCircuit,
  xCircuit,
  geminiCircuit,
  xBudgetState,
  breakingInProgress,
  getUnusedHeadlines,
  setUnusedHeadlines,
} from './state.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLACKLIST.some((term) => lower.includes(term));
}

// ─── Morning Digest ───────────────────────────────────────────────────────────

export async function runMorningDigest(): Promise<void> {
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

// ─── News Pipeline ─────────────────────────────────────────────────────────────

export async function runNewsPipeline(limit = 5): Promise<void> {
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

  const snapshot = await collectMarketSnapshot();
  const scored = scoreArticles(fresh, snapshot);

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

  const ranked =
    (await withCircuit(
      geminiCircuit,
      () => rankArticles(scored.slice(0, MAX_RANKER_INPUT), limit * 3),
      logger,
    )) ?? [];

  const rankedUrls = new Set(ranked.map((a) => a.url));
  setUnusedHeadlines(fresh.filter((a) => !rankedUrls.has(a.url)).map((a) => a.title));
  logger.info(`📦 Unused headlines saved: ${getUnusedHeadlines().length}`);

  let posted = 0;

  for (const article of ranked) {
    if (posted >= limit) break;

    const summary =
      (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

    if (!summary) continue;

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

// ─── Evening Digest ───────────────────────────────────────────────────────────

export async function runEveningDigest(): Promise<void> {
  logger.info('🌙 Starting evening digest...');
  try {
    const goodNightMsg = await generateGoodNight();
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

    await withCircuit(xCircuit, () => postTweet(goodNightMsg), logger);
  } catch (error) {
    logger.error(`❌ Evening digest error: ${error}`);
  }
}

// ─── Batch Pipelines ──────────────────────────────────────────────────────────

export async function runMorningBatches(): Promise<void> {
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

export async function runAfternoonBatch(): Promise<void> {
  logger.info('🎲 Starting afternoon batch generation...');
  try {
    const headlines = getUnusedHeadlines();
    if (headlines.length === 0) {
      logger.warn('⚠️ No unused headlines available, skipping raw_headlines batch');
      return;
    }
    const snapshot = await collectMarketSnapshot(headlines);
    const posts = await generateBatch('raw_headlines', snapshot);
    logger.info(`🎲 Afternoon batch ready — raw_headlines: ${posts.length}`);
    await enqueueMicroPosts(posts);
    const pending = await getPendingCount();
    logger.info(`📊 Queue size after afternoon batch: ${pending}`);
  } catch (error) {
    logger.error(`❌ Afternoon batch error: ${error}`);
  }
}

export async function runDegenTime(): Promise<void> {
  logger.info('💊 Starting DegenTime...');
  try {
    const headlines = getUnusedHeadlines();
    if (headlines.length === 0) {
      logger.warn('⚠️ No unused headlines for DegenTime, skipping');
      return;
    }
    const snapshot = await collectMarketSnapshot(headlines);
    const posts = await generateBatch('degen_time', snapshot);
    if (posts.length > 0) {
      await enqueueMicroPosts(posts);
      logger.info(`💊 DegenTime enqueued: ${posts[0]!.text}`);
    }
  } catch (error) {
    logger.error(`❌ DegenTime error: ${error}`);
  }
}

// ─── Micro-post Dispatcher ────────────────────────────────────────────────────

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

// ─── Breaking News ────────────────────────────────────────────────────────────

export async function scanForBreaking(): Promise<void> {
  try {
    const allArticles = await fetchFeeds();
    const filtered = allArticles.filter((a) => isRelevant(a.title));

    const fresh: FeedArticle[] = [];
    for (const article of filtered) {
      if (await isDuplicate(article.url)) continue;
      fresh.push(article);
    }

    if (fresh.length === 0) return;

    const snapshot = await collectMarketSnapshot();
    const scored = scoreArticles(fresh, snapshot);

    const clusters = clusterByStory(fresh);
    applyClusterBoosts(scored, clusters);

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

    const breaking = scored.filter((a) => a.importanceScore > SCORE_THRESHOLDS.BREAKING);
    const top = fastTrack ?? breaking[0];
    if (!top) return;

    logger.info(`🚨 Breaking detected: "${top.title}" (score: ${top.importanceScore.toFixed(2)})`);

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

export async function runBreakingNewsPipeline(article: FeedArticle): Promise<void> {
  logger.info(`🚨 Running breaking pipeline for: ${article.title}`);

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
    const fallback = `🚨 *BREAKING*\n\n${article.title}\n\n🔗 ${article.url}`;
    await withCircuit(telegramCircuit, () => sendToTelegram(fallback), logger);
    if (isXEnabled()) {
      await withCircuit(xCircuit, () => postTweet(`🚨 ${article.title}\n${article.url}`), logger);
    }
  }

  updateLastPosted();
  logger.info(`🚨 Breaking pipeline complete: "${article.title}"`);
}
