import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';

export interface FeedArticle {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
}

const parser = new Parser();

const FEEDS = [
    { url: 'https://coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { url: 'https://decrypt.co/feed', source: 'Decrypt' },
    { url: 'https://theblock.co/rss.xml', source: 'The Block' },
];

export async function fetchFeeds(): Promise<FeedArticle[]> {
    const results: FeedArticle[] = [];

    for (const feed of FEEDS) {
        try {
            const parsed = await parser.parseURL(feed.url);

            for (const item of parsed.items) {
                if (!item.title || !item.link) continue;

                results.push({
                    title: item.title,
                    url: item.link,
                    source: feed.source,
                    publishedAt: item.pubDate ?? new Date().toISOString(),
                });
            }

            logger.info(`✅ Fetched ${parsed.items.length} articles from ${feed.source}`);
        } catch (error) {
            logger.error(`❌ Failed to fetch ${feed.source}: ${error}`);
        }
    }

    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const bySource = new Map<string, FeedArticle[]>();
    for (const article of results) {
        if (!bySource.has(article.source)) bySource.set(article.source, []);
        bySource.get(article.source)!.push(article);
    }

    const diverse: FeedArticle[] = [];
    const sources = Array.from(bySource.values());
    const maxLen = Math.max(...sources.map((s) => s.length));

    for (let i = 0; i < maxLen; i++) {
        for (const sourceArticles of sources) {
            if (sourceArticles[i]) diverse.push(sourceArticles[i]!);
        }
    }

    return diverse;
}
