import { generateObject } from 'ai';
import { z } from 'zod';
import { type FeedArticle } from '../ingestion/rss.js';
import { logger } from '../utils/logger.js';
import { canMakeRequest, trackRequest } from '../utils/request-budget.js';
import { getModel } from '../llm/router.js';
import { scoreArticles } from './scorer.js';
import { buildRankerPrompt } from '../prompts/ranker.prompt.js';

const RankingSchema = z.object({
  selected: z.array(z.number()).min(1).max(5),
});

export async function rankArticles(
  articles: FeedArticle[],
  limit: number = 3,
): Promise<FeedArticle[]> {
  try {
    if (!canMakeRequest()) {
      logger.warn('⚠️ Budget exhausted, fallback to original order');
      return articles.slice(0, limit);
    }

    const scored = scoreArticles(articles.slice(0, 20));

    const list = scored
      .map((a, i) => `${i}. [score:${a.importanceScore.toFixed(2)}] [${a.source}] ${a.title}`)
      .join('\n');

    trackRequest('ranker', 'flash');

    const { object } = await generateObject({
      model: getModel('ranking'),
      schema: RankingSchema,
      prompt: buildRankerPrompt(list, limit),
    });

    const selected = object.selected
      .filter((i) => i >= 0 && i < articles.length)
      .slice(0, limit)
      .map((i) => articles[i]!);

    logger.info(`🎯 Ranker seleccionó: ${selected.map((a) => a.title).join(' | ')}`);
    return selected;
  } catch (error) {
    logger.error({ err: error }, '❌ Ranker failed, fallback to original order');
    return articles.slice(0, limit);
  }
}
