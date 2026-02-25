import { fetchPrices, type CoinPrice } from './prices.js';
import { fetchFearGreed, type FearGreedData } from './feargreed.js';
import { logger } from '../utils/logger.js';

export type MarketMood = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface MarketSnapshot {
  prices: CoinPrice[];
  fearGreed: FearGreedData | null;
  unusedHeadlines: string[];
  marketMood: MarketMood;
  timeOfDay: TimeOfDay;
}

function getMarketMood(fearGreedValue: number | null): MarketMood {
  if (fearGreedValue === null) return 'neutral';
  if (fearGreedValue <= 25) return 'extreme_fear';
  if (fearGreedValue <= 45) return 'fear';
  if (fearGreedValue <= 55) return 'neutral';
  if (fearGreedValue <= 75) return 'greed';
  return 'extreme_greed';
}

function getTimeOfDay(): TimeOfDay {
  // UTC-3 Montevideo
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export async function collectMarketSnapshot(
  unusedHeadlines: string[] = [],
): Promise<MarketSnapshot> {
  logger.info('📸 Collecting market snapshot...');

  const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

  const snapshot: MarketSnapshot = {
    prices,
    fearGreed,
    unusedHeadlines,
    marketMood: getMarketMood(fearGreed?.value ?? null),
    timeOfDay: getTimeOfDay(),
  };

  logger.info(
    `📸 Snapshot ready — mood: ${snapshot.marketMood}, time: ${snapshot.timeOfDay}, headlines: ${unusedHeadlines.length}`,
  );

  return snapshot;
}
