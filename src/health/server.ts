import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from '../utils/logger.js';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { desc } from 'drizzle-orm';

const app = new Hono();

const startTime = Date.now();
let lastPostedAt: string | null = null;

export function updateLastPosted(): void {
  lastPostedAt = new Date().toISOString();
}

app.get('/health', async (c) => {
  const lastArticle = await db.select().from(articles).orderBy(desc(articles.createdAt)).limit(1);

  return c.json({
    status: 'ok',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    last_posted_at: lastPostedAt,
    last_article_in_db: lastArticle[0]?.title ?? null,
  });
});

export function startHealthServer(port = 3000): void {
  serve({ fetch: app.fetch, port });
  logger.info(`🏥 Health server running on port ${port}`);
}
