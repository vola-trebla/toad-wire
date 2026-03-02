// src/orchestration/state.ts
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { botState } from '../db/schema.js';
import { createCircuitState } from '../utils/circuit-breaker.js';
import { createXBudgetState } from '../delivery/x-rate-limiter.js';
import { logger } from '../utils/logger.js';

// ─── Circuit Breakers ─────────────────────────────────────────────────────────
export const telegramCircuit = createCircuitState('telegram');
export const xCircuit = createCircuitState('x-api');
export const geminiCircuit = createCircuitState('gemini');

// ─── X Rate Limiter ───────────────────────────────────────────────────────────
// Persists in memory, resets on restart (acceptable trade-off)
export const xBudgetState = createXBudgetState();

// ─── Shared Pipeline State ────────────────────────────────────────────────────
// Unused headlines from last news pipeline run — shared between pipeline and batch
let _lastUnusedHeadlines: string[] = [];

export function getUnusedHeadlines(): string[] {
  return _lastUnusedHeadlines;
}

export function setUnusedHeadlines(headlines: string[]): void {
  _lastUnusedHeadlines = headlines;
}

// ─── Breaking News Lock ───────────────────────────────────────────────────────
// In-memory lock — prevents same article triggering twice during processing
export const breakingInProgress = new Set<string>();

// ─── Breaking News Cooldown ───────────────────────────────────────────────────
// Prevents breaking news spam — minimum 2 hours between breaking posts
const BREAKING_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const BREAKING_KEY = 'last_breaking_at';
let _lastBreakingAt: number | null = null;

export async function initBreakingCooldown(): Promise<void> {
  try {
    const row = db.select().from(botState).where(eq(botState.key, BREAKING_KEY)).get();
    if (row) {
      _lastBreakingAt = Number(row.value);
      logger.info(
        `⚡ Breaking cooldown restored: last post was ${new Date(_lastBreakingAt).toISOString()}`,
      );
    }
  } catch (err) {
    logger.warn(`⚠️ Could not restore breaking cooldown: ${err}`);
  }
}

export function canPostBreaking(): boolean {
  if (_lastBreakingAt === null) return true;
  return Date.now() - _lastBreakingAt > BREAKING_COOLDOWN_MS;
}

export function recordBreakingPost(): void {
  _lastBreakingAt = Date.now();
  try {
    db.insert(botState)
      .values({ key: BREAKING_KEY, value: String(_lastBreakingAt) })
      .onConflictDoUpdate({
        target: botState.key,
        set: { value: String(_lastBreakingAt), updatedAt: new Date().toISOString() },
      })
      .run();
  } catch (err) {
    logger.warn(`⚠️ Could not persist breaking cooldown: ${err}`);
  }
  logger.info(`⚡ Breaking cooldown started — next breaking allowed in 2h`);
}
