/**
 * Story Clustering — Level 4 deduplication
 *
 * Groups articles from different sources that cover the same event.
 * Used to:
 *   1. Detect breaking news (3+ sources OR 2+ Tier-1 sources on same story)
 *   2. Apply +0.30 boost to representative article's Impact Score
 *
 * Intentionally cheap: only token overlap, no embeddings, no API calls.
 * Runs after Levels 0–3 dedup (URL + token + semantic).
 */

import type { FeedArticle } from '../sources/rss.js';
import type { ScoredArticle } from './scorer.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Token overlap threshold to consider two titles part of the same story */
const CLUSTER_OVERLAP_THRESHOLD = 0.5;

/** Minimum unique sources to mark a cluster as breaking */
const BREAKING_SOURCE_COUNT = 3;

/** Minimum Tier-1 sources to mark a cluster as breaking */
const BREAKING_TIER1_COUNT = 2;

/** Score boost applied to representative article when cluster isBreaking */
export const BREAKING_CLUSTER_BOOST = 0.3;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryCluster {
  id: string;
  representativeTitle: string;
  representativeUrl: string;
  articles: FeedArticle[];
  /** Number of unique sources covering this story */
  sourceCount: number;
  /** Number of articles from Tier-1 sources */
  tierOneCount: number;
  averageAuthority: number;
  isBreaking: boolean;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

function computeAverageAuthority(articles: FeedArticle[]): number {
  return articles.reduce((sum, a) => sum + a.authority, 0) / articles.length;
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Clusters articles by story similarity using token overlap.
 * Input: articles already deduplicated through Levels 0–3.
 * Output: clusters with breaking signal and representative article info.
 */
export function clusterByStory(articles: FeedArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];

  for (const article of articles) {
    let matched = false;

    for (const cluster of clusters) {
      if (tokenOverlap(article.title, cluster.representativeTitle) > CLUSTER_OVERLAP_THRESHOLD) {
        cluster.articles.push(article);
        // Recompute derived fields
        cluster.sourceCount = new Set(cluster.articles.map((a) => a.source)).size;
        cluster.tierOneCount = cluster.articles.filter((a) => a.tier === 1).length;
        cluster.averageAuthority = computeAverageAuthority(cluster.articles);
        cluster.isBreaking =
          cluster.sourceCount >= BREAKING_SOURCE_COUNT ||
          cluster.tierOneCount >= BREAKING_TIER1_COUNT;
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({
        id: crypto.randomUUID(),
        representativeTitle: article.title,
        representativeUrl: article.url,
        articles: [article],
        sourceCount: 1,
        tierOneCount: article.tier === 1 ? 1 : 0,
        averageAuthority: article.authority,
        isBreaking: false,
      });
    }
  }

  return clusters;
}

/**
 * Applies breaking cluster boost to scored articles.
 * Mutates importanceScore and scoreBreakdown.contextBoost in place.
 *
 * Call after scoreArticles(), before LLM ranker.
 */
export function applyClusterBoosts(
  scoredArticles: ScoredArticle[],
  clusters: StoryCluster[],
): void {
  for (const cluster of clusters) {
    if (!cluster.isBreaking) continue;

    const article = scoredArticles.find((a) => a.url === cluster.representativeUrl);
    if (!article) continue;

    article.importanceScore += BREAKING_CLUSTER_BOOST;
    article.scoreBreakdown.contextBoost += BREAKING_CLUSTER_BOOST;
  }
}

/**
 * Finds the cluster a given article URL belongs to.
 */
export function findCluster(url: string, clusters: StoryCluster[]): StoryCluster | undefined {
  return clusters.find((c) => c.articles.some((a) => a.url === url));
}
