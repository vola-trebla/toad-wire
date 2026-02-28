import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  url: text('url').notNull().unique(),
  source: text('source').notNull(),
  publishedAt: text('published_at').notNull(),
  posted: integer('posted', { mode: 'boolean' }).default(false),
  embedding: text('embedding'), // JSON-serialized number[]
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  // v2.0 fields
  tier: integer('tier'), // 1 | 2 | 3
  authority: real('authority'), // 0.0–1.0
  category: text('category'), // from summarize output
  sentiment: text('sentiment'), // bullish | bearish | neutral
  importanceScore: real('importance_score'), // calculated Impact Score
  tweet: text('tweet'), // X-ready version
  clusterId: text('cluster_id'), // story cluster reference
});

export const microPosts = sqliteTable('micro_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  hashtags: text('hashtags').notNull(), // JSON array as string
  mood: text('mood').notNull(),
  batchType: text('batch_type').notNull(), // 'market_vibe' | 'raw_headlines' | 'philosophy'
  channel: text('channel').notNull().default('x'),
  posted: integer('posted', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// v2.0 — Feed health tracking
export const feedHealth = sqliteTable('feed_health', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull().unique(),
  url: text('url').notNull(),
  tier: integer('tier').notNull(),
  authority: real('authority').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  healthStatus: text('health_status').default('healthy'), // healthy | degraded | dead
  consecutiveFailures: integer('consecutive_failures').default(0),
  lastSuccessfulFetch: text('last_successful_fetch'),
  totalFetches: integer('total_fetches').default(0),
  totalArticles: integer('total_articles').default(0),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// v2.0 — Pipeline run metrics
export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'news' | 'batch' | 'morning' | 'evening' | 'breaking'
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  articlesFetched: integer('articles_fetched').default(0),
  articlesFiltered: integer('articles_filtered').default(0),
  articlesPosted: integer('articles_posted').default(0),
  microPostsGenerated: integer('micro_posts_generated').default(0),
  flashRpdUsed: integer('flash_rpd_used').default(0),
  flashLiteRpdUsed: integer('flash_lite_rpd_used').default(0),
  durationMs: integer('duration_ms'),
  error: text('error'),
});
