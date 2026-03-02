// src/orchestration/state.ts
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
const BREAKING_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
let _lastBreakingAt: number | null = null;

export function canPostBreaking(): boolean {
  if (_lastBreakingAt === null) return true;
  return Date.now() - _lastBreakingAt > BREAKING_COOLDOWN_MS;
}

export function recordBreakingPost(): void {
  _lastBreakingAt = Date.now();
  logger.info(`⚡ Breaking cooldown started — next breaking allowed in 2h`);
}
