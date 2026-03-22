import { describe, it, expect } from 'vitest';
import {
  clusterByStory,
  applyClusterBoosts,
  findCluster,
  BREAKING_CLUSTER_BOOST,
} from '../intelligence/story-cluster.js';
import type { FeedArticle } from '../ingestion/rss.js';
import type { ScoredArticle } from '../intelligence/scorer.js';

function makeArticle(overrides: Partial<FeedArticle> = {}): FeedArticle {
  return {
    title: 'EU passes comprehensive AI regulation framework',
    url: `https://example.com/${Math.random()}`,
    source: 'TestSource',
    publishedAt: new Date().toISOString(),
    tier: 2,
    authority: 0.7,
    language: 'en',
    specialization: ['policy'],
    ...overrides,
  };
}

describe('story-cluster — smoke tests', () => {
  it('clusters similar titles and flags breaking by source count', () => {
    const articles = [
      makeArticle({
        source: 'A',
        title: 'EU passes comprehensive AI regulation framework today',
        tier: 2,
      }),
      makeArticle({
        source: 'B',
        title: 'EU comprehensive AI regulation framework passes today',
        tier: 2,
      }),
      makeArticle({
        source: 'C',
        title: 'Comprehensive AI regulation framework passes in EU',
        tier: 2,
      }),
    ];

    const clusters = clusterByStory(articles);
    expect(clusters.length).toBe(1);
    expect(clusters[0]!.sourceCount).toBe(3);
    expect(clusters[0]!.isBreaking).toBe(true);
  });

  it('flags breaking when two Tier-1 sources match', () => {
    const articles = [
      makeArticle({ source: 'Tier1-A', title: 'OpenAI faces major safety lawsuit', tier: 1 }),
      makeArticle({
        source: 'Tier1-B',
        title: 'Major safety lawsuit filed against OpenAI',
        tier: 1,
      }),
    ];

    const clusters = clusterByStory(articles);
    expect(clusters.length).toBe(1);
    expect(clusters[0]!.tierOneCount).toBe(2);
    expect(clusters[0]!.isBreaking).toBe(true);
  });

  it('keeps single article cluster as non-breaking', () => {
    const clusters = clusterByStory([makeArticle()]);
    expect(clusters.length).toBe(1);
    expect(clusters[0]!.isBreaking).toBe(false);
  });

  it('applies breaking boost to representative article', () => {
    const rep = makeArticle({ url: 'https://example.com/rep' });
    const clusters = clusterByStory([
      rep,
      makeArticle({ source: 'B', title: rep.title, tier: 2 }),
      makeArticle({ source: 'C', title: rep.title, tier: 2 }),
    ]);

    const scored: ScoredArticle[] = [
      {
        ...rep,
        importanceScore: 1,
        scoreBreakdown: {
          authority: 0.7,
          freshness: 1,
          keywordBoost: 0,
          contextBoost: 0,
          velocityBoost: 0,
          duplicatePenalty: 0,
          spamPenalty: 0,
        },
      },
    ];

    applyClusterBoosts(scored, clusters);
    expect(scored[0]!.importanceScore).toBe(1 + BREAKING_CLUSTER_BOOST);
    expect(scored[0]!.scoreBreakdown.contextBoost).toBe(BREAKING_CLUSTER_BOOST);
    expect(findCluster(rep.url, clusters)).toBeTruthy();
  });
});
