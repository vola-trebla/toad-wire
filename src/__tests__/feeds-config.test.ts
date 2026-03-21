import { describe, it, expect } from 'vitest';
import { FEEDS, getActiveFeeds, getFeedConfig } from '../ingestion/feeds.config.js';
import type { FeedConfig } from '../ingestion/feeds.config.js';

describe('feeds.config — smoke tests', () => {
  it('exports non-empty FEEDS array', () => {
    expect(FEEDS).toBeInstanceOf(Array);
    expect(FEEDS.length).toBeGreaterThan(0);
  });

  it('each feed has required fields', () => {
    const required: (keyof FeedConfig)[] = [
      'url',
      'source',
      'tier',
      'authority',
      'language',
      'specialization',
      'maxAgeHours',
      'enabled',
      'healthStatus',
      'consecutiveFailures',
    ];
    for (const feed of FEEDS) {
      for (const key of required) {
        expect(feed).toHaveProperty(key);
      }
      expect([1, 2, 3]).toContain(feed.tier);
      expect(feed.authority).toBeGreaterThanOrEqual(0);
      expect(feed.authority).toBeLessThanOrEqual(1);
    }
  });

  it('getActiveFeeds returns enabled non-dead feeds', () => {
    const active = getActiveFeeds();
    expect(active.length).toBeGreaterThanOrEqual(0);
    expect(active.every((f) => f.enabled && f.healthStatus !== 'dead')).toBe(true);
  });

  it('getFeedConfig finds feed by source name', () => {
    const first = FEEDS[0]!;
    const found = getFeedConfig(first.source);
    expect(found).toBeDefined();
    expect(found?.source).toBe(first.source);
  });

  it('all feed URLs are valid', () => {
    for (const feed of FEEDS) {
      expect(() => new URL(feed.url)).not.toThrow();
    }
  });

  it('no duplicate feed URLs', () => {
    const urls = FEEDS.map((f) => f.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('no duplicate source names', () => {
    const sources = FEEDS.map((f) => f.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('all feeds use English language', () => {
    for (const feed of FEEDS) {
      expect(feed.language).toBe('en');
    }
  });
});
