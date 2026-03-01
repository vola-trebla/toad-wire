/**
 * Score Analyzer
 *
 * Reads scores-data.json and produces statistics for Checkpoint 1 review.
 * Run after collecting data with collect-scores.ts.
 *
 * Usage: npx tsx src/debug/analyze-scores.ts
 */

import { readFileSync, existsSync } from 'fs';
import { SCORE_THRESHOLDS } from '../pipeline/scorer.js';

const INPUT_FILE = 'scores-data.json';

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

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function analyzeScores() {
  if (!existsSync(INPUT_FILE)) {
    console.log(`❌ No data found. Run collect-scores.ts first.`);
    process.exit(1);
  }

  const runs: ScoreEntry[] = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  const allArticles = runs.flatMap((r) => r.articles);

  console.log('🐸 Score Analysis — Checkpoint 1\n');
  console.log('='.repeat(60));

  // ── Dataset overview ──────────────────────────────────────
  console.log(`\n📊 Dataset`);
  console.log(`   Runs: ${runs.length}`);
  console.log(`   Total articles: ${allArticles.length}`);
  console.log(
    `   Period: ${runs[0]!.collectedAt.slice(0, 10)} → ${runs.at(-1)!.collectedAt.slice(0, 10)}`,
  );
  console.log(`   Moods seen: ${[...new Set(runs.map((r) => r.marketMood))].join(', ')}`);

  // ── Score distribution ────────────────────────────────────
  const dist = { breaking: 0, top: 0, normal: 0, secondary: 0, noise: 0 };
  for (const a of allArticles) dist[a.tier_label as keyof typeof dist]++;
  const total = allArticles.length;

  console.log(`\n📊 Score Distribution (${total} articles)`);
  console.log(
    `   🚨 BREAKING  (>${SCORE_THRESHOLDS.BREAKING}): ${dist.breaking.toString().padStart(4)} — ${pct(dist.breaking, total)}`,
  );
  console.log(
    `   ⭐ TOP       (>${SCORE_THRESHOLDS.TOP}): ${dist.top.toString().padStart(4)} — ${pct(dist.top, total)}`,
  );
  console.log(
    `   📰 NORMAL    (>${SCORE_THRESHOLDS.NORMAL}): ${dist.normal.toString().padStart(4)} — ${pct(dist.normal, total)}`,
  );
  console.log(
    `   📋 SECONDARY (>${SCORE_THRESHOLDS.SECONDARY}): ${dist.secondary.toString().padStart(4)} — ${pct(dist.secondary, total)}`,
  );
  console.log(
    `   🗑️  NOISE     (<${SCORE_THRESHOLDS.SECONDARY}): ${dist.noise.toString().padStart(4)} — ${pct(dist.noise, total)}`,
  );

  // ── Score stats ───────────────────────────────────────────
  const scores = allArticles.map((a) => a.score).sort((a, b) => a - b);
  const p50 = scores[Math.floor(scores.length * 0.5)]!;
  const p75 = scores[Math.floor(scores.length * 0.75)]!;
  const p90 = scores[Math.floor(scores.length * 0.9)]!;
  const p95 = scores[Math.floor(scores.length * 0.95)]!;

  console.log(`\n📊 Score Percentiles`);
  console.log(`   Min:  ${scores[0]!.toFixed(3)}`);
  console.log(`   P50:  ${p50.toFixed(3)}`);
  console.log(`   P75:  ${p75.toFixed(3)}`);
  console.log(`   P90:  ${p90.toFixed(3)}`);
  console.log(`   P95:  ${p95.toFixed(3)}`);
  console.log(`   Max:  ${scores.at(-1)!.toFixed(3)}`);

  // ── Top 10 all time ───────────────────────────────────────
  const sorted = [...allArticles].sort((a, b) => b.score - a.score);
  console.log(`\n🏆 Top 10 articles (all runs)`);
  console.log('='.repeat(60));
  sorted.slice(0, 10).forEach((a, i) => {
    console.log(
      `\n${i + 1}. [${a.source} T${a.tier}] ${a.score.toFixed(3)} — ${a.title.slice(0, 65)}`,
    );
    console.log(
      `   auth=${a.breakdown.authority} × fresh=${a.breakdown.freshness} + kw=${a.breakdown.keywordBoost} + ctx=${a.breakdown.contextBoost} − spam=${a.breakdown.spamPenalty}`,
    );
  });

  // ── Breaking candidates (score > 1.0 but not breaking) ───
  const nearBreaking = sorted.filter((a) => a.score > 1.0 && a.score <= SCORE_THRESHOLDS.BREAKING);
  if (nearBreaking.length > 0) {
    console.log(`\n⚠️  Near-breaking articles (1.0–1.2) — ${nearBreaking.length} total`);
    console.log('   (These would break with cluster boost +0.30)');
    nearBreaking.slice(0, 5).forEach((a) => {
      console.log(`   ${a.score.toFixed(3)} [${a.source}] ${a.title.slice(0, 65)}`);
    });
  }

  // ── Boost factor analysis ─────────────────────────────────
  const withKeyword = allArticles.filter((a) => a.breakdown.keywordBoost > 0);
  const withContext = allArticles.filter((a) => a.breakdown.contextBoost > 0);
  const withSpam = allArticles.filter((a) => a.breakdown.spamPenalty > 0);
  const withDup = allArticles.filter((a) => a.breakdown.duplicatePenalty > 0);

  console.log(`\n📊 Boost/Penalty hit rates`);
  console.log(
    `   Keyword boost triggered:    ${withKeyword.length} articles — ${pct(withKeyword.length, total)}`,
  );
  console.log(
    `   Context boost triggered:    ${withContext.length} articles — ${pct(withContext.length, total)}`,
  );
  console.log(
    `   Spam penalty triggered:     ${withSpam.length} articles — ${pct(withSpam.length, total)}`,
  );
  console.log(
    `   Duplicate penalty triggered:${withDup.length} articles — ${pct(withDup.length, total)}`,
  );

  // ── Per-source analysis ───────────────────────────────────
  const bySource = new Map<string, number[]>();
  for (const a of allArticles) {
    if (!bySource.has(a.source)) bySource.set(a.source, []);
    bySource.get(a.source)!.push(a.score);
  }

  console.log(`\n📊 Average score by source`);
  [...bySource.entries()]
    .map(([source, scores]) => ({ source, avg: avg(scores), count: scores.length }))
    .sort((a, b) => b.avg - a.avg)
    .forEach(({ source, avg: a, count }) => {
      console.log(`   ${source.padEnd(20)} avg: ${a.toFixed(3)} (${count} articles)`);
    });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis complete.');
}

analyzeScores();
