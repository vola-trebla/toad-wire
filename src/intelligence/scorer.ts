/**
 * Impact Score v2.0 — Multi-factor article scoring
 *
 * Formula:
 *   ImpactScore = (authority × freshness) + keywordBoost + contextBoost
 *                 − duplicatePenalty − spamPenalty
 *
 * Thresholds:
 *   > 1.40  → 🚨 BREAKING  — immediate pipeline
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
  { pattern: /breach|leak|vulnerab|jailbreak|exploit|attack/i, boost: 0.25, category: 'security' },
  {
    pattern: /regulat|ban|lawsuit|eu.?ai.?act|executive.?order|legislat/i,
    boost: 0.2,
    category: 'policy',
  },
  {
    pattern: /openai|anthropic|google.?deepmind|meta.?ai|mistral/i,
    boost: 0.2,
    category: 'major_lab',
  },
  // Tier 2 — Signals
  { pattern: /gpt|claude|gemini|llama|o[1-9]|reasoning/i, boost: 0.15, category: 'frontier_model' },
  { pattern: /open.?source|weight|hugging.?face|ollama/i, boost: 0.15, category: 'open_source' },
  {
    pattern: /agi|superintelligen|alignment|safety|existential/i,
    boost: 0.15,
    category: 'safety',
  },
  { pattern: /acqui|billion|funding|ipo|valuation/i, boost: 0.15, category: 'business' },
  { pattern: /benchmark|sota|state.of.the.art|breakthrough/i, boost: 0.15, category: 'research' },
  // Tier 3 — Ecosystem
  { pattern: /agent|tool.?use|mcp|function.?call|autonomous/i, boost: 0.1, category: 'agents' },
  {
    pattern: /gpu|nvidia|tpu|compute|inference|training/i,
    boost: 0.1,
    category: 'infrastructure',
  },
  {
    pattern: /copyright|deepfake|bias|hallucination|misinformation/i,
    boost: 0.1,
    category: 'ethics',
  },
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

function getContextBoost(title: string, snapshot: MarketSnapshot): number {
  let boost = 0;

  // ─── Time-of-day boost ─────────────────────────────────────────────────────
  const TIME_PATTERNS: Record<string, RegExp> = {
    morning: /morning|today|weekly|monday|outlook|overnight|launch|announce/i,
    afternoon: /update|now|current|live|breaking|just|release/i,
    evening: /daily|recap|summary|tonight|roundup/i,
    night: /tomorrow|preview|next|upcoming/i,
  };

  const timePattern = TIME_PATTERNS[snapshot.timeOfDay];
  if (timePattern?.test(title)) {
    boost += 0.05;
  }

  return Math.min(boost, 0.2);
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
  if (/ai girlfriend|make money with ai|passive income/i.test(title)) penalty += 0.2;
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
  BREAKING: 1.4,
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
