import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCircuitState,
  checkCircuit,
  recordSuccess,
  recordFailure,
  withCircuit,
} from '../utils/circuit-breaker.js';

describe('circuit-breaker — smoke tests', () => {
  let state: ReturnType<typeof createCircuitState>;

  beforeEach(() => {
    state = createCircuitState('test');
  });

  it('creates state with correct initial values', () => {
    expect(state.failures).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.name).toBe('test');
  });

  it('allows requests when circuit is closed', () => {
    expect(checkCircuit(state)).toBe(true);
  });

  it('blocks requests when circuit is open after threshold', () => {
    const logger = { warn: vi.fn() };
    for (let i = 0; i < 5; i++) recordFailure(state, logger);
    expect(state.isOpen).toBe(true);
    expect(checkCircuit(state)).toBe(false);
  });

  it('recordSuccess resets circuit', () => {
    state.isOpen = true;
    state.failures = 5;
    recordSuccess(state);
    expect(state.failures).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(checkCircuit(state)).toBe(true);
  });

  it('withCircuit returns result when call succeeds', async () => {
    const result = await withCircuit(state, async () => 'ok');
    expect(result).toBe('ok');
    expect(state.failures).toBe(0);
  });

  it('withCircuit returns null when circuit is open', async () => {
    const logger = { warn: vi.fn() };
    for (let i = 0; i < 5; i++) recordFailure(state, logger);
    const result = await withCircuit(state, async () => 'ok', logger);
    expect(result).toBe(null);
  });
});
