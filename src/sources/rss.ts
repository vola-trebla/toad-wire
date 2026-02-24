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
    { url: 'https://www.dlnews.com/arc/outboundfeeds/rss/', source: 'DL News' },
    { url: 'https://cryptobriefing.com/feed/', source: 'CryptoBriefing' },
    { url: 'https://blockworks.co/feed', source: 'Blockworks' },
    { url: 'https://finbold.com/feed/', source: 'Finbold' },
    { url: 'https://beincrypto.com/feed/', source: 'BeInCrypto' },
];

// --- utility to remove duplicates ---
function normalizeTitle(t: string): string {
    return t
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function fetchFeeds(): Promise<FeedArticle[]> {
    const results: FeedArticle[] = [];
    const seenTitles = new Set<string>();

    const now = Date.now();
    const MAX_HOURS = 12;

    for (const feed of FEEDS) {
        try {
            const parsed = await parser.parseURL(feed.url);

            for (const item of parsed.items) {
                if (!item.title || !item.link) continue;

                const pub = item.pubDate ? new Date(item.pubDate) : new Date();

                // ⏳ filter: max 12 hours old
                const ageHours = (now - pub.getTime()) / 36e5;
                if (ageHours > MAX_HOURS) continue;

                // 🧹 remove literal duplicates
                const norm = normalizeTitle(item.title);
                if (seenTitles.has(norm)) continue;
                seenTitles.add(norm);

                results.push({
                    title: item.title.trim(),
                    url: item.link,
                    source: feed.source,
                    publishedAt: pub.toISOString(),
                });
            }

            logger.info(`✅ Fetched ${parsed.items.length} articles from ${feed.source}`);
        } catch (error) {
            logger.error(`❌ Failed to fetch ${feed.source}: ${error}`);
        }
    }

    // sort by time DESC (most recent → top)
    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // diversify by interleaving sources
    const bySource = new Map<string, FeedArticle[]>();
    for (const a of results) {
        if (!bySource.has(a.source)) bySource.set(a.source, []);
        bySource.get(a.source)!.push(a);
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
