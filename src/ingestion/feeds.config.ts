/**
 * Feed Registry — single source of truth for all RSS sources.
 *
 * Tier 1 — Core: highest authority, stable feeds
 * Tier 2 — Signal: mid authority, specialised
 * Tier 3 — Expansion: added in Phase 2 (disabled by default)
 */

export interface FeedConfig {
  url: string;
  source: string;
  tier: 1 | 2 | 3;
  authority: number; // 0.0–1.0
  language: 'en' | 'es' | 'pt';
  specialization: string[];
  maxAgeHours: number;
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'dead';
  lastSuccessfulFetch?: string;
  consecutiveFailures: number;
}

export const FEEDS: FeedConfig[] = [
  // ── Tier 1 — Core ────────────────────────────────────────────────────────
  {
    url: 'https://coindesk.com/arc/outboundfeeds/rss/',
    source: 'CoinDesk',
    tier: 1,
    authority: 0.95,
    language: 'en',
    specialization: ['regulation', 'institutional', 'macro'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://theblock.co/rss.xml',
    source: 'The Block',
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['data', 'research', 'institutional'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://cointelegraph.com/rss',
    source: 'CoinTelegraph',
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['breaking', 'latam', 'broad'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://blockworks.co/feed',
    source: 'Blockworks',
    tier: 1,
    authority: 0.85,
    language: 'en',
    specialization: ['defi', 'institutional', 'macro'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://decrypt.co/feed',
    source: 'Decrypt',
    tier: 1,
    authority: 0.85,
    language: 'en',
    specialization: ['culture', 'technology', 'accessible'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },

  // ── Tier 2 — Signal ───────────────────────────────────────────────────────
  {
    url: 'https://www.dlnews.com/arc/outboundfeeds/rss/',
    source: 'DL News',
    tier: 2,
    authority: 0.8,
    language: 'en',
    specialization: ['defi', 'investigations'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://cryptobriefing.com/feed/',
    source: 'CryptoBriefing',
    tier: 2,
    authority: 0.75,
    language: 'en',
    specialization: ['defi', 'project-reviews'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://beincrypto.com/feed/',
    source: 'BeInCrypto',
    tier: 2,
    authority: 0.7,
    language: 'en',
    specialization: ['trading', 'mass-market'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://finbold.com/feed/',
    source: 'Finbold',
    tier: 2,
    authority: 0.65,
    language: 'en',
    specialization: ['fintech', 'trading'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },

  // ── Tier 3 — Expansion (Phase 2, disabled) ────────────────────────────────
  {
    url: 'https://www.criptonoticias.com/feed/',
    source: 'CriptoNoticias',
    tier: 3,
    authority: 0.8,
    language: 'es',
    specialization: ['latam'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://livecoins.com.br/feed/',
    source: 'Livecoins',
    tier: 3,
    authority: 0.7,
    language: 'pt',
    specialization: ['latam', 'brazil'],
    maxAgeHours: 12,
    enabled: false,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://protos.com/feed/',
    source: 'Protos',
    tier: 3,
    authority: 0.75,
    language: 'en',
    specialization: ['investigations'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://unchainedcrypto.com/feed/',
    source: 'Unchained',
    tier: 3,
    authority: 0.8,
    language: 'en',
    specialization: ['analysis'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
];

/** All active feeds (enabled + not dead) */
export function getActiveFeeds(): FeedConfig[] {
  return FEEDS.filter((f) => f.enabled && f.healthStatus !== 'dead');
}

/** Lookup by source name — used by scorer to read authority */
export function getFeedConfig(source: string): FeedConfig | undefined {
  return FEEDS.find((f) => f.source === source);
}
