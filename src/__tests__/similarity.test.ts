import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FeedArticle } from '../ingestion/rss.js';

const mockState = vi.hoisted(() => ({
  posted: [] as Array<{ id: number; title: string; embedding?: string; posted?: boolean }>,
}));

const embedManyMock = vi.hoisted(() =>
  vi.fn(async ({ values }: { values: string[] }) => ({
    embeddings: values.map((_, i) => [i + 1, 0, 0]),
  })),
);

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../db/client.js', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => mockState.posted,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => {},
      }),
    }),
  },
}));

vi.mock('@ai-sdk/google', () => ({
  google: { textEmbedding: vi.fn(() => ({})) },
}));

vi.mock('ai', () => ({
  embedMany: embedManyMock,
}));

import { filterSimilar } from '../ingestion/similarity.js';

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

describe('similarity — smoke tests', () => {
  beforeEach(() => {
    mockState.posted = [];
    embedManyMock.mockClear();
  });

  it('returns candidates when there are no posted articles', async () => {
    const candidates = [makeArticle(), makeArticle()];
    const result = await filterSimilar(candidates);
    expect(result.length).toBe(2);
    expect(embedManyMock).not.toHaveBeenCalled();
  });

  it('filters obvious duplicates via token overlap', async () => {
    mockState.posted = [
      { id: 1, title: 'Bitcoin market update', embedding: JSON.stringify([1, 0, 0]) },
    ];
    const candidates = [makeArticle({ title: 'Bitcoin market update' })];
    const result = await filterSimilar(candidates);
    expect(result.length).toBe(0);
    expect(embedManyMock).not.toHaveBeenCalled();
  });
});
