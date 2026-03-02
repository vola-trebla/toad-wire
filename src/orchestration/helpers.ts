// src/orchestration/helpers.ts
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { pipelineRuns } from '../db/schema.js';
import { BLACKLIST } from '../utils/constants.js';

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
