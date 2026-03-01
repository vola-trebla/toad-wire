// src/prompts/prices.prompt.ts

export const MORNING_OPENERS = [
  '🌅 Buenos días, mis sapos. Arrancamos el día… 💹',
  '🌄 Amaneció en el pantano y el mercado ya se mueve 👀',
  '🌞 Despierten, sapos — hoy huele a volatilidad 💧📈',
  '🌤️ Nuevo día, nuevas velas. Vámonos al lío ⚡📊',
  '🌄 El sol sube… y algunas monedas también (otras lloran) 📉📈',
  '🌅 El pantano despierta con rumores del mercado 🔍',
  '🌞 Buenos días, sapos. Hoy cazamos narrativa, no humo 💨',
  '🌤️ El mercado abre un ojo… y nosotros abrimos los dos 🧠',
  '🌄 Señales frescas desde el pantano — atentos, sapos 📡',
  '🌞 La mañana trae oportunidades… si sabes olerlas 💹',
] as const;

export function buildPricesHookPrompt(
  symbol: string,
  change24h: number,
  fearGreedValue: number | undefined,
  fearGreedLabel: string,
): string {
  return `You are El Sapo Cripto — a crypto analyst with calm irony and sharp observations.
Write ONE punchy opening line in Latin American Spanish for a market update tweet.
Context: ${symbol} is ${change24h > 0 ? 'up' : 'down'} ${change24h.toFixed(1)}% today. Fear & Greed index: ${fearGreedValue ?? 'unknown'} (${fearGreedLabel}).
Rules:
- Max 60 characters
- No emojis (added externally)
- Sapo voice: ironic, calm, sharp
- One observation only, no advice`.trim();
}
