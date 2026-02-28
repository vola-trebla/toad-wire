/**
 * Circuit Breaker
 *
 * Protects against cascading failures from external API calls.
 *
 * States:
 *   CLOSED  — normal operation, requests pass through
 *   OPEN    — too many failures, requests blocked
 *   HALF-OPEN — cooldown passed, one trial request allowed
 *
 * Usage:
 *   const scraperCircuit = createCircuitState();
 *   if (!checkCircuit(scraperCircuit)) return; // blocked
 *   try {
 *     await scrapeArticle(url);
 *     recordSuccess(scraperCircuit);
 *   } catch (error) {
 *     recordFailure(scraperCircuit);
 *   }
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const FAILURE_THRESHOLD = 5; // consecutive failures → open circuit
const RESET_MS = 5 * 60 * 1000; // 5 min cooldown before half-open

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  name: string;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createCircuitState(name: string): CircuitState {
  return { name, failures: 0, lastFailure: 0, isOpen: false };
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Returns true if request is allowed, false if circuit is open.
 * Handles HALF-OPEN transition automatically.
 */
export function checkCircuit(state: CircuitState): boolean {
  if (!state.isOpen) return true;

  // Half-open: allow one trial request after cooldown
  if (Date.now() - state.lastFailure > RESET_MS) {
    state.isOpen = false;
    state.failures = 0;
    return true;
  }

  return false;
}

export function recordSuccess(state: CircuitState): void {
  state.failures = 0;
  state.isOpen = false;
}

export function recordFailure(state: CircuitState, logger?: { warn: (msg: string) => void }): void {
  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= FAILURE_THRESHOLD) {
    state.isOpen = true;
    logger?.warn(
      `🔴 Circuit OPEN: ${state.name} (${state.failures} failures) — pausing for ${RESET_MS / 60000} min`,
    );
  }
}

/**
 * Wraps an async function with circuit breaker protection.
 * Returns null if circuit is open or if the call fails.
 */
export async function withCircuit<T>(
  state: CircuitState,
  fn: () => Promise<T>,
  logger?: { warn: (msg: string) => void },
): Promise<T | null> {
  if (!checkCircuit(state)) {
    logger?.warn(`⏸️ Circuit OPEN: ${state.name} — skipping`);
    return null;
  }

  try {
    const result = await fn();
    recordSuccess(state);
    return result;
  } catch (error) {
    recordFailure(state, logger);
    throw error;
  }
}
