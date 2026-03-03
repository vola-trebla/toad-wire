/**
 * Impact Score v2.0 — Multi-factor article scoring
 *
 * Formula:
 *   ImpactScore = (authority × freshness) + keywordBoost + contextBoost
 *                 − duplicatePenalty − spamPenalty
 *
 * Thresholds:
 *   > 1.30  → 🚨 BREAKING  — immediate pipeline
 *   0.80+   → ⭐ TOP       — enters top-7 for Telegram
 *   0.50+   → 📰 NORMAL    — candidate for top-7
 *   0.30+   → 📋 SECONDARY — raw_headlines batch
 *   < 0.30  → 🗑️ NOISE    — discard
 */

import type { FeedArticle } from '../ingestion/rss.js';
import type { MarketSnapshot } from '../market/market-snapshot.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_AUTHORITY = 0.6;

const KEYWORD_BOOSTS: Array<{ pattern: RegExp; boost: number; category: string }> = [
  // Tier 1 — Critical events
  { pattern: /hack|exploit|breach|stolen|vulnerability/i, boost: 0.25, category: 'security' },
  { pattern: /sec|cftc|regulation|ban|lawsuit|legal/i, boost: 0.2, category: 'regulation' },
  {
    pattern: /etf|institutional|blackrock|fidelity|vanguard/i,
    boost: 0.2,
    category: 'institutional',
  },
  // Tier 2 — Macro signals
  {
    pattern: /fed|federal reserve|interest rate|inflation|treasury/i,
    boost: 0.15,
    category: 'macro',
  },
  { pattern: /ath|all.time high|record/i, boost: 0.15, category: 'milestone' },
  { pattern: /crash|collapse|liquidat|bankrupt/i, boost: 0.15, category: 'crisis' },
  { pattern: /halving|upgrade|fork|mainnet|merge/i, boost: 0.15, category: 'technology' },
  // Tier 3 — Regional relevance
  {
    pattern: /latin|latam|brazil|brasil|argentina|mexico|colombia|venezuela|chile|el salvador/i,
    boost: 0.2,
    category: 'latam',
  },
  // Tier 4 — Asset mentions
  { pattern: /bitcoin|btc|ethereum|eth/i, boost: 0.1, category: 'major_asset' },
  { pattern: /solana|sol|ripple|xrp|cardano|ada/i, boost: 0.05, category: 'alt_asset' },
  { pattern: /stablecoin|usdt|usdc|tether|circle/i, boost: 0.1, category: 'stablecoin' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  authority: number;
  freshness: number;
  keywordBoost: number;
  contextBoost: number;
  duplicatePenalty: number;
  spamPenalty: number;
}

export interface ScoredArticle extends FeedArticle {
  importanceScore: number;
  scoreBreakdown: ScoreBreakdown;
}

// ─── Scoring factors ─────────────────────────────────────────────────────────

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

// scorer.ts — заменяем только getContextBoost

function getContextBoost(title: string, snapshot: MarketSnapshot): number {
  let boost = 0;

  // ─── Mood-aligned patterns ─────────────────────────────────────────────────
  const MOOD_PATTERNS: Record<string, RegExp> = {
    extreme_fear:
      /crash|dump|liquidat|sell.?off|plunge|panic|fear|uncertain|risk|decline|drop|loss|below|worst|crisis|collapse|contagion|insolvency|withdraw|depeg|exploit|hack|breach/i,
    fear: /sell.?off|decline|pressure|concern|risk|caution|drop|below|uncertain|weak|struggle|outflow|redemption|delay|reject|probe|investigate/i,
    extreme_greed:
      /ath|all.?time.?high|record|surge|rally|pump|soar|bull|above|best|boom|euphoria|inflow|accumulate|breakout|milestone|approval|launch/i,
    greed:
      /rally|surge|gain|rise|above|bull|optimis|recover|momentum|breakout|inflow|adoption|partnership|integrate|expand|grow|profit/i,
    neutral: /stable|sideways|consolidat|range|flat|hold|wait|watch|prepare|expect/i,
  };

  const pattern = MOOD_PATTERNS[snapshot.marketMood];
  if (pattern?.test(title)) {
    boost += snapshot.marketMood.includes('extreme') ? 0.15 : 0.1;
  }

  // ─── Volatility alerts ─────────────────────────────────────────────────────
  if (snapshot.volatilityAlerts) {
    for (const alert of snapshot.volatilityAlerts) {
      if (new RegExp(alert.symbol, 'i').test(title) && alert.severity !== 'low') {
        boost += alert.severity === 'extreme' ? 0.3 : alert.severity === 'high' ? 0.2 : 0.1;
      }
    }
  }

  // ─── Time-of-day boost ─────────────────────────────────────────────────────
  // Morning pipeline: boost articles with fresh market data signals
  const TIME_PATTERNS: Record<string, RegExp> = {
    morning: /open|overnight|asia|premarket|early|wake|morning|today|weekly|monday|outlook/i,
    afternoon: /update|midday|intraday|session|now|current|live|breaking|just/i,
    evening: /close|daily|recap|summary|eod|end.?of.?day|tonight|after.?hours/i,
    night: /overnight|asia|futures|tomorrow|preview|next/i,
  };

  const timePattern = TIME_PATTERNS[snapshot.timeOfDay];
  if (timePattern?.test(title)) {
    boost += 0.05;
  }

  // ─── LATAM prime-time boost ────────────────────────────────────────────────
  // Extra boost for regional news during peak LATAM hours (morning + afternoon)
  const isLatamPrimeTime = snapshot.timeOfDay === 'morning' || snapshot.timeOfDay === 'afternoon';
  const isLatamArticle =
    /latin|latam|brazil|brasil|argentina|mexico|colombia|venezuela|chile|el.?salvador|peru|crypto.?hub/i.test(
      title,
    );

  if (isLatamPrimeTime && isLatamArticle) {
    boost += 0.1;
  }

  return Math.min(boost, 0.4); // поднял с 0.3 → 0.4, т.к. добавили новые сигналы
}

function getDuplicatePenalty(title: string, recentTitles: string[]): number {
  // Simple token overlap check against recent published titles
  const tokens = new Set(
    title
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3),
  );
  let overlapCount = 0;

  for (const recent of recentTitles) {
    const recentTokens = new Set(
      recent
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3),
    );
    const intersection = [...tokens].filter((t) => recentTokens.has(t)).length;
    const union = new Set([...tokens, ...recentTokens]).size;
    const overlap = union > 0 ? intersection / union : 0;
    if (overlap > 0.4) overlapCount++;
  }

  return overlapCount === 0 ? 0 : overlapCount === 1 ? 0.15 : 0.3;
}

