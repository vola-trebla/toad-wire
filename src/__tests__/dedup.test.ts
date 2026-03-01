import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FeedArticle } from '../ingestion/rss.js';

const mockState = vi.hoisted(() => ({
  selectResult: [] as unknown[],
  inserted: [] as Record<string, unknown>[],
  updated: [] as Record<string, unknown>[],
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../db/client.js', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockState.selectResult,
        }),
      }),
    }),
    insert: () => ({
      values: (val: Record<string, unknown>) => {
        mockState.inserted.push(val);
      },
    }),
    update: () => ({
      set: (val: Record<string, unknown>) => ({
        where: () => {
          mockState.updated.push(val);
        },
      }),
    }),
  },
}));

import { isDuplicate, saveArticle, markAsPosted } from '../ingestion/dedup.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'Bitcoin market update',
    url: 'https://example.com/1',
    source: 'TestSource',
    publishedAt: new Date().toISOString(),
    tier: 2,
    authority: 0.6,
    language: 'en',
    specialization: ['macro'],
    ...overrides,
  };
}

describe('dedup — smoke tests', () => {
  beforeEach(() => {
    mockState.selectResult = [];
    mockState.inserted = [];
    mockState.updated = [];
  });

  it('returns false when no duplicate exists', async () => {
    const result = await isDuplicate('https://example.com/x');
    expect(result).toBe(false);
  });

  it('returns true when duplicate exists', async () => {
    mockState.selectResult = [{}];
    const result = await isDuplicate('https://example.com/x');
    expect(result).toBe(true);
  });

  it('saves article with expected fields', async () => {
    const article = makeArticle();
    await saveArticle(article, [1, 2, 3]);
    expect(mockState.inserted.length).toBe(1);
    expect(mockState.inserted[0]!).toMatchObject({
      title: article.title,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
      posted: false,
    });
  });

  it('marks article as posted', async () => {
    await markAsPosted('https://example.com/x');
    expect(mockState.updated.length).toBe(1);
    expect(mockState.updated[0]!).toMatchObject({ posted: true });
  });
});
