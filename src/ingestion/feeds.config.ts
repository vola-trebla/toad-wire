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
  // ── Tier 1 — Core (daily, high quality AI news) ───────────────────────────
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

  // ── Tier 2 — Signal (AI labs + specialized) ───────────────────────────────
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
    url: 'https://openai.com/news/rss.xml',
    source: 'OpenAI',
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
    url: 'https://www.marktechpost.com/feed/',
    source: 'MarkTechPost',
    tier: 2,
    authority: 0.8,
    language: 'en',
    specialization: ['research', 'papers', 'analysis'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },
  {
    url: 'https://simonwillison.net/atom/entries/',
    source: 'Simon Willison',
    tier: 2,
    authority: 0.85,
    language: 'en',
    specialization: ['llm', 'tools', 'analysis'],
    maxAgeHours: 12,
    enabled: true,
    healthStatus: 'healthy',
    consecutiveFailures: 0,
  },

  // ── Tier 3 — Expansion ────────────────────────────────────────────────────
  {
    url: 'https://feeds.feedburner.com/TheHackersNews',
    source: 'The Hacker News',
    tier: 3,
    authority: 0.8,
    language: 'en',
    specialization: ['security', 'vulnerabilities', 'threats'],
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
];

/** All active feeds (enabled + not dead) */
export function getActiveFeeds(): FeedConfig[] {
  return FEEDS.filter((f) => f.enabled && f.healthStatus !== 'dead');
}

/** Lookup by source name — used by scorer to read authority */
export function getFeedConfig(source: string): FeedConfig | undefined {
  return FEEDS.find((f) => f.source === source);
}
