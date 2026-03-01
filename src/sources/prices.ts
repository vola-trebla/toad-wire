import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { type FearGreedData, formatFearGreed } from './feargreed.js';
import { generateText } from 'ai';
import { getModel } from '../llm/router.js';

export interface CoinPrice {
  name: string;
  symbol: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
}

const COINS = 'BTC,ETH,SOL,DOGE';

export async function fetchPrices(): Promise<CoinPrice[]> {
  try {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${COINS}&convert=USD`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': config.COINMARKETCAP_API_KEY,
        Accept: 'application/json',
      },
    });

    const json = (await response.json()) as {
      data: Record<
        string,
        {
          name: string;
          symbol: string;
          quote: {
            USD: {
              price: number;
              percent_change_1h: number;
              percent_change_24h: number;
              percent_change_7d: number;
            };
          };
        }
      >;
    };

    return Object.values(json.data).map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.quote.USD.price,
      change1h: coin.quote.USD.percent_change_1h,
      change24h: coin.quote.USD.percent_change_24h,
      change7d: coin.quote.USD.percent_change_7d,
    }));
  } catch (error) {
    logger.error(`❌ Failed to fetch prices: ${error}`);
    return [];
  }
}

const MORNING_OPENERS = [
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
];

function randomMorningOpener(): string {
  return MORNING_OPENERS[Math.floor(Math.random() * MORNING_OPENERS.length)]!;
}

export function formatPricesPost(prices: CoinPrice[], fearGreed?: FearGreedData | null): string {
  const lines = prices.map((coin) => {
    const price =
      coin.price < 0.01
        ? `$${coin.price.toFixed(6)}`
        : `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

    return `${getCoinEmoji(coin.symbol)} #${coin.symbol} ${price}\n   1h: ${formatChange(coin.change1h)}\n   24h: ${formatChange(coin.change24h)}\n   7d: ${formatChange(coin.change7d)}`;
  });

  const fearGreedLine = fearGreed ? `\n🧠 Fear & Greed: ${formatFearGreed(fearGreed.value)}` : '';

  return `${randomMorningOpener()}

Así amanece el mercado hoy:
${fearGreedLine}

${lines.join('\n\n')}

Datos: CoinMarketCap 📊`;
}

export async function formatPricesPostX(
  prices: CoinPrice[],
  fearGreed?: FearGreedData | null,
): Promise<string> {
  const coins = prices.filter((c) => ['BTC', 'ETH'].includes(c.symbol));

  const lines = coins.map((coin) => {
    const price = `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return `${getCoinEmoji(coin.symbol)} ${coin.symbol}  ${price}  ${formatChange(coin.change24h)}`;
  });

  const fg = fearGreed ? formatFearGreed(fearGreed.value) : '';

  // Flash-Lite hook — one sharp observation
  let hook = '';
  try {
    const best = [...coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0];
    const { text } = await generateText({
      model: getModel('batch'),
      prompt: `You are El Sapo Cripto — a crypto analyst with calm irony and sharp observations.
Write ONE punchy opening line in Latin American Spanish for a market update tweet.
Context: ${best?.symbol} is ${best && best.change24h > 0 ? 'up' : 'down'} ${best?.change24h.toFixed(1)}% today. Fear & Greed index: ${fearGreed?.value ?? 'unknown'} (${fearGreed ? formatFearGreed(fearGreed.value) : ''}).
Rules:
- Max 60 characters
- No emojis (added externally)
- Sapo voice: ironic, calm, sharp
- One observation only, no advice`,
    });
    hook = text.trim().slice(0, 80);
  } catch {
    // Fallback — no hook
  }

  return `${randomMorningOpener()}

${lines.join('\n')}

${hook ? `${hook} 👀\n` : ''}${fg}

#Bitcoin #Ethereum #Cripto`;
}

function formatChange(change: number): string {
  const abs = Math.abs(change);

  let emoji: string;

  if (abs < 0.05) {
    emoji = '🌫️';
  } else if (change > 0) {
    if (change >= 2) emoji = '🔥🔥';
    else emoji = '🔥';
  } else {
    if (change <= -3) emoji = '🌪️';
    else emoji = '💧';
  }

  const sign = change > 0 ? '+' : '';
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

function getCoinEmoji(symbol: string): string {
  const map: Record<string, string> = {
    BTC: '₿',
    ETH: '💎',
    SOL: '☀️',
    DOGE: '🐶',
  };
  return map[symbol] ?? '🪙';
}
