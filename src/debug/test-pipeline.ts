import 'dotenv/config';
import { fetchFeeds } from '../sources/rss.js';
import { summarizeArticle } from '../pipeline/summarize.js';
import { formatPost } from '../pipeline/format.js';
import { rankArticles } from '../pipeline/ranker.js';

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

    // 4. Rank via LLM
    const ranked = await rankArticles(filtered, 3);

    console.log('\n🎯 After ranker:');
    ranked.forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.source}] ${a.title}`);
    });

    // 5. Summarize first article from ranked
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

    // 6. Format post
    const post = formatPost(target, summary);

    console.log('\n' + '='.repeat(60));
    console.log('📨 READY POST (not sent to Telegram):');
    console.log('='.repeat(60));
    console.log(post);
    console.log('='.repeat(60));
}

testPipeline().catch(console.error);
