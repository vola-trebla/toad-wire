import 'dotenv/config';
import { fetchFeeds } from './sources/rss.js';
import { summarizeArticle } from './pipeline/summarize.js';
import { formatPost } from './pipeline/format.js';
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

async function testPipeline() {
  console.log('🐸 Запуск тестового пайплайна...\n');

  // 1. Фетчим фиды
  const all = await fetchFeeds();
  console.log(`📡 Всего статей из RSS: ${all.length}`);

  // 2. Фильтруем по ключевым словам
  const filtered = all.filter((a) => isRelevant(a.title));
  console.log(`🔍 После фильтра: ${filtered.length}\n`);

  // 3. Показываем топ-5 кандидатов до ранкера
  console.log('📋 Топ-5 кандидатов (до ранкера):');
  filtered.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.source}] ${a.publishedAt}`);
    console.log(`     ${a.title}`);
  });

  // 4. Ранкаем через LLM
  const ranked = await rankArticles(filtered, 3);

  console.log('\n🎯 После ранкера:');
  ranked.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.source}] ${a.title}`);
  });

  // 5. Суммаризируем первую статью из ranked
  const target = ranked[0];
  if (!target) {
    console.log('\n❌ Нет кандидатов для суммаризации');
    return;
  }

  console.log(`\n🧠 Суммаризируем: "${target.title}"`);
  const summary = await summarizeArticle(target);

  if (!summary) {
    console.log('❌ Суммаризация не удалась');
    return;
  }

  // 6. Форматируем пост
  const post = formatPost(target, summary);

  console.log('\n' + '='.repeat(60));
  console.log('📨 ГОТОВЫЙ ПОСТ (не отправляется в Telegram):');
  console.log('='.repeat(60));
  console.log(post);
  console.log('='.repeat(60));
}

testPipeline().catch(console.error);
