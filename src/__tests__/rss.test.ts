import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FeedConfig } from '../ingestion/feeds.config.js';

const parseURLMock = vi.hoisted(() => vi.fn());
const mockFeeds = vi.hoisted(() => [] as FeedConfig[]);

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('rss-parser', () => ({
  default: class Parser {
    parseURL = parseURLMock;
  },
}));

vi.mock('../ingestion/feeds.config.js', () => ({
  getActiveFeeds: () => mockFeeds,
}));

import { fetchFeeds } from '../ingestion/rss.js';

describe('rss — smoke tests', () => {
  beforeEach(() => {
    mockFeeds.length = 0;
    parseURLMock.mockReset();
  });

  it('filters by age and removes duplicate normalized titles', async () => {
    mockFeeds.push({
      url: 'https://example.com/feed',
      source: 'Example',
      tier: 1,
      authority: 0.9,
      language: 'en',
      specialization: ['macro'],
      maxAgeHours: 1,
      enabled: true,
      healthStatus: 'healthy',
      consecutiveFailures: 0,
    });

    const now = new Date();
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);

    parseURLMock.mockResolvedValue({
      items: [
        { title: 'OpenAI ships GPT-5', link: 'https://a.com/1', pubDate: now.toISOString() },
        { title: 'openai ships gpt-5', link: 'https://a.com/2', pubDate: now.toISOString() },
        { title: 'Old news', link: 'https://a.com/3', pubDate: old.toISOString() },
      ],
    });

    const results = await fetchFeeds();
    expect(results.length).toBe(1);
    expect(results[0]!.title).toBe('OpenAI ships GPT-5');
    expect(mockFeeds[0]!.healthStatus).toBe('healthy');
    expect(mockFeeds[0]!.consecutiveFailures).toBe(0);
  });

  it('increments failures and marks degraded/dead on errors', async () => {
    mockFeeds.push({
      url: 'https://example.com/feed',
      source: 'Example',
      tier: 1,
      authority: 0.9,
      language: 'en',
      specialization: ['macro'],
      maxAgeHours: 12,
      enabled: true,
      healthStatus: 'healthy',
      consecutiveFailures: 2,
    });

    parseURLMock.mockRejectedValue(new Error('boom'));
    await fetchFeeds();
    expect(mockFeeds[0]!.healthStatus).toBe('degraded');
    expect(mockFeeds[0]!.consecutiveFailures).toBe(3);

    mockFeeds[0]!.consecutiveFailures = 9;
    await fetchFeeds();
    expect(mockFeeds[0]!.healthStatus).toBe('dead');
    expect(mockFeeds[0]!.consecutiveFailures).toBe(10);
  });
});
