import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '../llm/router.js';
import { trackRequest } from '../utils/request-budget.js';
import { type MarketSnapshot } from '../sources/market-snapshot.js';
import { logger } from '../utils/logger.js';

export type BatchType = 'market_vibe' | 'raw_headlines' | 'philosophy';

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

function buildMarketVibePrompt(snapshot: MarketSnapshot): string {
  const priceLines = snapshot.prices
    .map(
      (p) =>
        `${p.symbol}: $${p.price.toLocaleString()} (${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`,
    )
    .join('\n');

  const fng = snapshot.fearGreed
    ? `Fear & Greed: ${snapshot.fearGreed.value} — ${snapshot.fearGreed.classification}`
    : 'Fear & Greed: no disponible';

  const moodMap = {
    extreme_fear: 'pánico total',
    fear: 'miedo e incertidumbre',
    neutral: 'calma tensa',
    greed: 'codicia creciente',
    extreme_greed: 'euforia total',
  };

  return `
Eres El Sapo Cripto. Observador, irónico, jamás hype. Ya lo has visto todo.

Estado actual del mercado:
${priceLines}
${fng}
Sentimiento: ${moodMap[snapshot.marketMood]}
Momento: ${snapshot.timeOfDay}

Genera 12 micro-posts únicos para X/Twitter.
Reglas:
- Máx 280 caracteres por post
- Cada post debe mencionar al menos UN dato concreto del snapshot (precio, %, F&G o activo)
- 1-3 hashtags en campo separado, emoji en mood
- Español latinoamericano
- Sin consejos financieros ni predicciones
- Sin repetir estructura entre posts
- Menciona cada activo máximo 2 veces en total entre todos los posts
`.trim();
}

function buildPhilosophyPrompt(snapshot: MarketSnapshot): string {
  const moodMap = {
    extreme_fear: 'pánico total',
    fear: 'miedo e incertidumbre',
    neutral: 'calma y observación',
    greed: 'codicia creciente',
    extreme_greed: 'euforia descontrolada',
  };

  return `
Eres El Sapo Cripto. Rana sabia del pantano cripto.
Mercado ahora: ${moodMap[snapshot.marketMood]}. Hora: ${snapshot.timeOfDay}.

Genera 15 frases filosóficas cortas (máx 200 caracteres).
Tema: paciencia, el agua como metáfora, observar vs reaccionar.
Cada frase: única, poética sin patetismo, personalidad del Sapo.
1-2 hashtags en campo separado. Español latinoamericano.
Sin consejos financieros ni predicciones.
`.trim();
}

function buildRawHeadlinesPrompt(snapshot: MarketSnapshot): string {
  if (snapshot.unusedHeadlines.length === 0) {
    throw new Error('No unused headlines available for raw_headlines batch');
  }

  const headlinesList = snapshot.unusedHeadlines
    .slice(0, 25)
    .map((h, i) => `${i + 1}. ${h}`)
    .join('\n');

  return `
Eres El Sapo Cripto — una rana irónica y tranquila que reacciona a noticias cripto.

Aquí hay titulares de noticias cripto recientes:
${headlinesList}

Para cada titular genera UNA reacción corta (máx 280 caracteres) en la voz del Sapo:
- No resumas la noticia — REACCIONA a ella
- Ironía suave, observación aguda, calma absoluta
- Como alguien que ya vio esto mil veces
- 1-2 hashtags en el campo hashtags
- Emoji representativo en el campo mood
- Español latinoamericano

Genera entre 10 y 15 posts (no necesariamente uno por titular — elige los más interesantes).
Prohibido: consejos financieros, predicciones, hype.
`.trim();
}

export async function generateBatch(
  type: BatchType,
  snapshot: MarketSnapshot,
): Promise<MicroPost[]> {
  logger.info(`🎲 Generating batch [${type}]...`);

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
