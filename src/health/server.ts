import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { desc } from 'drizzle-orm';
import { getBudgetStatus } from '../utils/request-budget.js';
import { getPendingCount } from '../queue/micro-posts.js';

const app = new Hono();

const startTime = Date.now();
let lastPostedAt: string | null = null;

export function updateLastPosted(): void {
  lastPostedAt = new Date().toISOString();
}

app.get('/health', async (c) => {
  const lastArticle = await db.select().from(articles).orderBy(desc(articles.createdAt)).limit(1);
  const microPostsPending = await getPendingCount('x');

  return c.json({
    status: 'ok',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    last_posted_at: lastPostedAt,
    last_article_in_db: lastArticle[0]?.title ?? null,
    llm_budget: getBudgetStatus(),
    micro_posts_pending: microPostsPending,
  });
});

export function startHealthServer(port = 3000): void {
  serve({ fetch: app.fetch, port });
  logger.info(`🏥 Health server running on port ${port}`);
}
