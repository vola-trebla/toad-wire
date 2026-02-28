/**
 * X (Twitter) Rate Limiter
 *
 * Enforces deterministic posting limits to prevent account suspension.
 * All times are in UTC-3 (America/Montevideo).
 *
 * Limits:
 *   - 45 tweets/day  (API limit: 50, buffer: 5)
 *   - 8 tweets/hour  (organic pattern)
 *   - min 10 min between posts
 *   - max 25 min between posts (for organic randomness)
 *   - quiet hours: 23:00–07:00 UTC-3
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const X_DAILY_LIMIT = 45;
const X_HOURLY_LIMIT = 8;
const MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 min
const MAX_INTERVAL_MS = 25 * 60 * 1000; // 25 min
const QUIET_HOURS_START = 23; // 23:00 UTC-3
const QUIET_HOURS_END = 7; //  07:00 UTC-3
const UTC_OFFSET_HOURS = -3;

// ─── Types ───────────────────────────────────────────────────────────────────

export type CanTweetDenyReason = 'quiet_hours' | 'daily_limit' | 'hourly_limit' | 'too_frequent';

export interface CanTweetResult {
  allowed: boolean;
  reason?: CanTweetDenyReason;
}

export interface XBudgetState {
  /** Calendar date string in UTC-3: 'YYYY-MM-DD' */
  date: string;
  tweetsToday: number;
  tweetsThisHour: number;
  /** Hour bucket key: 'YYYY-MM-DD-HH' in UTC-3 */
  lastHourKey: string;
  /** Timestamp of last successful tweet (Date.now()) */
  lastTweetAt: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns current date/time adjusted to UTC-3.
 */
function nowUTC3(): Date {
  return new Date(Date.now() + UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Returns current date string in UTC-3: 'YYYY-MM-DD'.
 */
function todayKey(): string {
  return nowUTC3().toISOString().slice(0, 10);
}

/**
 * Returns current hour bucket key in UTC-3: 'YYYY-MM-DD-HH'.
 */
function hourKey(): string {
  const d = nowUTC3();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  return `${d.toISOString().slice(0, 10)}-${hh}`;
}

/**
 * Returns current hour (0–23) in UTC-3.
 */
function currentHourUTC3(): number {
  return nowUTC3().getUTCHours();
}

// ─── State factory ───────────────────────────────────────────────────────────

/**
 * Creates a fresh XBudgetState for the current day.
 * Call once at startup, then mutate in place.
 */
export function createXBudgetState(): XBudgetState {
  return {
    date: todayKey(),
    tweetsToday: 0,
    tweetsThisHour: 0,
    lastHourKey: hourKey(),
    lastTweetAt: 0,
  };
}

// ─── Core logic ──────────────────────────────────────────────────────────────

/**
 * Checks all rate-limit conditions.
 * Mutates `state` to reset hourly/daily counters when boundaries are crossed.
 * Does NOT increment counters — call `recordTweet()` after a successful post.
 */
export function canTweet(state: XBudgetState): CanTweetResult {
  // Reset daily counter if the UTC-3 date has rolled over
  const today = todayKey();
  if (state.date !== today) {
    state.date = today;
    state.tweetsToday = 0;
  }

  // Reset hourly counter if the hour bucket has changed
  const currentHour = hourKey();
  if (state.lastHourKey !== currentHour) {
    state.lastHourKey = currentHour;
    state.tweetsThisHour = 0;
  }

  const hour = currentHourUTC3();

  // Quiet hours: 23:00–07:00 UTC-3
  const isQuiet = hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
  if (isQuiet) {
    return { allowed: false, reason: 'quiet_hours' };
  }

  // Daily cap
  if (state.tweetsToday >= X_DAILY_LIMIT) {
    return { allowed: false, reason: 'daily_limit' };
  }

  // Hourly cap
  if (state.tweetsThisHour >= X_HOURLY_LIMIT) {
    return { allowed: false, reason: 'hourly_limit' };
  }

  // Minimum interval between posts
  if (state.lastTweetAt > 0 && Date.now() - state.lastTweetAt < MIN_INTERVAL_MS) {
    return { allowed: false, reason: 'too_frequent' };
  }

  return { allowed: true };
}

/**
 * Records a successful tweet.
 * Call immediately after `postTweet()` returns true.
 */
export function recordTweet(state: XBudgetState): void {
  state.tweetsToday++;
  state.tweetsThisHour++;
  state.lastTweetAt = Date.now();
}

/**
 * Returns a randomised delay (ms) within the organic posting window.
 * Use as the interval between micro-post dispatch cycles.
 */
export function getNextTweetDelay(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

/**
 * Returns a human-readable budget summary for logging.
 */
export function formatBudgetStatus(state: XBudgetState): string {
  return `tweets today: ${state.tweetsToday}/${X_DAILY_LIMIT}, this hour: ${state.tweetsThisHour}/${X_HOURLY_LIMIT}`;
}
