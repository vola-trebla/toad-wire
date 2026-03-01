import 'dotenv/config';
import { fetchFeeds, type FeedArticle } from '../sources/rss.js';
import { isDuplicate, saveArticle, markAsPosted } from '../pipeline/dedup.js';
import { summarizeArticle } from '../pipeline/summarize.js';
import { formatPostTelegram } from '../pipeline/format.js';
import { rankArticles } from '../pipeline/ranker.js';
import { sendToTelegram, sendToTelegramWithPhoto } from '../pipeline/post.js';
import { filterSimilar } from '../pipeline/similarity.js';
import { generatePostImage, type ImageSentiment } from '../images/generate-image.js';

const BLACKLIST = [
  'nft game',
  'play-to-earn',
  'p2e',
  'sponsored',
  'press release',
  'partner content',
  'promoted',
  'advertisement',
  'podcast recap',
  'weekly roundup',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !BLACKLIST.some((term) => lower.includes(term));
}

async function testPipeline() {
  console.log('🐸 Running test pipeline...\n');

  // 1. Fetch feeds
  const all = await fetchFeeds();
  console.log(`📡 Total articles from RSS: ${all.length}`);

  // 2. Filter by keywords
  const filtered = all.filter((a) => isRelevant(a.title));
  console.log(`🔍 After filter: ${filtered.length}\n`);

  // 3. Show top-5 candidates before ranker
  console.log('📋 Top-5 candidates (before ranker):');
  filtered.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.source}] ${a.publishedAt}`);
    console.log(`     ${a.title}`);
  });

  // 4. Deduplication (same as prod)
  // Step 4: dedup
  const nonDuplicates: FeedArticle[] = [];
  let skippedUrl = 0;

  for (const article of filtered) {
    if (await isDuplicate(article.url)) {
      skippedUrl++;
      continue;
    }
    nonDuplicates.push(article);
  }

  const fresh = await filterSimilar(nonDuplicates);
  console.log(
    `\n🧹 Dedup: ${skippedUrl} URL dupes, ${nonDuplicates.length - fresh.length} similar — ${fresh.length} remaining`,
  );

  if (fresh.length === 0) {
    console.log('❌ No fresh articles after deduplication');
    return;
  }

  // 5. Rank via LLM
  const MAX_RANKER_INPUT = 15;
  const ranked = await rankArticles(fresh.slice(0, MAX_RANKER_INPUT), 3);

  console.log('\n🎯 After ranker:');
  ranked.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.source}] ${a.title}`);
  });

  // 6. Summarize first article from ranked
  const target = ranked[0];
  if (!target) {
    console.log('\n❌ No candidates for summarization');
    return;
  }

  console.log(`\n🧠 Summarizing: "${target.title}"`);
  const summary = await summarizeArticle(target);

  if (!summary) {
    console.log('❌ Summarization failed');
    return;
  }

  // 7. Format post
  const post = formatPostTelegram(target, summary);

  console.log('\n' + '='.repeat(60));
  console.log('📨 READY POST:');
  console.log('='.repeat(60));
  console.log(post);
  console.log('='.repeat(60));

  // 8. Generate image
  console.log('\n🎨 Generating image...');
  const image = await generatePostImage(
    summary.summary,
    summary.sentiment as ImageSentiment,
    summary.category,
  );

  // 9. Send to Telegram
  console.log('\n📨 Sending to Telegram...');
  if (image) {
    await sendToTelegramWithPhoto(image.data, post);
  } else {
    await sendToTelegram(post);
  }

  // 10. Save + mark as posted
  await saveArticle(target);
  await markAsPosted(target.url);
  console.log('✅ Sent and saved to DB!');
}

testPipeline().catch(console.error);
