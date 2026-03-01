import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '../llm/router.js';
import { trackRequest } from '../utils/request-budget.js';
import { type MarketSnapshot } from '../market/market-snapshot.js';
import { logger } from '../utils/logger.js';
import {
  buildMarketVibePrompt,
  buildPhilosophyPrompt,
  buildRawHeadlinesPrompt,
  buildDegenPrompt,
} from '../prompts/batch.prompt.js';

export type BatchType = 'market_vibe' | 'raw_headlines' | 'philosophy' | 'degen_time';

export interface MicroPost {
  text: string;
  hashtags: string[];
  mood: string;
  batchType: BatchType;
}

const MicroPostSchema = z.object({
  posts: z
    .array(
      z.object({
        text: z.string().max(280),
        hashtags: z.array(z.string()).min(1).max(3),
        mood: z.string(),
      }),
    )
    .min(5)
    .max(20),
});

const DegenPostSchema = z.object({
  text: z.string().max(200),
  hashtags: z.array(z.string()).min(2).max(6),
  mood: z.string(),
});

export async function generateBatch(
  type: BatchType,
  snapshot: MarketSnapshot,
): Promise<MicroPost[]> {
  logger.info(`🎲 Generating batch [${type}]...`);

  if (type === 'degen_time') {
    if (snapshot.unusedHeadlines.length === 0) {
      logger.warn('⚠️ No unused headlines for degen_time, skipping');
      return [];
    }

    const headline =
      snapshot.unusedHeadlines[Math.floor(Math.random() * snapshot.unusedHeadlines.length)]!;

    logger.info(`💊 DegenTime headline: "${headline}"`);
    trackRequest('batch:degen_time', 'flash-lite');

    try {
      const { object } = await generateObject({
        model: getModel('batch'),
        schema: DegenPostSchema,
        prompt: buildDegenPrompt(headline),
      });

      const post: MicroPost = {
        text: object.text,
        hashtags: object.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)),
        mood: object.mood,
        batchType: 'degen_time',
      };

      logger.info(`💊 DegenTime generated: ${post.text}`);
      return [post];
    } catch (error) {
      logger.error({ err: error }, '❌ DegenTime generation failed');
      return [];
    }
  }

  let prompt: string;

  switch (type) {
    case 'market_vibe':
      prompt = buildMarketVibePrompt(snapshot);
      break;
    case 'philosophy':
      prompt = buildPhilosophyPrompt(snapshot);
      break;
    case 'raw_headlines':
      prompt = buildRawHeadlinesPrompt(snapshot);
      break;
  }

  trackRequest(`batch:${type}`, 'flash-lite');

  const { object } = await generateObject({
    model: getModel('batch'),
    schema: MicroPostSchema,
    prompt,
  });

  const posts: MicroPost[] = object.posts.map((p) => ({
    text: p.text,
    hashtags: p.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)),
    mood: p.mood,
    batchType: type,
  }));

  logger.info(`✅ Generated ${posts.length} micro-posts [${type}]`);
  return posts;
}
