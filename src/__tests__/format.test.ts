import { describe, it, expect } from 'vitest';
import { formatPostTelegram, formatPostX } from '../content/format.js';
import type { Summary } from '../content/summarize.js';
import type { FeedArticle } from '../ingestion/rss.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'OpenAI releases GPT-5',
    url: 'https://example.com/1',
    source: 'The Verge AI',
    publishedAt: new Date().toISOString(),
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['product'],
    ...overrides,
  };
}

function makeSummary(overrides: Partial<Summary> = {}): Summary {
  return {
    title: 'OpenAI ships GPT-5 with native reasoning',
    summary: 'OpenAI released GPT-5 with multimodal reasoning capabilities.',
    thought: 'The frontier keeps moving.',
    tags: ['#GPT5', '#OpenAI', '#AI'],
    sentiment: 'bullish',
    emoji: '🧪',
    category: 'product',
    tweet: 'OpenAI ships GPT-5 with native reasoning',
    entities: { companies: [], people: [], assets: [], protocols: [], regulators: [] },
    ...overrides,
  };
}

describe('format — smoke tests', () => {
  it('formatPostTelegram includes sentiment, category, title and source', () => {
    const article = makeArticle();
    const summary = makeSummary();
    const result = formatPostTelegram(article, summary);
    expect(result).toContain('Optimistic');
    expect(result).toContain('Product');
    expect(result).toContain(summary.title);
    expect(result).toContain(article.source);
    expect(result).toContain(article.url);
    expect(result).toContain(summary.summary);
  });

  it('formatPostX includes core fields without markdown links', () => {
    const article = makeArticle();
    const summary = makeSummary();
    const result = formatPostX(article, summary);
    expect(result).toContain('Optimistic');
    expect(result).toContain(summary.title);
    expect(result).toContain(article.source);
    expect(result).toContain(summary.summary);
  });
});
