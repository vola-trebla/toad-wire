import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { type FearGreedData, formatFearGreed } from './feargreed.js';
import { generateText } from 'ai';
import { getModel } from '../llm/router.js';
import { MORNING_OPENERS, buildPricesHookPrompt } from '../prompts/prices.prompt.js';

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
  const coins = prices.filter((c) => ['BTC', 'ETH', 'SOL', 'BNB'].includes(c.symbol));

  const lines = coins.map((coin) => {
    const price = `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return `${getCoinEmoji(coin.symbol)} #${coin.symbol}  ${price} | ${formatChange(coin.change24h)}`;
  });

  const fg = fearGreed ? formatFearGreed(fearGreed.value) : '';

  let hook = '';
  try {
    const best = [...coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0];
    if (best) {
      const { text } = await generateText({
        model: getModel('batch'),
        prompt: buildPricesHookPrompt(
          best.symbol,
          best.change24h,
          fearGreed?.value,
          fearGreed ? formatFearGreed(fearGreed.value) : '',
        ),
      });
      hook = text.trim().slice(0, 80);
    }
  } catch {
    // Fallback — no hook
  }

  return `${randomMorningOpener()}

${lines.join('\n')}

${hook ? `${hook} 👀\n` : ''}${fg}

#Mercado #Latam #Cripto`;
}

function formatChange(change: number): string {
  const abs = Math.abs(change);
  let emoji: string;

  if (abs < 0.1) {
    emoji = '⚖️';
  } else if (change > 0) {
    if (change >= 5) emoji = '🚀';
    else emoji = '📈';
  } else {
    if (change <= -5) emoji = '💀';
    else emoji = '📉';
  }

  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% ${emoji}`;
}

function getCoinEmoji(symbol: string): string {
  const map: Record<string, string> = {
    BTC: '🟠', // Bitcoin
    ETH: '🔹', // Ethereum
    SOL: '🟣', // Solana
    BNB: '🟡', // Binance Coin
    DOGE: '🐕',
  };
  return map[symbol] ?? '🌑';
}
