// src/orchestration/pipelines.ts
import { type FeedArticle, fetchFeeds } from '../ingestion/rss.js';
import { fetchPrices, formatPricesPost, formatPricesPostX } from '../market/prices.js';
import { isDuplicate, saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { generateGoodNight, summarizeArticle } from '../content/summarize.js';
import { formatPostTelegram, formatPostX } from '../content/format.js';
import {
  sendToTelegram,
  sendToTelegramPlain,
  sendToTelegramWithPhoto,
} from '../delivery/telegram.js';
import { logger } from '../utils/logger.js';
import { rankArticles } from '../intelligence/ranker.js';
import { fetchFearGreed } from '../market/feargreed.js';
import { filterSimilar } from '../ingestion/similarity.js';
import { updateLastPosted } from '../health/server.js';
import { collectMarketSnapshot } from '../market/market-snapshot.js';
import { generateBatch } from '../content/batch-generator.js';
import {
  enqueueMicroPosts,
  getNextUnposted,
  markMicroPostAsPosted,
  getPendingCount,
} from '../queue/micro-posts.js';
import { isXEnabled, postTweet, postTweetWithMedia } from '../delivery/twitter.js';
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
import { db } from '../db/client.js';
import { articles, pipelineRuns } from '../db/schema.js';
import { getRemainingRequests } from '../utils/request-budget.js';
import { generateText } from 'ai';
import { getModel } from '../llm/router.js';
import {
  buildMondayBriefingPrompt,
  buildWeeklySummaryPrompt,
} from '../prompts/summarize.prompt.js';
import { desc, gte } from 'drizzle-orm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLACKLIST.some((term) => lower.includes(term));
}

// ─── Morning Digest ───────────────────────────────────────────────────────────

export async function runMorningDigest(): Promise<void> {
  logger.info('🌅 Starting morning digest...');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  try {
    const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

    const tgPost = formatPricesPost(prices, fearGreed);
    const xPost = await formatPricesPostX(prices, fearGreed);

    await sendToTelegram(tgPost);
    await postTweet(xPost);

    await runNewsPipeline(1);
  } catch (error) {
    logger.error(`❌ Morning digest error: ${error}`);

    db.insert(pipelineRuns)
      .values({
        type: 'morning',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: String(error),
      })
      .run();

    return;
  }

  db.insert(pipelineRuns)
    .values({
      type: 'morning',
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startMs,
    })
    .run();
}

// ─── News Pipeline ─────────────────────────────────────────────────────────────

