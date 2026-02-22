import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { type FeedArticle } from '../sources/rss.js';
import { logger } from '../utils/logger.js';

const RankingSchema = z.object({
  selected: z.array(z.number()).min(1).max(5),
});

export async function rankArticles(
  articles: FeedArticle[],
  limit: number = 3,
): Promise<FeedArticle[]> {
  try {
    const list = articles
      .slice(0, 20)
      .map((a, i) => `${i}. [${a.source}] ${a.title}`)
      .join('\n');

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: RankingSchema,
      prompt: `
Eres el editor de El Sapo Cripto — canal de noticias cripto para Latinoamérica.

Aquí hay una lista de titulares de noticias cripto de hoy:
${list}

Selecciona los índices de los ${limit} titulares MÁS importantes e interesantes para nuestra audiencia latinoamericana.

Criterios (en orden de prioridad):
1. Breaking news o eventos de alto impacto (hacks, regulación, ETF, SEC, quiebras)
2. Relevancia para BTC, ETH, SOL y mercado general
3. Historias curiosas o sorprendentes con potencial viral
4. Diversidad de temas (no selecciones 2 noticias del mismo tema)

Responde solo con los índices numéricos de los titulares seleccionados.
      `.trim(),
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
