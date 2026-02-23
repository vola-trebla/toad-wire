import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { type FearGreedData, formatFearGreed } from './feargreed.js';

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

export function formatPricesPost(prices: CoinPrice[], fearGreed?: FearGreedData | null): string {
    const lines = prices.map((coin) => {
        const price =
            coin.price < 0.01
                ? `$${coin.price.toFixed(6)}`
                : `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

        return `${getCoinEmoji(coin.symbol)} *${coin.symbol}* ${price}\n   1h: ${formatChange(coin.change1h)}\n   24h: ${formatChange(coin.change24h)}\n   7d: ${formatChange(coin.change7d)}`;
    });

    const fearGreedLine = fearGreed
        ? `\n🧠 *Fear & Greed:* ${formatFearGreed(fearGreed.value)}`
        : '';

    return `🌅 *Buenos días mis sapos* 🐸

Así amanece el mercado hoy:
${fearGreedLine}

${lines.join('\n\n')}

_Datos: CoinMarketCap_`;
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
