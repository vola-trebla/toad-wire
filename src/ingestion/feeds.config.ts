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
    url: 'https://www.technologyreview.com/feed/',
    source: 'MIT Technology Review',
    tier: 1,
    authority: 0.95,
    language: 'en',
    specialization: ['research', 'policy', 'ethics'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    source: 'The Verge AI',
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['product', 'industry', 'breaking'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    source: 'Ars Technica',
    tier: 1,
    authority: 0.9,
    language: 'en',
    specialization: ['research', 'technical', 'analysis'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    source: 'VentureBeat',
    tier: 1,
    authority: 0.85,
    language: 'en',
    specialization: ['enterprise', 'funding', 'industry'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source: 'TechCrunch',
    tier: 1,
    authority: 0.85,
    language: 'en',
    specialization: ['startups', 'funding', 'product'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },

  // ── Tier 2 — Signal ───────────────────────────────────────────────────────
  {
    url: 'https://www.artificialintelligence-news.com/feed/',
    source: 'AI News',
    tier: 2,
    authority: 0.8,
    language: 'en',
    specialization: ['industry', 'product', 'research'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://huggingface.co/blog/feed.xml',
    source: 'Hugging Face',
    tier: 2,
    authority: 0.85,
    language: 'en',
    specialization: ['open_source', 'models', 'tools'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://blog.google/technology/ai/rss/',
    source: 'Google AI Blog',
    tier: 2,
    authority: 0.85,
    language: 'en',
    specialization: ['research', 'product', 'infrastructure'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://openai.com/blog/rss.xml',
    source: 'OpenAI Blog',
    tier: 2,
    authority: 0.9,
    language: 'en',
    specialization: ['research', 'product', 'safety'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://www.anthropic.com/feed.xml',
    source: 'Anthropic Blog',
    tier: 2,
    authority: 0.9,
    language: 'en',
    specialization: ['safety', 'research', 'product'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://deepmind.google/blog/rss.xml',
    source: 'DeepMind Blog',
    tier: 2,
    authority: 0.9,
    language: 'en',
    specialization: ['research', 'breakthroughs'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence',
    source: 'IEEE Spectrum AI',
    tier: 2,
    authority: 0.8,
    language: 'en',
    specialization: ['engineering', 'standards', 'research'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },

  // ── Tier 3 — Expansion ────────────────────────────────────────────────────
  {
    url: 'https://thegradient.pub/rss/',
    source: 'The Gradient',
    tier: 3,
    authority: 0.8,
    language: 'en',
    specialization: ['analysis', 'research'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://importai.substack.com/feed',
    source: 'Import AI',
    tier: 3,
    authority: 0.85,
    language: 'en',
    specialization: ['research', 'digest'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://syncedreview.com/feed/',
    source: 'Synced Review',
    tier: 3,
    authority: 0.7,
    language: 'en',
    specialization: ['research', 'global'],
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