function getSpamPenalty(title: string): number {
  let penalty = 0;
  if (/\?$/.test(title)) penalty += 0.05;
  if (/\b(could|might|may)\b.*\?/i.test(title)) penalty += 0.1;
  if (/top \d+|best \d+|\d+ reasons/i.test(title)) penalty += 0.15;
  if (/price prediction|will reach/i.test(title)) penalty += 0.2;
  if (/sponsored|press release|partner/i.test(title)) penalty += 0.5;
  return Math.min(penalty, 0.5);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function scoreArticles(
  articles: FeedArticle[],
  snapshot?: MarketSnapshot,
  recentTitles?: string[],
): ScoredArticle[] {
  return articles
    .map((article) => {
      // Authority: from article (propagated from feeds.config) or fallback
      const authority = article.authority ?? DEFAULT_AUTHORITY;
      const freshness = getFreshnessScore(article.publishedAt);
      const keywordBoost = getKeywordBoost(article.title);
      const contextBoost = snapshot ? getContextBoost(article.title, snapshot) : 0;
      const duplicatePenalty = recentTitles ? getDuplicatePenalty(article.title, recentTitles) : 0;
      const spamPenalty = getSpamPenalty(article.title);

      const importanceScore =
        authority * freshness + keywordBoost + contextBoost - duplicatePenalty - spamPenalty;

      return {
        ...article,
        importanceScore,
        scoreBreakdown: {
          authority,
          freshness,
          keywordBoost,
          contextBoost,
          duplicatePenalty,
          spamPenalty,
        },
      };
    })
    .sort((a, b) => b.importanceScore - a.importanceScore);
}

// ─── Score tier helpers ───────────────────────────────────────────────────────

export const SCORE_THRESHOLDS = {
  BREAKING: 1.23,
  TOP: 0.8,
  NORMAL: 0.5,
  SECONDARY: 0.3,
} as const;

export function getScoreTier(score: number): 'breaking' | 'top' | 'normal' | 'secondary' | 'noise' {
  if (score > SCORE_THRESHOLDS.BREAKING) return 'breaking';
  if (score >= SCORE_THRESHOLDS.TOP) return 'top';
  if (score >= SCORE_THRESHOLDS.NORMAL) return 'normal';
  if (score >= SCORE_THRESHOLDS.SECONDARY) return 'secondary';
  return 'noise';
}
