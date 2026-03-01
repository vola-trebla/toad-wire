/**
 * Score Collector
 *
 * Fetches RSS feeds, scores articles, and appends results to scores-data.json.
 * Run multiple times at different hours to build a dataset for analysis.
 *
 * Usage: npx tsx src/debug/collect-scores.ts
 */

import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fetchFeeds } from '../sources/rss.js';
import { scoreArticles, getScoreTier } from '../pipeline/scorer.js';
import { collectMarketSnapshot } from '../sources/market-snapshot.js';

const OUTPUT_FILE = 'scores-data.json';

interface ScoreEntry {
  collectedAt: string;
  marketMood: string;
  timeOfDay: string;
  articles: Array<{
    title: string;
    source: string;
    tier: number;
    score: number;
    tier_label: string;
    breakdown: {
      authority: number;
      freshness: number;
      keywordBoost: number;
      contextBoost: number;
      duplicatePenalty: number;
      spamPenalty: number;
    };
  }>;
}

async function collectScores() {
  console.log('🐸 Collecting scores...\n');

  const articles = await fetchFeeds();
  const snapshot = await collectMarketSnapshot();
  const scored = scoreArticles(articles, snapshot);

  const entry: ScoreEntry = {
    collectedAt: new Date().toISOString(),
    marketMood: snapshot.marketMood,
    timeOfDay: snapshot.timeOfDay,
    articles: scored.map((a) => ({
      title: a.title,
      source: a.source,
      tier: a.tier,
      score: parseFloat(a.importanceScore.toFixed(4)),
      tier_label: getScoreTier(a.importanceScore),
      breakdown: {
        authority: parseFloat(a.scoreBreakdown.authority.toFixed(3)),
        freshness: parseFloat(a.scoreBreakdown.freshness.toFixed(3)),
        keywordBoost: parseFloat(a.scoreBreakdown.keywordBoost.toFixed(3)),
        contextBoost: parseFloat(a.scoreBreakdown.contextBoost.toFixed(3)),
        duplicatePenalty: parseFloat(a.scoreBreakdown.duplicatePenalty.toFixed(3)),
        spamPenalty: parseFloat(a.scoreBreakdown.spamPenalty.toFixed(3)),
      },
    })),
  };

  // Load existing data or start fresh
  const existing: ScoreEntry[] = existsSync(OUTPUT_FILE)
    ? JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'))
    : [];

  existing.push(entry);
  writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));

  // Summary
  const dist = { breaking: 0, top: 0, normal: 0, secondary: 0, noise: 0 };
  for (const a of entry.articles) dist[a.tier_label as keyof typeof dist]++;

  console.log(`✅ Collected ${entry.articles.length} articles at ${entry.collectedAt}`);
  console.log(`   Mood: ${entry.marketMood} | Time: ${entry.timeOfDay}`);
  console.log(
    `   🚨 ${dist.breaking} | ⭐ ${dist.top} | 📰 ${dist.normal} | 📋 ${dist.secondary} | 🗑️  ${dist.noise}`,
  );
  console.log(`\n📁 Saved to ${OUTPUT_FILE} (${existing.length} total runs)`);
}

collectScores().catch(console.error);
