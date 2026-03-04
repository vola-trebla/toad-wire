// src/orchestration/breaking-pipeline.ts
import { type FeedArticle } from '../ingestion/rss.js';
import { saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { summarizeArticle } from '../content/summarize.js';
import { formatPostTelegram } from '../content/format.js';
import { logger } from '../utils/logger.js';
import { updateLastPosted } from '../health/server.js';
import { isXEnabled } from '../delivery/twitter.js';
import { clusterByStory, applyClusterBoosts } from '../intelligence/story-cluster.js';
import { SCORE_THRESHOLDS } from '../intelligence/scorer.js';
import { withCircuit } from '../utils/circuit-breaker.js';
import { FAST_TRACK_CATEGORIES } from '../utils/constants.js';
import { geminiCircuit, breakingInProgress, canPostBreaking, recordBreakingPost } from './state.js';
import { getRemainingRequests } from '../utils/request-budget.js';
import { withPipelineMetrics, getFilteredScoredArticles } from './helpers.js';
import { publishArticle } from './news-pipeline.js';
import { publish, content } from '../delivery/publisher.js';

// ─── Breaking News Scanner ────────────────────────────────────────────────────

export async function scanForBreaking(): Promise<void> {
  try {
    const { scored, fresh } = await getFilteredScoredArticles({
      withSimilarityFilter: false,
      withRecentTitles: true,
      withDedup: true,
    });

    if (fresh.length === 0) return;

    const clusters = clusterByStory(fresh);
    applyClusterBoosts(scored, clusters);

    const fastTrack = scored.find(
      (a) =>
        a.tier === 1 &&
        a.importanceScore > 1.25 &&
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
      if (posted) recordBreakingPost();
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
      // Title-only fallback — post something rather than lose the breaking event
      logger.warn(`⚠️ Breaking summary failed — posting title fallback`);
      await publish({
        telegram: content(`🚨 BREAKING\n\n${article.title}\n\n🔗 ${article.url}`),
        x: isXEnabled() ? content(`⚡ ${article.title}\n${article.url}`) : undefined,
      });
      updateLastPosted();
      metrics.articlesPosted = 1;
      posted = true;
    }
  });

  return posted;
}
