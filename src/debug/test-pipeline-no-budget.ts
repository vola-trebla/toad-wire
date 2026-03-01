import 'dotenv/config';
import { fetchFeeds } from '../sources/rss.js';
import { scrapeArticle } from '../pipeline/scraper.js';
import { summarizeArticle } from '../pipeline/summarize.js';
import { formatPostTelegram } from '../pipeline/format.js';
import { logger } from '../utils/logger.js';

// Override budget check for testing
process.env.BYPASS_BUDGET = 'true';

async function testPipeline(): Promise<void> {
  logger.info('🧪 Starting pipeline test (no budget check)...');

  const feeds = await fetchFeeds();
  logger.info(`📡 Fetched ${feeds.length} articles`);

  const article = feeds[0];
  if (!article) {
    logger.error('No articles found');
    return;
  }

  logger.info(`📰 Testing with: ${article.title}`);

  const content = await scrapeArticle(article.url);
  logger.info(`📄 Scraped: ${content ? content.length + ' chars' : 'null'}`);

  const summary = await summarizeArticle(article);
  if (!summary) {
    logger.error('Summarize failed');
    return;
  }

  logger.info('✅ Summary:');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));

  // eslint-disable-next-line no-console
  console.log('\n--- FORMATTED POST ---\n');
  // eslint-disable-next-line no-console
  console.log(formatPostTelegram(article, summary));
}

testPipeline().catch(console.error);
