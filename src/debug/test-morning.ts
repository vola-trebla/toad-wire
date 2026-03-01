import 'dotenv/config';
import { fetchPrices, formatPricesPost } from '../sources/prices.js';
import { fetchFearGreed } from '../sources/feargreed.js';
// import { sendToTelegram } from './pipeline/post.js';

async function testMorningDigest() {
  console.log('🌅 Testing morning digest...\n');

  const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);
  const post = formatPricesPost(prices, fearGreed);

  console.log('📨 MORNING DIGEST POST:');
  console.log('='.repeat(60));
  console.log(post);
  console.log('='.repeat(60));

  // Uncomment to actually send to Telegram:
  // await sendToTelegram(post);
}

testMorningDigest().catch(console.error);
