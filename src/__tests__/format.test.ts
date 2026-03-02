import { describe, it, expect } from 'vitest';
import { formatPostTelegram, formatPostX } from '../content/format.js';
import type { Summary } from '../content/summarize.js';
import type { FeedArticle } from '../ingestion/rss.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Bitcoin ETF approved',
    url: 'https://example.com/1',
    source: 'CoinDesk',
    publishedAt: new Date().toISOString(),
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['macro'],
    ...overrides,
  };
}

function makeSummary(overrides: Partial<Summary> = {}): Summary {
  return {
    title: 'SEC approves spot Bitcoin ETF',
    summary: 'Regulators greenlight first spot BTC ETF.',
    thought: 'Histórico.',
    tags: ['#BTC', '#ETF', '#crypto'],
    sentiment: 'bullish',
    emoji: '🟢',
    category: 'regulacion',
    tweet: 'SEC approves spot Bitcoin ETF',
    entities: { companies: [], people: [], assets: [], protocols: [], regulators: [] },
    ...overrides,
  };
}

describe('format — smoke tests', () => {
  it('formatPostTelegram includes sentiment, category, title and source', () => {
    const article = makeArticle();
    const summary = makeSummary();
    const result = formatPostTelegram(article, summary);
    expect(result).toContain('Bullish');
    expect(result).toContain('Regulación');
    expect(result).toContain(summary.title);
    expect(result).toContain(article.source);
    expect(result).toContain(article.url);
    expect(result).toContain(summary.summary);
  });

  it('formatPostX includes core fields without markdown links', () => {
    const article = makeArticle();
    const summary = makeSummary();
    const result = formatPostX(article, summary);
    expect(result).toContain('Bullish');
    expect(result).toContain(summary.title);
    expect(result).toContain(article.source);
    expect(result).toContain(summary.summary);
  });
});
