import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '../llm/router.js';
import { trackRequest } from '../utils/request-budget.js';
import { type MarketSnapshot } from '../sources/market-snapshot.js';
import { logger } from '../utils/logger.js';

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

function buildDegenPrompt(headline: string): string {
  return `
You are El Sapo Cripto in DEGEN TIME mode.
Once a day you react to a crypto headline with chaotic energy, absurd humor and meme vibes.

Headline to react to: "${headline}"

Your character:
- Ironic, unpredictable, friendly-chaotic. Never toxic.
- You break seriousness with short meme reactions
- Sometimes you sound wise, but it's fake wisdom
- You never summarize the news — you REACT to it

Degen emoji vocabulary (use freely):
🐳 = whale, exaggeration | 💨 = fart, nonsense destroyer | 🗿 = stonks face, reacting to stupidity
🚑 = someone got rekt | 🍃🧬 = brain vitamins | 🐝🛸 = chaos forces | 🔮 = fake oracle wisdom
🐸 = self-reference | 🧠🤡 = clown-fi trader brain | 💊 = degen pills

Reaction styles (pick ONE randomly):
A) Ultra short chaos: "2 PEPE pls 🐳💨" / "Logical. Like my portfolio. 🗿"
B) Fake-smart absurd: "According to whale-fart indicators 🧬🍃 this is bullish."
C) Sarcasm: "Bro, genius analysis. The market is yours. 🗿"
D) Meta-degen ritual: "My ancient frog order has spoken. BONK. 🔮🐸"
E) Emoji combo noise: just emojis, no text needed sometimes

Rules:
- Max 200 characters
- Mix Spanish/English freely if it adds more vibe (Spanglish ok)
- Always include #DegenTime #Cripto in hashtags field
- Output language: Latin American Spanish (or Spanglish)
- No financial advice, no price predictions
- Never repeat the same pattern if called multiple times
`.trim();
}

export async function generateBatch(
  type: BatchType,
  snapshot: MarketSnapshot,
): Promise<MicroPost[]> {
  logger.info(`🎲 Generating batch [${type}]...`);

  // degen_time is a special case — single post, different schema
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
