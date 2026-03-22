import { generateText, Output } from 'ai';
import { withToadEye } from 'toad-eye/vercel';
import { z } from 'zod';
import { getModel } from '../llm/router.js';
import { trackRequest } from '../utils/request-budget.js';
import { type NewsContext } from '../context/news-context.js';
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

export async function generateBatch(type: BatchType, snapshot: NewsContext): Promise<MicroPost[]> {
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
      const { output } = await generateText({
        model: getModel('batch'),
        prompt: buildDegenPrompt(headline),
        output: Output.object({
          schema: DegenPostSchema,
        }),
        experimental_telemetry: withToadEye({ functionId: 'batch-degen-time' }),
      });

      const post: MicroPost = {
        text: output.text,
        hashtags: output.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)),
        mood: output.mood,
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

  const { output } = await generateText({
    model: getModel('batch'),
    prompt,
    output: Output.object({
      schema: MicroPostSchema,
    }),
    experimental_telemetry: withToadEye({ functionId: `batch-${type}` }),
  });

  const posts: MicroPost[] = output.posts.map((p) => ({
    text: p.text,
    hashtags: p.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)),
    mood: p.mood,
    batchType: type,
  }));

  logger.info(`✅ Generated ${posts.length} micro-posts [${type}]`);
  return posts;
}