export async function runNewsPipeline(limit = 5): Promise<void> {
  logger.info('📰 Starting news pipeline...');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let articlesPosted = 0;
  let articlesFetched = 0;
  let articlesFiltered = 0;
  let error: string | undefined;

  try {
    const allArticles = await fetchFeeds();
    articlesFetched = allArticles.length;

    const filtered = allArticles.filter((a) => isRelevant(a.title));
    articlesFiltered = filtered.length;

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

    for (const article of ranked) {
      if (articlesPosted >= limit) break;

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
        await withCircuit(
          telegramCircuit,
          () => sendToTelegramWithPhoto(image.data, tgPost),
          logger,
        );
      } else {
        await withCircuit(telegramCircuit, () => sendToTelegram(tgPost), logger);
      }

      if (isXEnabled()) {
        const xPost = formatPostX(article, summary);
        if (image) {
          await withCircuit(xCircuit, () => postTweetWithMedia(xPost, image.data), logger);
        } else {
          await withCircuit(xCircuit, () => postTweet(xPost), logger);
        }
      }

      await saveArticle(article, undefined, summary.entities);
      await markAsPosted(article.url);
      updateLastPosted();

      articlesPosted++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    logger.info(`✅ Posted: ${articlesPosted}`);
  } catch (err) {
    error = String(err);
    logger.error(`❌ News pipeline error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type: 'news',
        startedAt,
        completedAt: new Date().toISOString(),
        articlesFetched,
        articlesFiltered,
        articlesPosted,
        flashRpdUsed: 100 - getRemainingRequests(), // remaining tracked globally
        durationMs: Date.now() - startMs,
        error: error ?? null,
      })
      .run();
  }
}

// ─── Evening Digest ───────────────────────────────────────────────────────────

export async function runEveningDigest(): Promise<void> {
  logger.info('🌙 Starting evening digest...');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let error: string | undefined;

  try {
    const goodNightMsg = await generateGoodNight();
    const image = await generateNightImage(goodNightMsg);

    if (image) {
      await withCircuit(
        telegramCircuit,
        () => sendToTelegramWithPhoto(image.data, goodNightMsg),
        logger,
      );
      await withCircuit(xCircuit, () => postTweetWithMedia(goodNightMsg, image.data), logger);
    } else {
      await withCircuit(telegramCircuit, () => sendToTelegram(goodNightMsg), logger);
      await withCircuit(xCircuit, () => postTweet(goodNightMsg), logger);
    }

    await withCircuit(xCircuit, () => postTweet(goodNightMsg), logger);
  } catch (err) {
    error = String(err);
    logger.error(`❌ Evening digest error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type: 'evening',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: error ?? null,
      })
      .run();
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

// export async function runDegenTime(): Promise<void> {
//   logger.info('💊 Starting DegenTime...');
//   try {
//     const headlines = getUnusedHeadlines();
//     if (headlines.length === 0) {
//       logger.warn('⚠️ No unused headlines for DegenTime, skipping');
//       return;
//     }
//     const snapshot = await collectMarketSnapshot(headlines);
//     const posts = await generateBatch('degen_time', snapshot);
//     if (posts.length > 0) {
//       await enqueueMicroPosts(posts);
//       logger.info(`💊 DegenTime enqueued: ${posts[0]!.text}`);
//     }
//   } catch (error) {
//     logger.error(`❌ DegenTime error: ${error}`);
//   }
// }

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

// ─── Breaking News ────────────────────────────────────────────────────────────

// export async function scanForBreaking(): Promise<void> {
//   try {
//     const allArticles = await fetchFeeds();
//     const filtered = allArticles.filter((a) => isRelevant(a.title));

//     const fresh: FeedArticle[] = [];
//     for (const article of filtered) {
//       if (await isDuplicate(article.url)) continue;
//       fresh.push(article);
//     }

//     if (fresh.length === 0) return;

//     const snapshot = await collectMarketSnapshot();
//     const scored = scoreArticles(fresh, snapshot);

//     const clusters = clusterByStory(fresh);
//     applyClusterBoosts(scored, clusters);

//     const fastTrack = scored.find(
//       (a) =>
//         a.tier === 1 &&
//         a.importanceScore > 1.05 &&
//         FAST_TRACK_CATEGORIES.test(a.title) &&
//         !breakingInProgress.has(a.url),
//     );

//     if (fastTrack) {
//       logger.info(
//         `⚡ Fast-track breaking: "${fastTrack.title}" (score: ${fastTrack.importanceScore.toFixed(2)})`,
//       );
//     }

//     const breaking = scored.filter((a) => a.importanceScore > SCORE_THRESHOLDS.BREAKING);
//     const top = fastTrack ?? breaking[0];
//     if (!top) return;

//     logger.info(`🚨 Breaking detected: "${top.title}" (score: ${top.importanceScore.toFixed(2)})`);

//     if (breakingInProgress.has(top.url)) {
//       logger.info('🚨 Breaking already in progress, skipping');
//       return;
//     }

//     breakingInProgress.add(top.url);
//     try {
//       await runBreakingNewsPipeline(top);
//     } finally {
//       breakingInProgress.delete(top.url);
//     }
//   } catch (error) {
//     logger.error(`❌ Breaking news scan error: ${error}`);
//   }
// }

export async function runBreakingNewsPipeline(article: FeedArticle): Promise<void> {
  logger.info(`🚨 Running breaking pipeline for: ${article.title}`);

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let error: string | undefined;

  try {
    const summary =
      (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

    await saveArticle(article, undefined, summary?.entities);
    await markAsPosted(article.url);

    if (summary) {
      const tgPost = `🚨 ${formatPostTelegram(article, summary)}`;
      const image = await generatePostImage(
        summary.summary,
        summary.sentiment as ImageSentiment,
        summary.category,
      );

      if (image) {
        await withCircuit(
          telegramCircuit,
          () => sendToTelegramWithPhoto(image.data, tgPost),
          logger,
        );
      } else {
        await withCircuit(telegramCircuit, () => sendToTelegram(tgPost), logger);
      }

      if (isXEnabled()) {
        const xPost = formatPostX(article, summary);
        if (image) {
          await withCircuit(xCircuit, () => postTweetWithMedia(xPost, image.data), logger);
        } else {
          await withCircuit(xCircuit, () => postTweet(xPost), logger);
        }
      }
    } else {
      const fallback = `🚨 *BREAKING*\n\n${article.title}\n\n🔗 ${article.url}`;
      await withCircuit(telegramCircuit, () => sendToTelegram(fallback), logger);
      if (isXEnabled()) {
        await withCircuit(xCircuit, () => postTweet(`⚡ ${article.title}\n${article.url}`), logger);
      }
    }

    updateLastPosted();
    logger.info(`🚨 Breaking pipeline complete: "${article.title}"`);
  } catch (err) {
    error = String(err);
    logger.error(`❌ Breaking pipeline error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type: 'breaking',
        startedAt,
        completedAt: new Date().toISOString(),
        articlesPosted: error ? 0 : 1,
        flashRpdUsed: 100 - getRemainingRequests(),
        durationMs: Date.now() - startMs,
        error: error ?? null,
      })
      .run();
  }
}

// ─── Monday Briefing ──────────────────────────────────────────────────────────

export async function runMondayBriefing(): Promise<void> {
  logger.info('🐸 Starting Monday briefing...');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let error: string | undefined;

  try {
    const [prices, fearGreed, allArticles] = await Promise.all([
      fetchPrices(),
      fetchFearGreed(),
      fetchFeeds(),
    ]);

    // Top 5 fresh headlines для контекста
    const filtered = allArticles.filter((a) => isRelevant(a.title));
    const snapshot = await collectMarketSnapshot();
    const scored = scoreArticles(filtered, snapshot);
    const topHeadlines = scored.slice(0, 5).map((a) => a.title);

    const pricesText = formatPricesPost(prices, fearGreed);

    const { text } = await generateText({
      model: getModel('weekly'),
      prompt: buildMondayBriefingPrompt(pricesText, String(fearGreed?.value ?? '—'), topHeadlines),
    });

    const post = text.trim();
    logger.info(`📝 Monday briefing:\n${post}`);

    // Помечаем статьи как использованные
    const fresh = scored.slice(0, 5);
    for (const article of fresh) {
      await saveArticle(article);
      await markAsPosted(article.url);
    }

    await withCircuit(telegramCircuit, () => sendToTelegramPlain(post), logger);
    await withCircuit(xCircuit, () => postTweet(post), logger);

    updateLastPosted();
    logger.info('✅ Monday briefing posted');
  } catch (err) {
    error = String(err);
    logger.error(`❌ Monday briefing error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type: 'monday',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: error ?? null,
      })
      .run();
  }
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

export async function runWeeklySummary(): Promise<void> {
  logger.info('🐸 Starting weekly summary...');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let error: string | undefined;

  try {
    const fearGreed = await fetchFearGreed();

    // Топ статьи за последние 7 дней
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekArticles = await db
      .select({
        title: articles.title,
        category: articles.category,
        sentiment: articles.sentiment,
        importanceScore: articles.importanceScore,
      })
      .from(articles)
      .where(gte(articles.createdAt, since))
      .orderBy(desc(articles.importanceScore))
      .limit(10);

    if (weekArticles.length === 0) {
      logger.warn('⚠️ No articles found for weekly summary');
      return;
    }

    // Номер недели
    const weekNumber = Math.ceil(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    const topArticles = weekArticles.map((a) => ({
      title: a.title,
      category: a.category ?? 'trading',
      sentiment: a.sentiment ?? 'neutral',
    }));

    const { text } = await generateText({
      model: getModel('weekly'),
      prompt: buildWeeklySummaryPrompt(topArticles, String(fearGreed?.value ?? '—'), weekNumber),
    });

    const post = text.trim();
    logger.info(`📝 Weekly summary:\n${post}`);

    await withCircuit(telegramCircuit, () => sendToTelegramPlain(post), logger);
    await withCircuit(xCircuit, () => postTweet(post), logger);

    updateLastPosted();
    logger.info('✅ Weekly summary posted');
  } catch (err) {
    error = String(err);
    logger.error(`❌ Weekly summary error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type: 'weekly',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        error: error ?? null,
      })
      .run();
  }
}
