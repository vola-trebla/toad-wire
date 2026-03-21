import { describe, it, expect } from 'vitest';
import { scoreArticles, getScoreTier, SCORE_THRESHOLDS } from '../intelligence/scorer.js';
import type { FeedArticle } from '../ingestion/rss.js';
import type { MarketSnapshot } from '../market/market-snapshot.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Bitcoin market update',
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

function makeSnapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    prices: [],
    fearGreed: null,
    unusedHeadlines: [],
    marketMood: 'extreme_fear',
    timeOfDay: 'morning',
    volatilityAlerts: [],
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
      marketMood: 'neutral',
      timeOfDay: 'morning',
      volatilityAlerts: [],
    });

    const scored = scoreArticles([article], snapshot);
    expect(scored.length).toBe(1);
    expect(scored[0]!.scoreBreakdown.keywordBoost).toBeGreaterThan(0);
    expect(scored[0]!.scoreBreakdown.contextBoost).toBeGreaterThan(0);
  });

  it('applies duplicate and spam penalties when applicable', () => {
    const article = makeArticle({
      title: 'Top 5 Bitcoin price prediction? Could BTC reach $1M?',
    });
    const recentTitles = ['Top 5 Bitcoin price prediction could BTC reach $1M'];

    const scored = scoreArticles([article], undefined, recentTitles);
    expect(scored.length).toBe(1);
    expect(scored[0]!.scoreBreakdown.duplicatePenalty).toBeGreaterThan(0);
    expect(scored[0]!.scoreBreakdown.spamPenalty).toBeGreaterThan(0);
  });

  it('maps score to tiers correctly', () => {
    expect(getScoreTier(SCORE_THRESHOLDS.BREAKING + 0.01)).toBe('breaking');
    expect(getScoreTier(SCORE_THRESHOLDS.TOP)).toBe('top');
    expect(getScoreTier(SCORE_THRESHOLDS.NORMAL)).toBe('normal');
    expect(getScoreTier(SCORE_THRESHOLDS.SECONDARY)).toBe('secondary');
    expect(getScoreTier(0.01)).toBe('noise');
  });
});
