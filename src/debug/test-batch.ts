import 'dotenv/config';
import { collectMarketSnapshot } from '../sources/market-snapshot.js';
import { generateBatch } from '../pipeline/batch-generator.js';

process.env.BYPASS_BUDGET = 'true';

async function testBatch(): Promise<void> {
  console.log('📸 Collecting snapshot...\n');
  const snapshot = await collectMarketSnapshot();

  console.log('Snapshot:');
  console.log(`  mood: ${snapshot.marketMood}`);
  console.log(`  time: ${snapshot.timeOfDay}`);
  console.log(`  prices: ${snapshot.prices.map((p) => p.symbol).join(', ')}\n`);

  console.log('🎲 Generating market_vibe batch...\n');
  const posts = await generateBatch('market_vibe', snapshot);

  posts.forEach((p, i) => {
    console.log(`--- Post ${i + 1} ---`);
    console.log(`${p.mood} ${p.text}`);
    console.log(`${p.hashtags.join(' ')}\n`);
  });
}

const snapshot = await collectMarketSnapshot();

// в конце файла, после market_vibe теста
if (snapshot.unusedHeadlines.length === 0) {
  snapshot.unusedHeadlines = [
    'BlackRock explores DeFi treasury products',
    'Solana network halts for 4 hours due to bug',
  ];
}

console.log('\n💊 Generating degen_time...\n');
const degenPosts = await generateBatch('degen_time', snapshot);
degenPosts.forEach((p) => {
  console.log(`${p.mood} ${p.text}`);
  console.log(`${p.hashtags.join(' ')}\n`);
});

testBatch().catch(console.error);
