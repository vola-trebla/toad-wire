import { describe, it, expect } from 'vitest';
import { scoreArticles, getScoreTier, SCORE_THRESHOLDS } from '../intelligence/scorer.js';
import type { FeedArticle } from '../ingestion/rss.js';
import type { NewsContext } from '../context/news-context.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'OpenAI releases new model update',
    url: `https://example.com/${Math.random()}`,
    source: 'TestSource',
    publishedAt: new Date().toISOString(),
    tier: 2,
    authority: 0.6,
    language: 'en',
    specialization: ['macro'],
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<NewsContext> = {}): NewsContext {
  return {
    unusedHeadlines: [],
    timeOfDay: 'morning',
    ...overrides,
  };
}

describe('scorer — smoke tests', () => {
  it('applies authority and freshness to importance score', () => {
    const fresh = makeArticle({ authority: 0.9, publishedAt: new Date().toISOString() });
    const old = makeArticle({
      authority: 0.9,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    const scored = scoreArticles([old, fresh]);
    expect(scored.length).toBe(2);
    const freshScored = scored[0]!;
    const oldScored = scored[1]!;
    expect(freshScored.scoreBreakdown.authority).toBe(0.9);
    expect(freshScored.scoreBreakdown.freshness).toBeGreaterThan(
      oldScored.scoreBreakdown.freshness,
    );
  });

  it('adds keyword and context boosts when patterns match', () => {
    const article = makeArticle({
      title: 'OpenAI announces breakthrough model launch today',
    });
    const snapshot = makeSnapshot({
      timeOfDay: 'morning',
    });

    const scored = scoreArticles([article], snapshot);
    expect(scored.length).toBe(1);
    expect(scored[0]!.scoreBreakdown.keywordBoost).toBeGreaterThan(0);
    expect(scored[0]!.scoreBreakdown.contextBoost).toBeGreaterThan(0);
  });

  it('applies duplicate and spam penalties when applicable', () => {
    const article = makeArticle({
      title: 'Top 5 AI productivity tools? Could they replace your job?',
    });
    const recentTitles = ['Top 5 AI productivity tools could they replace your job'];

    const scored = scoreArticles([article], undefined, recentTitles);
    expect(scored.length).toBe(1);
    expect(scored[0]!.scoreBreakdown.duplicatePenalty).toBeGreaterThan(0);
    expect(scored[0]!.scoreBreakdown.spamPenalty).toBeGreaterThan(0);
  });

  it('applies velocity boost when many articles in same time window', () => {
    const now = new Date();
    // 9 articles in a 2h window = 3x baseline → storm boost
    const storm = Array.from({ length: 9 }, (_, i) =>
      makeArticle({
        title: `News story ${i}`,
        url: `https://example.com/storm-${i}`,
        publishedAt: new Date(now.getTime() - i * 5 * 60 * 1000).toISOString(),
      }),
    );

    const scored = scoreArticles(storm);
    expect(scored[0]!.scoreBreakdown.velocityBoost).toBe(0.2);
  });

  it('applies no velocity boost for sparse articles', () => {
    const scored = scoreArticles([makeArticle()]);
    expect(scored[0]!.scoreBreakdown.velocityBoost).toBe(0);
  });

  it('maps score to tiers correctly', () => {
    expect(getScoreTier(SCORE_THRESHOLDS.BREAKING + 0.01)).toBe('breaking');
    expect(getScoreTier(SCORE_THRESHOLDS.TOP)).toBe('top');
    expect(getScoreTier(SCORE_THRESHOLDS.NORMAL)).toBe('normal');
    expect(getScoreTier(SCORE_THRESHOLDS.SECONDARY)).toBe('secondary');
    expect(getScoreTier(0.01)).toBe('noise');
  });
});
