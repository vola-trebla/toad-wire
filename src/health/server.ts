import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { articles, pipelineRuns } from '../db/schema.js';
import { desc, gte } from 'drizzle-orm';
import { getBudgetStatus } from '../utils/request-budget.js';
import { getPendingCount } from '../queue/micro-posts.js';
import { FEEDS } from '../ingestion/feeds.config.js';

const app = new Hono();

const startTime = Date.now();
let lastPostedAt: string | null = null;

export function updateLastPosted(): void {
  lastPostedAt = new Date().toISOString();
}

app.get('/health', async (c) => {
  const [lastArticle, microPostsPending] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.createdAt)).limit(1),
    getPendingCount('x'),
  ]);

  // ── Feed health (from in-memory FEEDS config) ───────────────────────────
  const enabledFeeds = FEEDS.filter((f) => f.enabled);
  const deadFeeds = enabledFeeds.filter((f) => f.healthStatus === 'dead').map((f) => f.source);
  const degradedFeeds = enabledFeeds
    .filter((f) => f.healthStatus === 'degraded')
    .map((f) => f.source);

  // ── Pipeline metrics (last 24h from DB) ────────────────────────────────
  let postsToday = 0;
  let runsToday = 0;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const runs = await db.select().from(pipelineRuns).where(gte(pipelineRuns.startedAt, since));

    runsToday = runs.length;
    postsToday = runs.reduce((sum, r) => sum + (r.articlesPosted ?? 0), 0);
  } catch {
    // pipeline_runs table might be empty on fresh deploy — graceful fallback
  }

  return c.json({
    status: 'ok',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    last_posted_at: lastPostedAt,
    last_article_in_db: lastArticle[0]?.title ?? null,
    llm_budget: getBudgetStatus(),
    micro_posts_pending: microPostsPending,
    // v2.0 additions
    feeds: {
      total: enabledFeeds.length,
      healthy: enabledFeeds.length - deadFeeds.length - degradedFeeds.length,
      degraded: degradedFeeds.length,
      dead: deadFeeds,
    },
    pipeline_24h: {
      runs: runsToday,
      posts: postsToday,
    },
  });
});

export function startHealthServer(port = 3000): void {
  serve({ fetch: app.fetch, port });
  logger.info(`🏥 Health server running on port ${port}`);
}
