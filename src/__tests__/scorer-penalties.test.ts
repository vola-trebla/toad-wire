import { describe, it, expect } from 'vitest';
import { scoreArticles } from '../intelligence/scorer.js';
import type { FeedArticle } from '../ingestion/rss.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Generic AI industry news',
    url: 'https://example.com/news',
    source: 'TechCrunch',
    publishedAt: new Date().toISOString(),
    tier: 1,
    authority: 0.95,
    language: 'en',
    specialization: ['industry'],
    ...overrides,
  };
}

function scoreOne(article: FeedArticle, recentTitles: string[] = []) {
  return scoreArticles([article], undefined, recentTitles)[0]!;
}

describe('scorer — spam penalties', () => {
  it('applies no penalty to clean title', () => {
    const result = scoreOne(
      makeArticle({ title: 'OpenAI releases GPT-5 with reasoning upgrades' }),
    );
    expect(result.scoreBreakdown.spamPenalty).toBe(0);
  });

  it('penalises sponsored content heavily', () => {
    const result = scoreOne(makeArticle({ title: 'Sponsored: Try this AI tool now' }));
    expect(result.scoreBreakdown.spamPenalty).toBe(0.5);
  });

  it('penalises AI spam content', () => {
    const result = scoreOne(makeArticle({ title: 'Make money with AI: passive income guide' }));
    expect(result.scoreBreakdown.spamPenalty).toBeGreaterThan(0.1);
  });

  it('penalises listicles', () => {
    const result = scoreOne(
      makeArticle({ title: 'Top 10 AI tools to boost your productivity now' }),
    );
    expect(result.scoreBreakdown.spamPenalty).toBeGreaterThan(0);
  });

  it('caps spam penalty at 0.5', () => {
    const result = scoreOne(
      makeArticle({ title: 'Sponsored: Top 10 AI predictions — could AGI arrive soon?' }),
    );
    expect(result.scoreBreakdown.spamPenalty).toBe(0.5);
  });
});

describe('scorer — duplicate penalties', () => {
  it('applies no penalty when no recent titles', () => {
    const result = scoreOne(
      makeArticle({ title: 'Anthropic publishes new safety research paper' }),
      [],
    );
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0);
  });

  it('applies -0.15 for one similar recent title', () => {
    const result = scoreOne(
      makeArticle({ title: 'Anthropic publishes new safety research paper today' }),
      ['Anthropic publishes new safety research paper'],
    );
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0.15);
  });

  it('applies -0.30 for two or more similar recent titles', () => {
    const result = scoreOne(
      makeArticle({ title: 'Anthropic publishes new safety research paper today' }),
      [
        'Anthropic publishes new safety research paper yesterday',
        'Anthropic publishes new safety research paper this week',
      ],
    );
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0.3);
  });

  it('applies no penalty for unrelated recent titles', () => {
    const result = scoreOne(
      makeArticle({ title: 'Anthropic publishes new safety research paper' }),
      [
        'Google DeepMind announces protein folding breakthrough',
        'EU passes comprehensive AI regulation framework',
      ],
    );
    expect(result.scoreBreakdown.duplicatePenalty).toBe(0);
  });
});
