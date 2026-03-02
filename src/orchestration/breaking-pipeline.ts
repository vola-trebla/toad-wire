// src/orchestration/breaking-pipeline.ts
import { type FeedArticle, fetchFeeds } from '../ingestion/rss.js';
import { isDuplicate, saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { summarizeArticle } from '../content/summarize.js';
import { formatPostTelegram } from '../content/format.js';
import { sendToTelegram } from '../delivery/telegram.js';
import { logger } from '../utils/logger.js';
import { updateLastPosted } from '../health/server.js';
import { collectMarketSnapshot } from '../market/market-snapshot.js';
import { isXEnabled, postTweet } from '../delivery/twitter.js';
import { clusterByStory, applyClusterBoosts } from '../intelligence/story-cluster.js';
import { scoreArticles, SCORE_THRESHOLDS } from '../intelligence/scorer.js';
import { withCircuit } from '../utils/circuit-breaker.js';
import { FAST_TRACK_CATEGORIES } from '../utils/constants.js';
import {
  telegramCircuit,
  xCircuit,
  geminiCircuit,
  breakingInProgress,
  getUnusedHeadlines,
  canPostBreaking,
  recordBreakingPost,
} from './state.js';
import { getRemainingRequests } from '../utils/request-budget.js';
import { isRelevant, withPipelineMetrics } from './helpers.js';
import { publishArticle } from './news-pipeline.js';

// ─── Breaking News Scanner ────────────────────────────────────────────────────

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
    const recentTitles = getUnusedHeadlines();
    const scored = scoreArticles(fresh, snapshot, recentTitles);

    const clusters = clusterByStory(fresh);
    applyClusterBoosts(scored, clusters);

    const fastTrack = scored.find(
      (a) =>
        a.tier === 1 &&
        a.importanceScore > 1.3 &&
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

    if (!canPostBreaking()) {
      logger.info('⏸️ Breaking cooldown active — skipping');
      return;
    }

    breakingInProgress.add(top.url);
    try {
      const posted = await runBreakingNewsPipeline(top);
      if (posted) {
        recordBreakingPost();
      }
    } finally {
      breakingInProgress.delete(top.url);
    }
  } catch (error) {
    logger.error(`❌ Breaking news scan error: ${error}`);
  }
}

// ─── Breaking News Pipeline ───────────────────────────────────────────────────

export async function runBreakingNewsPipeline(article: FeedArticle): Promise<boolean> {
  logger.info(`🚨 Running breaking pipeline for: ${article.title}`);

  let posted = false;

  await withPipelineMetrics('breaking', async (metrics) => {
    await markAsPosted(article.url);
    await saveArticle(article);

    const summary =
      (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

    if (summary) {
      await saveArticle(article, undefined, summary.entities);
      await publishArticle(article, summary, `🚨 ${formatPostTelegram(article, summary)}`);
      updateLastPosted();
      metrics.articlesPosted = 1;
      metrics.flashRpdUsed = 100 - getRemainingRequests();
      posted = true;
      logger.info(`🚨 Breaking pipeline complete: "${article.title}"`);
    } else {
      logger.warn(`⚠️ Breaking summary failed — posting title fallback`);
      const fallback = `🚨 BREAKING\n\n${article.title}\n\n🔗 ${article.url}`;
      await withCircuit(telegramCircuit, () => sendToTelegram(fallback), logger);
      if (isXEnabled()) {
        await withCircuit(xCircuit, () => postTweet(`⚡ ${article.title}\n${article.url}`), logger);
      }
      updateLastPosted();
      metrics.articlesPosted = 1;
      posted = true;
    }
  });

  return posted;
}
