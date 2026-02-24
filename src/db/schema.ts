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
