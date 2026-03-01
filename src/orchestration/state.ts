// src/orchestration/state.ts
import { createCircuitState } from '../utils/circuit-breaker.js';
import { createXBudgetState } from '../delivery/x-rate-limiter.js';

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
