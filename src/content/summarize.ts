import 'dotenv/config';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { type FeedArticle } from '../ingestion/rss.js';
import { scrapeArticle } from '../ingestion/scraper.js';
import { logger } from '../utils/logger.js';
import { truncateToWord } from '../utils/truncate.js';
import { canMakeRequest, trackRequest } from '../utils/request-budget.js';
import { getModel } from '../llm/router.js';
import {
  SUMMARIZE_SYSTEM_PROMPT,
  buildSummarizeUserPrompt,
  buildGoodnightPrompt,
  NIGHT_OPENERS,
} from '../prompts/summarize.prompt.js';

const SummarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  thought: z.string().describe('Comentario breve y con personalidad del Sapo, máx 100 caracteres'),
  tags: z.array(z.string()).min(3).max(3),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']),
  emoji: z.string(),
  category: z.enum(['regulacion', 'defi', 'trading', 'seguridad', 'tecnologia', 'latam']),
  tweet: z.string().describe('Versión compacta para X/Twitter, máx 260 caracteres'),
  entities: z.object({
    companies: z.array(z.string()).max(5),
    people: z.array(z.string()).max(3),
    assets: z.array(z.string()).max(5),
    protocols: z.array(z.string()).max(3),
    regulators: z.array(z.string()).max(3),
  }),
});

export type Summary = z.infer<typeof SummarySchema>;

export async function summarizeArticle(article: FeedArticle): Promise<Summary | null> {
  if (!canMakeRequest()) {
    logger.warn('⚠️ Daily LLM budget exhausted, skipping article');
    return null;
  }

  try {
    const safeTitle = article.title.slice(0, 300);
    const rawContent = await scrapeArticle(article.url);
    const content = rawContent ? rawContent.slice(0, 1500) : null;

    trackRequest('summarize', 'flash');

    const { output: result } = await generateText({
      model: getModel('news'),
      system: SUMMARIZE_SYSTEM_PROMPT,
      prompt: buildSummarizeUserPrompt(safeTitle, article.source, content),
      output: Output.object({ schema: SummarySchema }),
    });

    const normalized: Summary = {
      ...result,
      tags: result.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)),
      title: truncateToWord(result.title, 80),
      summary: truncateToWord(result.summary, 700),
      thought: truncateToWord(result.thought, 100),
      tweet: truncateToWord(result.tweet, 260),
      emoji: result.emoji.slice(0, 6),
    };

    logger.info(`🧠 Summarized [${normalized.category}]: ${safeTitle}`);
    return normalized;
  } catch (error) {
    logger.error({ err: error }, `❌ Failed to summarize: ${article.title}`);
    return null;
  }
}

function randomOpener(): string {
  return NIGHT_OPENERS[Math.floor(Math.random() * NIGHT_OPENERS.length)]!;
}

export async function generateGoodNight(): Promise<string> {
  if (!canMakeRequest()) {
    return `🌙 Buenas noches mis sapos 🌚\n\nA descansar, que mañana el mercado sigue ahí. (O no) 😄`;
  }

  try {
    trackRequest('goodnight', 'flash-lite');

    const { text } = await generateText({
      model: getModel('goodnight'),
      prompt: buildGoodnightPrompt(),
    });

    return `${randomOpener()}\n\n${text}`;
  } catch {
    return `${randomOpener()}\n\nA descansar, que mañana el mercado sigue ahí. (O no) 😄`;
  }
}
