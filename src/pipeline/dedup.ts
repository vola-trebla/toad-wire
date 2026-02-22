import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { type FeedArticle } from '../sources/rss.js';
import { logger } from '../utils/logger.js';

export async function isDuplicate(url: string): Promise<boolean> {
    const existing = await db
        .select()
        .from(articles)
        .where(and(eq(articles.url, url), eq(articles.posted, true)))
        .limit(1);

    return existing.length > 0;
}

export async function saveArticle(article: FeedArticle): Promise<void> {
    await db.insert(articles).values({
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        posted: false,
    });

    logger.info(`💾 Saved: ${article.title}`);
}

export async function markAsPosted(url: string): Promise<void> {
    await db.update(articles).set({ posted: true }).where(eq(articles.url, url));

    logger.info(`✅ Marked as posted: ${url}`);
}
