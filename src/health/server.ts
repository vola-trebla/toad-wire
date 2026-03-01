import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { articles, pipelineRuns } from '../db/schema.js';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { getBudgetStatus } from '../utils/request-budget.js';
import { getPendingCount } from '../queue/micro-posts.js';
import { FEEDS } from '../ingestion/feeds.config.js';

const app = new Hono();
const adminToken = process.env.ADMIN_API_TOKEN?.trim();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET'],
    allowHeaders: ['Content-Type', 'x-admin-token', 'authorization'],
  }),
);

function isAuthorized(headerValue?: string | null): boolean {
  if (!adminToken) return true;
  if (!headerValue) return false;
  const token = headerValue.startsWith('Bearer ') ? headerValue.slice(7) : headerValue;
  return token === adminToken;
}

const startTime = Date.now();
let lastPostedAt: string | null = null;

export function updateLastPosted(): void {
  lastPostedAt = new Date().toISOString();
}

app.get('/health', async (c) => {
  const tokenHeader = c.req.header('x-admin-token') ?? c.req.header('authorization');
  if (!isAuthorized(tokenHeader)) {
    return c.json({ status: 'unauthorized' }, 401);
  }

  const [lastArticle, microPostsPending, articlesPending] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.createdAt)).limit(1),
    getPendingCount('x'),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.posted, false)),
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
    articles_pending: articlesPending[0]?.count ?? 0,
    total_posts_pending: (articlesPending[0]?.count ?? 0) + microPostsPending,
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

app.get('/metrics', async (c) => {
  const tokenHeader = c.req.header('x-admin-token') ?? c.req.header('authorization');
  if (!isAuthorized(tokenHeader)) {
    return c.json({ status: 'unauthorized', since: new Date().toISOString() }, 401);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [runs24h, recentRuns] = await Promise.all([
      db.select().from(pipelineRuns).where(gte(pipelineRuns.startedAt, since)),
      db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(20),
    ]);

    const totals = runs24h.reduce(
      (acc, run) => {
        acc.runs += 1;
        acc.posts += run.articlesPosted ?? 0;
        acc.articlesFetched += run.articlesFetched ?? 0;
        acc.articlesFiltered += run.articlesFiltered ?? 0;
        acc.microPostsGenerated += run.microPostsGenerated ?? 0;
        if (run.error) acc.errors += 1;
        if (run.durationMs != null) {
          acc.durationSum += run.durationMs;
          acc.durationCount += 1;
        }
        return acc;
      },
      {
        runs: 0,
        posts: 0,
        articlesFetched: 0,
        articlesFiltered: 0,
        microPostsGenerated: 0,
        errors: 0,
        durationSum: 0,
        durationCount: 0,
      },
    );

    const avgDuration =
      totals.durationCount > 0 ? Math.round(totals.durationSum / totals.durationCount) : null;

    return c.json({
      status: 'ok',
      since,
      summary: {
        runs: totals.runs,
        posts: totals.posts,
        avg_duration_ms: avgDuration,
        articles_fetched: totals.articlesFetched,
        articles_filtered: totals.articlesFiltered,
        micro_posts_generated: totals.microPostsGenerated,
        errors: totals.errors,
      },
      recent_runs: recentRuns.map((run) => ({
        id: run.id,
        type: run.type,
        started_at: run.startedAt,
        completed_at: run.completedAt ?? null,
        duration_ms: run.durationMs ?? null,
        articles_fetched: run.articlesFetched ?? null,
        articles_filtered: run.articlesFiltered ?? null,
        articles_posted: run.articlesPosted ?? null,
        micro_posts_generated: run.microPostsGenerated ?? null,
        error: run.error ?? null,
      })),
    });
  } catch (error) {
    logger.warn({ err: error }, 'metrics endpoint failed');
    return c.json({
      status: 'error',
      since,
      summary: {
        runs: 0,
        posts: 0,
        avg_duration_ms: null,
        articles_fetched: 0,
        articles_filtered: 0,
        micro_posts_generated: 0,
        errors: 0,
      },
      recent_runs: [],
    });
  }
});

export function startHealthServer(port = 3000): void {
  serve({ fetch: app.fetch, port });
  logger.info(`🏥 Health server running on port ${port}`);
}
