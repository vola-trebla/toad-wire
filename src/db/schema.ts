import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
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
