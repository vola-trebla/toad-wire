import type { FeedArticle } from '../sources/rss.js';

const SOURCE_AUTHORITY: Record<string, number> = {
  CoinDesk: 0.95,
  CoinTelegraph: 0.9,
  Decrypt: 0.85,
  'The Block': 0.9,
  CryptoBriefing: 0.75,
  CoinGape: 0.7,
  Blockworks: 0.85,
  BeInCrypto: 0.7,
  Cointribune: 0.65,
};

const DEFAULT_AUTHORITY = 0.6;

const KEYWORD_BOOSTS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /hack|exploit|breach|stolen|vulnerability/i, boost: 0.25 },
  { pattern: /sec|cftc|regulation|ban|lawsuit|legal/i, boost: 0.2 },
  { pattern: /etf|institutional|blackrock|fidelity|vanguard/i, boost: 0.2 },
  { pattern: /fed|federal reserve|interest rate|inflation/i, boost: 0.15 },
  { pattern: /ath|all.time high|record/i, boost: 0.15 },
  { pattern: /crash|collapse|liquidat/i, boost: 0.15 },
  { pattern: /halving|upgrade|fork|mainnet/i, boost: 0.15 },
  { pattern: /latin|latam|brazil|argentina|mexico|colombia|venezuela/i, boost: 0.2 },
  { pattern: /bitcoin|btc|ethereum|eth/i, boost: 0.1 },
  { pattern: /solana|sol|ripple|xrp/i, boost: 0.05 },
];

function getFreshnessScore(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  return Math.exp(-0.15 * ageHours);
}

function getKeywordBoost(title: string): number {
  let boost = 0;
  for (const { pattern, boost: b } of KEYWORD_BOOSTS) {
    if (pattern.test(title)) boost += b;
  }
  return Math.min(boost, 0.5);
}

export interface ScoredArticle extends FeedArticle {
  importanceScore: number;
}

export function scoreArticles(articles: FeedArticle[]): ScoredArticle[] {
  return articles
    .map((article) => {
      const authority = SOURCE_AUTHORITY[article.source] ?? DEFAULT_AUTHORITY;
      const freshness = getFreshnessScore(article.publishedAt);
      const keywordBoost = getKeywordBoost(article.title);
      const importanceScore = authority * freshness + keywordBoost;
      return { ...article, importanceScore };
    })
    .sort((a, b) => b.importanceScore - a.importanceScore);
}
