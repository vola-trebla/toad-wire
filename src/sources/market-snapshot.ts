import { fetchPrices, type CoinPrice } from './prices.js';
import { fetchFearGreed, type FearGreedData } from './feargreed.js';
import { logger } from '../utils/logger.js';

export type MarketMood = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// ─── v2.0: Volatility types ──────────────────────────────────────────────────

export interface VolatilityAlert {
  symbol: string;
  type: 'pump' | 'dump';
  change1h: number;
  change24h: number;
  severity: 'low' | 'medium' | 'high' | 'extreme';
}

export interface MarketSnapshot {
  prices: CoinPrice[];
  fearGreed: FearGreedData | null;
  unusedHeadlines: string[];
  marketMood: MarketMood;
  timeOfDay: TimeOfDay;
  // v2.0 additions
  volatilityAlerts: VolatilityAlert[];
}

// ─── v2.0: Snapshot cache ────────────────────────────────────────────────────

let cachedSnapshot: MarketSnapshot | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── v2.0: Volatility detection ──────────────────────────────────────────────

function getSeverity(change1h: number, change24h: number): VolatilityAlert['severity'] {
  const abs1h = Math.abs(change1h);
  const abs24h = Math.abs(change24h);
  if (abs1h > 8 || abs24h > 15) return 'extreme';
  if (abs1h > 5 || abs24h > 10) return 'high';
  if (abs1h > 3 || abs24h > 7) return 'medium';
  return 'low';
}

function detectVolatility(prices: CoinPrice[]): VolatilityAlert[] {
  const alerts: VolatilityAlert[] = [];

  for (const coin of prices) {
    const abs1h = Math.abs(coin.change1h);
    const abs24h = Math.abs(coin.change24h);

    // Only alert if movement is notable
    if (abs1h < 2 && abs24h < 5) continue;

    const severity = getSeverity(coin.change1h, coin.change24h);

    alerts.push({
      symbol: coin.symbol,
      type: coin.change1h >= 0 ? 'pump' : 'dump',
      change1h: coin.change1h,
      change24h: coin.change24h,
      severity,
    });
  }

  // Sort by severity: extreme first
  const order = { extreme: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function collectMarketSnapshot(
  unusedHeadlines: string[] = [],
): Promise<MarketSnapshot> {
  // Return cached snapshot if fresh (preserve unusedHeadlines from caller)
  if (cachedSnapshot && Date.now() - cacheTime < CACHE_TTL_MS) {
    logger.info('📸 Market snapshot from cache');
    return { ...cachedSnapshot, unusedHeadlines };
  }

  logger.info('📸 Collecting market snapshot...');

  const [prices, fearGreed] = await Promise.all([fetchPrices(), fetchFearGreed()]);

  const volatilityAlerts = detectVolatility(prices);

  if (volatilityAlerts.length > 0) {
    const summary = volatilityAlerts
      .map((a) => `${a.symbol} ${a.type} ${a.severity} (1h: ${a.change1h.toFixed(1)}%)`)
      .join(', ');
    logger.info(`⚡ Volatility alerts: ${summary}`);
  }

  const snapshot: MarketSnapshot = {
    prices,
    fearGreed,
    unusedHeadlines,
    marketMood: getMarketMood(fearGreed?.value ?? null),
    timeOfDay: getTimeOfDay(),
    volatilityAlerts,
  };

  // Update cache (without unusedHeadlines — those are caller-specific)
  cachedSnapshot = { ...snapshot, unusedHeadlines: [] };
  cacheTime = Date.now();

  logger.info(
    `📸 Snapshot ready — mood: ${snapshot.marketMood}, time: ${snapshot.timeOfDay}, ` +
      `alerts: ${volatilityAlerts.length}, headlines: ${unusedHeadlines.length}`,
  );

  return snapshot;
}

/**
 * Invalidates the snapshot cache.
 * Call if you need fresh market data outside the normal TTL.
 */
export function invalidateSnapshotCache(): void {
  cachedSnapshot = null;
  cacheTime = 0;
}
