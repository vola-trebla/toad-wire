import 'dotenv/config';
import { fetchFeeds } from '../sources/rss.js';
import { scoreArticles, getScoreTier } from '../pipeline/scorer.js';
import { collectMarketSnapshot } from '../sources/market-snapshot.js';
import { isDuplicate } from '../pipeline/dedup.js';
import { summarizeArticle } from '../pipeline/summarize.js';
import { formatPostTelegram, formatPostX } from '../pipeline/format.js';

const TOP_N = 3; // how many articles to summarize

async function testScorerLLM() {
  console.log('🐸 Testing Scorer v2.0 → LLM Summarization pipeline...\n');

  // 1. Fetch + snapshot
  console.log('📡 Fetching RSS feeds...');
  const articles = await fetchFeeds();
  console.log(`📡 Total: ${articles.length} articles\n`);

  const snapshot = await collectMarketSnapshot();
  console.log(`📸 Mood: ${snapshot.marketMood} | Time: ${snapshot.timeOfDay}\n`);

  // 2. Dedup (URL only — skip embeddings to save budget)
  const fresh = [];
  for (const a of articles) {
    if (await isDuplicate(a.url)) continue;
    fresh.push(a);
  }
  console.log(`🧹 After URL dedup: ${fresh.length} fresh articles\n`);

  // 3. Score
  const scored = scoreArticles(fresh, snapshot);
  const top = scored.slice(0, TOP_N);

  console.log(`🎯 Top ${TOP_N} by Impact Score:`);
  top.forEach((a, i) => {
    console.log(
      `  ${i + 1}. [${getScoreTier(a.importanceScore).toUpperCase()}] ${a.importanceScore.toFixed(3)} — ${a.title}`,
    );
  });

  // 4. Summarize each with LLM
  console.log(`\n🧠 Summarizing top ${TOP_N} articles (uses ${TOP_N} Flash RPD)...\n`);

  for (const [i, article] of top.entries()) {
    console.log('='.repeat(70));
    console.log(`\n[${i + 1}/${TOP_N}] ${article.title}`);
    console.log(`Source: ${article.source} | Score: ${article.importanceScore.toFixed(3)}\n`);

    const summary = await summarizeArticle(article);

    if (!summary) {
      console.log('❌ Summarization failed or budget exhausted\n');
      continue;
    }

    // Telegram post
    const tgPost = formatPostTelegram(article, summary);
    console.log('📨 TELEGRAM POST:');
    console.log('-'.repeat(50));
    console.log(tgPost);

    // X post
    const xPost = formatPostX(article, summary);
    console.log('\n🐦 X POST:');
    console.log('-'.repeat(50));
    console.log(xPost);
    console.log();
  }

  console.log('='.repeat(70));
  console.log(`\n✅ Done. Used ${TOP_N} Flash RPD.`);
}

testScorerLLM().catch(console.error);
