import 'dotenv/config';
import cron from 'node-cron';
import { type FeedArticle, fetchFeeds } from './sources/rss.js';
import { fetchPrices, formatPricesPost } from './sources/prices.js';
import { isDuplicate, saveArticle, markAsPosted } from './pipeline/dedup.js';
import { generateGoodNight, summarizeArticle } from './pipeline/summarize.js';
import { formatPost } from './pipeline/format.js';
import { sendToTelegram } from './pipeline/post.js';
import { logger } from './utils/logger.js';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';
import { rankArticles } from './pipeline/ranker.js';
import { fetchFearGreed } from './sources/feargreed.js';
import { filterSimilar } from './pipeline/similarity.js';
import { initSentry } from './utils/sentry.js';
import { startHealthServer, updateLastPosted } from './health/server.js';

initSentry();
startHealthServer();

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

// 🌅 10:00 — Morning digest with prices
async function runMorningDigest(): Promise<void> {
  logger.info('🌅 Starting morning digest...');

  try {
    const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

    await sendToTelegram(formatPricesPost(prices, fearGreed));
    await runNewsPipeline(1);
  } catch (error) {
    logger.error(`❌ Morning digest error: ${error}`);
  }
}

// 📰 Day runs — news only
async function runNewsPipeline(limit = 5): Promise<void> {
  logger.info('📰 Starting news pipeline...');

  const allArticles = await fetchFeeds();
  const filtered = allArticles.filter((a) => isRelevant(a.title));

  logger.info(`🔍 After filter: ${filtered.length} of ${allArticles.length}`);

  // Replace the old dedup loop with:
  const nonDuplicates: FeedArticle[] = [];
  for (const article of filtered) {
    if (await isDuplicate(article.url)) continue;
    nonDuplicates.push(article);
  }
  const fresh = await filterSimilar(nonDuplicates);
  const MAX_RANKER_INPUT = 15;
  const ranked = await rankArticles(fresh.slice(0, MAX_RANKER_INPUT), limit * 3);

  let posted = 0;

  for (const article of ranked) {
    if (posted >= limit) break;

    const summary = await summarizeArticle(article);
    if (!summary) continue;

    const post = formatPost(article, summary);
    await sendToTelegram(post);

    await saveArticle(article);
    await markAsPosted(article.url);
    updateLastPosted();

    posted++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  logger.info(`✅ Posted: ${posted}`);
}

// 🌙 21:00 — Evening digest
async function runEveningDigest(): Promise<void> {
  logger.info('🌙 Starting evening digest...');

  try {
    // One fun/unusual news pick
    await runNewsPipeline(1);

    await sendToTelegram(await generateGoodNight());
  } catch (error) {
    logger.error(`❌ Evening digest error: ${error}`);
  }
}

const TIMEZONE = 'America/Montevideo';

cron.schedule('0 10 * * *', () => void runMorningDigest(), { timezone: TIMEZONE });
cron.schedule('0 12 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 15 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 18 * * *', () => void runNewsPipeline(1), { timezone: TIMEZONE });
cron.schedule('0 21 * * *', () => void runEveningDigest(), { timezone: TIMEZONE });
cron.schedule(
  '0 0 * * 0',
  () => {
    db.run(sql`DELETE FROM articles WHERE created_at < datetime('now', '-7 days')`);
    logger.info('🗑️ Old articles cleaned up');
  },
  { timezone: TIMEZONE },
);

logger.info('🐸 El Sapo Cripto arrancó! Esperando el horario...');

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  process.exit(0);
});
