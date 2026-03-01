import 'dotenv/config';
import { fetchFeeds } from '../sources/rss.js';
import { scoreArticles, getScoreTier, SCORE_THRESHOLDS } from '../pipeline/scorer.js';
import { clusterByStory } from '../pipeline/story-cluster.js';
import { collectMarketSnapshot } from '../sources/market-snapshot.js';

async function testScorer() {
  console.log('🐸 Testing Scorer v2.0 + Story Clustering...\n');

  // 1. Fetch feeds
  console.log('📡 Fetching RSS feeds...');
  const articles = await fetchFeeds();
  console.log(`📡 Total articles: ${articles.length}`);

  // Show tier distribution
  const byTier = { 1: 0, 2: 0, 3: 0 };
  for (const a of articles) byTier[a.tier]++;
  console.log(`   Tier 1: ${byTier[1]} | Tier 2: ${byTier[2]} | Tier 3: ${byTier[3]}\n`);

  // 2. Market snapshot for context boost
  console.log('📸 Collecting market snapshot...');
  const snapshot = await collectMarketSnapshot();
  console.log(`   Mood: ${snapshot.marketMood} | Time: ${snapshot.timeOfDay}\n`);

  // 3. Score articles
  const scored = scoreArticles(articles, snapshot);

  // 4. Show score distribution
  const tiers = { breaking: 0, top: 0, normal: 0, secondary: 0, noise: 0 };
  for (const a of scored) tiers[getScoreTier(a.importanceScore)]++;

  console.log('📊 Score distribution:');
  console.log(`   🚨 BREAKING  (>${SCORE_THRESHOLDS.BREAKING}):  ${tiers.breaking}`);
  console.log(`   ⭐ TOP       (>${SCORE_THRESHOLDS.TOP}):  ${tiers.top}`);
  console.log(`   📰 NORMAL    (>${SCORE_THRESHOLDS.NORMAL}):  ${tiers.normal}`);
  console.log(`   📋 SECONDARY (>${SCORE_THRESHOLDS.SECONDARY}):  ${tiers.secondary}`);
  console.log(`   🗑️  NOISE     (<${SCORE_THRESHOLDS.SECONDARY}):  ${tiers.noise}\n`);

  // 5. Top 10 scored articles with breakdown
  console.log('🏆 Top 10 articles by Impact Score:');
  console.log('='.repeat(80));
  scored.slice(0, 10).forEach((a, i) => {
    const tier = getScoreTier(a.importanceScore);
    const emoji = { breaking: '🚨', top: '⭐', normal: '📰', secondary: '📋', noise: '🗑️' }[tier];
    console.log(`\n${i + 1}. ${emoji} [${a.source} T${a.tier}] ${a.title}`);
    console.log(`   Score: ${a.importanceScore.toFixed(3)}`);
    console.log(
      `   auth=${a.scoreBreakdown.authority.toFixed(2)} × fresh=${a.scoreBreakdown.freshness.toFixed(2)}` +
        ` + kw=${a.scoreBreakdown.keywordBoost.toFixed(2)}` +
        ` + ctx=${a.scoreBreakdown.contextBoost.toFixed(2)}` +
        ` − dup=${a.scoreBreakdown.duplicatePenalty.toFixed(2)}` +
        ` − spam=${a.scoreBreakdown.spamPenalty.toFixed(2)}`,
    );
  });

  // 6. Story clustering
  console.log('\n\n🔗 Story Clustering:');
  console.log('='.repeat(80));
  const clusters = clusterByStory(articles);

  const multiSource = clusters.filter((c) => c.sourceCount > 1);
  const breaking = clusters.filter((c) => c.isBreaking);

  console.log(`   Total clusters: ${clusters.length}`);
  console.log(`   Multi-source:   ${multiSource.length}`);
  console.log(`   🚨 Breaking:    ${breaking.length}\n`);

  if (multiSource.length > 0) {
    console.log('Multi-source clusters:');
    multiSource.forEach((c) => {
      const flag = c.isBreaking ? '🚨 BREAKING' : '📰';
      console.log(`\n  ${flag} "${c.representativeTitle}"`);
      console.log(
        `   Sources (${c.sourceCount}): ${[...new Set(c.articles.map((a) => a.source))].join(', ')}`,
      );
      console.log(
        `   Tier-1 count: ${c.tierOneCount} | Avg authority: ${c.averageAuthority.toFixed(2)}`,
      );
    });
  } else {
    console.log('   No multi-source clusters found in current feed cycle.');
  }

  // 7. Breaking summary
  if (breaking.length > 0) {
    console.log('\n\n🚨 BREAKING NEWS DETECTED:');
    console.log('='.repeat(80));
    breaking.forEach((c) => {
      console.log(`\n  "${c.representativeTitle}"`);
      console.log(`  Would trigger runBreakingNewsPipeline() immediately`);
    });
  }

  console.log('\n\n✅ Scorer test complete.');
}

testScorer().catch(console.error);
