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

const KEYWORDS = [
  'bitcoin',
  'btc',
  'ethereum',
  'eth',
  'solana',
  'sol',
  'defi',
  'sec',
  'etf',
  'stablecoin',
  'regulation',
  'fed',
  'blackrock',
  'coinbase',
  'binance',
  'hack',
  'exploit',
  'pepe',
  'doge',
  'memecoin',
  'layer2',
  'l2',
  'airdrop',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

// 🌅 10:00 — Morning digest with prices
async function runMorningDigest(): Promise<void> {
  logger.info('🌅 Starting morning digest...');

  try {
    const prices = await fetchPrices();
    await sendToTelegram(formatPricesPost(prices));

    // After prices — top-1 fresh news
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

  // Exclude duplicates
  const nonDuplicates: FeedArticle[] = [];
  for (const article of filtered) {
    if (!(await isDuplicate(article.url))) {
      nonDuplicates.push(article);
    }
  }

  // Rank via LLM with buffer
  const ranked = await rankArticles(nonDuplicates, limit * 3);

  let posted = 0;

  for (const article of ranked) {
    if (posted >= limit) break;

    const summary = await summarizeArticle(article);
    if (!summary) continue;

    const post = formatPost(article, summary);
    await sendToTelegram(post);

    await saveArticle(article);
    await markAsPosted(article.url);

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
