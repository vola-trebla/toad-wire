// src/orchestration/special-pipeline.ts
import { saveArticle, markAsPosted } from '../ingestion/dedup.js';
import { logger } from '../utils/logger.js';
import { updateLastPosted } from '../health/server.js';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { generateText } from 'ai';
import { withToadEye } from 'toad-eye/vercel';
import { getModel } from '../llm/router.js';
import {
  buildMondayBriefingPrompt,
  buildWeeklySummaryPrompt,
} from '../prompts/summarize.prompt.js';
import { desc, gte } from 'drizzle-orm';
import { withPipelineMetrics, getFilteredScoredArticles } from './helpers.js';
import { publish, content } from '../delivery/publisher.js';

// ─── Monday Briefing ──────────────────────────────────────────────────────────

export async function runMondayBriefing(): Promise<void> {
  logger.info('🐸 Starting Monday briefing...');

  await withPipelineMetrics('monday', async () => {
    const { scored } = await getFilteredScoredArticles({
      withSimilarityFilter: false,
      withRecentTitles: false,
      withDedup: false,
    });

    const topHeadlines = scored.slice(0, 5).map((a) => a.title);

    const { text } = await generateText({
      model: getModel('weekly'),
      prompt: buildMondayBriefingPrompt('', '', topHeadlines),
      experimental_telemetry: withToadEye({ functionId: 'monday-briefing' }),
    });

    const post = text.trim();
    logger.info(`📝 Monday briefing:\n${post}`);

    for (const article of scored.slice(0, 5)) {
      await saveArticle(article);
      await markAsPosted(article.url);
    }

    await publish({ telegram: content(post), x: content(post) }, { telegramPlain: true });

    updateLastPosted();
    logger.info('✅ Monday briefing posted');
  });
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

export async function runWeeklySummary(): Promise<void> {
  logger.info('🐸 Starting weekly summary...');

  await withPipelineMetrics('weekly', async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekArticles = await db
      .select({
        title: articles.title,
        category: articles.category,
        sentiment: articles.sentiment,
        importanceScore: articles.importanceScore,
      })
      .from(articles)
      .where(gte(articles.createdAt, since))
      .orderBy(desc(articles.importanceScore))
      .limit(10);

    if (weekArticles.length === 0) {
      logger.warn('⚠️ No articles found for weekly summary');
      return;
    }

    const weekNumber = Math.ceil(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    const topArticles = weekArticles.map((a) => ({
      title: a.title,
      category: a.category ?? 'industry',
      sentiment: a.sentiment ?? 'neutral',
    }));

    const { text } = await generateText({
      model: getModel('weekly'),
      prompt: buildWeeklySummaryPrompt(topArticles, '', weekNumber),
      experimental_telemetry: withToadEye({ functionId: 'weekly-summary' }),
    });

    const post = text.trim();
    logger.info(`📝 Weekly summary:\n${post}`);

    await publish({ telegram: content(post), x: content(post) }, { telegramPlain: true });

    updateLastPosted();
    logger.info('✅ Weekly summary posted');
  });
}
