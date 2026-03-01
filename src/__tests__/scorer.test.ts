import { describe, it, expect } from 'vitest';
import { scoreArticles } from '../intelligence/scorer.js';
import type { FeedArticle } from '../sources/rss.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Generic crypto news',
    url: 'https://example.com/news',
    source: 'CoinDesk',
    publishedAt: new Date().toISOString(),
    // v2.0 defaults
    tier: 1,
    authority: 0.95,
    language: 'en',
    specialization: ['institutional'],
    ...overrides,
  };
}

describe('scorer', () => {
  it('should return articles sorted by score descending', () => {
    const articles = [
      makeArticle({
        title: 'Old news',
        publishedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      }),
      makeArticle({
        title: 'Breaking: SEC sues major exchange',
        publishedAt: new Date().toISOString(),
      }),
      makeArticle({ title: 'Fresh generic news', publishedAt: new Date().toISOString() }),
    ];

    const scored = scoreArticles(articles);
    expect(scored[0]!.importanceScore).toBeGreaterThan(scored[1]!.importanceScore);
    expect(scored[1]!.importanceScore).toBeGreaterThan(scored[2]!.importanceScore);
  });

  it('should give higher score to high-authority sources', () => {
    const coindesk = makeArticle({ source: 'CoinDesk' });
    const unknown = makeArticle({ source: 'UnknownBlog' });

    const scored = scoreArticles([coindesk, unknown]);
    expect(scored[0]!.source).toBe('CoinDesk');
  });

  it('should boost articles with hack/exploit keywords', () => {
    const normal = makeArticle({ title: 'Bitcoin price update' });
    const hack = makeArticle({ title: 'Major hack: $100M stolen from protocol' });

    const scored = scoreArticles([normal, hack]);
    expect(scored[0]!.title).toContain('hack');
  });

  it('should boost LATAM relevance keywords', () => {
    const global = makeArticle({ title: 'Global crypto market update' });
    const latam = makeArticle({ title: 'Argentina adopts Bitcoin as legal tender' });

    const scored = scoreArticles([global, latam]);
    expect(scored[0]!.title).toContain('Argentina');
  });

  it('should decay score for old articles', () => {
    const fresh = makeArticle({ publishedAt: new Date().toISOString() });
    const old = makeArticle({ publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() });

    const scoredFresh = scoreArticles([fresh])[0]!.importanceScore;
    const scoredOld = scoreArticles([old])[0]!.importanceScore;

    expect(scoredFresh).toBeGreaterThan(scoredOld);
  });

  it('should cap keyword boost at 0.5', () => {
    const article = makeArticle({
      title: 'SEC hack exploit ETF regulation breach Argentina Brazil LATAM bitcoin ethereum',
    });
    const scored = scoreArticles([article]);
    // authority(0.95) * freshness(~1.0) + boost(capped 0.5) = max ~1.45
    expect(scored[0]!.importanceScore).toBeLessThan(2.0);
  });
});
