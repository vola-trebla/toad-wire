import { describe, it, expect } from 'vitest';
import { scoreArticles } from '../intelligence/scorer.js';
import type { FeedArticle } from '../ingestion/rss.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Generic crypto news',
    url: 'https://example.com/news',
    source: 'CoinDesk',
    publishedAt: new Date().toISOString(),
    tier: 1,
    authority: 0.95,
    language: 'en',
    specialization: ['institutional'],
    ...overrides,
  };
}

function scoreOne(article: FeedArticle, recentTitles: string[] = []) {
  return scoreArticles([article], undefined, recentTitles)[0]!;
}

describe('scorer — spam penalties', () => {
  it('applies no penalty to clean title', () => {
    const result = scoreOne(makeArticle({ title: 'Bitcoin ETF approved by SEC' }));
    expect(result.scoreBreakdown.spamPenalty).toBe(0);
  });

  it('penalises sponsored content heavily', () => {
    const result = scoreOne(makeArticle({ title: 'Sponsored: Buy this token now' }));
    expect(result.scoreBreakdown.spamPenalty).toBe(0.5);
  });

  it('penalises price predictions', () => {
    const result = scoreOne(makeArticle({ title: 'Bitcoin price prediction: will reach $200K' }));
    expect(result.scoreBreakdown.spamPenalty).toBeGreaterThan(0.1);
  });

  it('penalises listicles', () => {
    const result = scoreOne(makeArticle({ title: 'Top 10 reasons to buy crypto now' }));
    expect(result.scoreBreakdown.spamPenalty).toBeGreaterThan(0);
  });

  it('caps spam penalty at 0.5', () => {
    const result = scoreOne(
      makeArticle({ title: 'Sponsored: Top 10 price predictions — will reach moon?' }),
    );
    expect(result.scoreBreakdown.spamPenalty).toBe(0.5);
  });
});

describe('scorer — duplicate penalties', () => {
  it('applies no penalty when no recent titles', () => {
    const result = scoreOne(makeArticle({ title: 'Bitcoin ETF approved by SEC' }), []);
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0);
  });

  it('applies -0.15 for one similar recent title', () => {
    const result = scoreOne(makeArticle({ title: 'Bitcoin ETF approved by SEC regulators' }), [
      'Bitcoin ETF approved by SEC today',
    ]);
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0.15);
  });

  it('applies -0.30 for two or more similar recent titles', () => {
    const result = scoreOne(
      makeArticle({ title: 'Bitcoin ETF approved by SEC regulators today' }),
      [
        'Bitcoin ETF approved by SEC regulators yesterday',
        'Bitcoin ETF approved by SEC regulators this week',
      ],
    );
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0.3);
  });

  it('applies no penalty for unrelated recent titles', () => {
    const result = scoreOne(makeArticle({ title: 'Bitcoin ETF approved by SEC' }), [
      'Solana network upgrade deployed successfully',
      'Ethereum gas fees drop to yearly low',
    ]);
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0);
  });
});
