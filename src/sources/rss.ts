import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';
import { getActiveFeeds } from './feeds.config.js';

export interface FeedArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  // v2.0 — propagated from FeedConfig
  tier: 1 | 2 | 3;
  authority: number;
  language: 'en' | 'es' | 'pt';
  specialization: string[];
}

const parser = new Parser();

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

  for (const feed of getActiveFeeds()) {
    try {
      const parsed = await parser.parseURL(feed.url);
      let fetched = 0;

      for (const item of parsed.items) {
        if (!item.title || !item.link) continue;

        const pub = item.pubDate ? new Date(item.pubDate) : new Date();
        const ageHours = (now - pub.getTime()) / 36e5;

        // Age filter from config (replaces hardcoded 12h)
        if (ageHours > feed.maxAgeHours) continue;

        const norm = normalizeTitle(item.title);
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);

        results.push({
          title: item.title.trim(),
          url: item.link,
          source: feed.source,
          publishedAt: pub.toISOString(),
          // v2.0 fields from config
          tier: feed.tier,
          authority: feed.authority,
          language: feed.language,
          specialization: feed.specialization,
        });

        fetched++;
      }

      // Update health state in memory
      feed.consecutiveFailures = 0;
      feed.healthStatus = 'healthy';
      feed.lastSuccessfulFetch = new Date().toISOString();

      logger.info(`✅ Fetched ${fetched} articles from ${feed.source} [tier ${feed.tier}]`);
    } catch (error) {
      feed.consecutiveFailures++;
      if (feed.consecutiveFailures >= 3) feed.healthStatus = 'degraded';
      if (feed.consecutiveFailures >= 10) feed.healthStatus = 'dead';
      logger.warn(`⚠️ Feed ${feed.source} fail #${feed.consecutiveFailures}: ${error}`);
    }
  }

  // Sort by time DESC
  results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Interleave by source for diversity
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
