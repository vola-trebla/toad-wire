// src/orchestration/helpers.ts
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { pipelineRuns } from '../db/schema.js';
import { BLACKLIST } from '../utils/constants.js';
import { type FeedArticle, fetchFeeds } from '../ingestion/rss.js';
import { isDuplicate } from '../ingestion/dedup.js';
import { filterSimilar } from '../ingestion/similarity.js';
import { collectMarketSnapshot } from '../market/market-snapshot.js';
import { scoreArticles, type ScoredArticle } from '../intelligence/scorer.js';
import { getUnusedHeadlines } from './state.js';

// ─── Content Filter ───────────────────────────────────────────────────────────

export function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLACKLIST.some((term) => lower.includes(term));
}

// ─── Pipeline Metrics Wrapper ─────────────────────────────────────────────────

export type PipelineMetrics = {
  articlesFetched?: number;
  articlesFiltered?: number;
  articlesPosted?: number;
  microPostsGenerated?: number;
  flashRpdUsed?: number;
};

export async function withPipelineMetrics(
  type: string,
  fn: (metrics: PipelineMetrics) => Promise<void>,
): Promise<void> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const metrics: PipelineMetrics = {};
  let error: string | undefined;

  try {
    await fn(metrics);
  } catch (err) {
    error = String(err);
    logger.error(`❌ ${type} pipeline error: ${err}`);
  } finally {
    db.insert(pipelineRuns)
      .values({
        type,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        articlesFetched: metrics.articlesFetched ?? 0,
        articlesFiltered: metrics.articlesFiltered ?? 0,
        articlesPosted: metrics.articlesPosted ?? 0,
        microPostsGenerated: metrics.microPostsGenerated ?? 0,
        flashRpdUsed: metrics.flashRpdUsed ?? 0,
        error: error ?? null,
      })
      .run();
  }
}

// ─── Filtered & Scored Articles ───────────────────────────────────────────────

export type GetScoredArticlesOptions = {
  withSimilarityFilter?: boolean; // run filterSimilar() — default: true
  withRecentTitles?: boolean; // pass recentTitles to scoreArticles() — default: false
  withDedup?: boolean; // check isDuplicate() — default: true
};

export type ScoredArticlesResult = {
  scored: ScoredArticle[];
  fresh: FeedArticle[]; // pre-score articles (for setUnusedHeadlines etc.)
  fetchedCount: number;
  filteredCount: number;
};

export async function getFilteredScoredArticles(
  options: GetScoredArticlesOptions = {},
): Promise<ScoredArticlesResult> {
  const { withSimilarityFilter = true, withRecentTitles = false, withDedup = true } = options;

  const allArticles = await fetchFeeds();
  const fetchedCount = allArticles.length;

  const filtered = allArticles.filter((a) => isRelevant(a.title));
  const filteredCount = filtered.length;

  let deduplicated: FeedArticle[] = filtered;
  if (withDedup) {
    deduplicated = [];
    for (const article of filtered) {
      if (await isDuplicate(article.url)) continue;
      deduplicated.push(article);
    }
  }

  const fresh = withSimilarityFilter ? await filterSimilar(deduplicated) : deduplicated;

  const snapshot = await collectMarketSnapshot();
  const recentTitles = withRecentTitles ? getUnusedHeadlines() : undefined;
  const scored = scoreArticles(fresh, snapshot, recentTitles);

  return { scored, fresh, fetchedCount, filteredCount };
}
