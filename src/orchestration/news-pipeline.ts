// src/orchestration/news-pipeline.ts
import { type FeedArticle } from '../ingestion/rss.js';
import { fetchPrices, formatPricesPost, formatPricesPostX } from '../market/prices.js';
import { saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { summarizeArticle } from '../content/summarize.js';
import { formatPostTelegram, formatPostX } from '../content/format.js';
import { logger } from '../utils/logger.js';
import { rankArticles } from '../intelligence/ranker.js';
import { fetchFearGreed } from '../market/feargreed.js';
import { updateLastPosted } from '../health/server.js';
import { postTweet } from '../delivery/twitter.js';
import { sendToTelegram } from '../delivery/telegram.js';
import { generatePostImage, type ImageSentiment } from '../images/generate-image.js';
import { MAX_RANKER_INPUT } from '../utils/constants.js';
import { geminiCircuit, getUnusedHeadlines, setUnusedHeadlines } from './state.js';
import { withCircuit } from '../utils/circuit-breaker.js';
import { getRemainingRequests } from '../utils/request-budget.js';
import { withPipelineMetrics, getFilteredScoredArticles } from './helpers.js';
import { publish, content } from '../delivery/publisher.js';

// ─── Publish Article ──────────────────────────────────────────────────────────

export async function publishArticle(
  article: FeedArticle,
  summary: NonNullable<Awaited<ReturnType<typeof summarizeArticle>>>,
  tgText: string,
): Promise<void> {
  const image = await generatePostImage(
    summary.summary,
    summary.sentiment as ImageSentiment,
    summary.category,
    article.title,
  );

  await publish({
    telegram: content(tgText, image?.data),
    x: content(formatPostX(article, summary), image?.data),
  });
}

// ─── Morning Digest ───────────────────────────────────────────────────────────

export async function runMorningDigest(): Promise<void> {
  logger.info('🌅 Starting morning digest...');

  await withPipelineMetrics('morning', async () => {
    const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

    const tgPost = formatPricesPost(prices, fearGreed);
    const xPost = await formatPricesPostX(prices, fearGreed);

    await sendToTelegram(tgPost);
    await postTweet(xPost);

    await runNewsPipeline(1);
  });
}

// ─── News Pipeline ────────────────────────────────────────────────────────────

export async function runNewsPipeline(limit = 5): Promise<void> {
  logger.info('📰 Starting news pipeline...');

  await withPipelineMetrics('news', async (metrics) => {
    const { scored, fresh, fetchedCount, filteredCount } = await getFilteredScoredArticles({
      withSimilarityFilter: true,
      withRecentTitles: false,
      withDedup: true,
    });

    metrics.articlesFetched = fetchedCount;
    metrics.articlesFiltered = filteredCount;

    logger.info(`🔍 After filter: ${filteredCount} of ${fetchedCount}`);
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

    metrics.articlesPosted = 0;
    for (const article of ranked) {
      if (metrics.articlesPosted >= limit) break;

      const summary =
        (await withCircuit(geminiCircuit, () => summarizeArticle(article), logger)) ?? null;

      if (!summary) continue;

      await publishArticle(article, summary, formatPostTelegram(article, summary));
      await saveArticle(article, undefined, summary.entities);
      await markAsPosted(article.url);
      updateLastPosted();

      metrics.articlesPosted++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    metrics.flashRpdUsed = 100 - getRemainingRequests();
    logger.info(`✅ Posted: ${metrics.articlesPosted}`);
  });
}
