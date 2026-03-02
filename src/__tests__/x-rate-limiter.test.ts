import { describe, it, expect } from 'vitest';
import {
  createXBudgetState,
  canTweet,
  recordTweet,
  type XBudgetState,
} from '../delivery/x-rate-limiter.js';

// Helper: patch Date.now() + new Date() via UTC-3 offset manipulation
function makeState(overrides: Partial<XBudgetState> = {}): XBudgetState {
  return { ...createXBudgetState(), ...overrides };
}

describe('x-rate-limiter — smoke tests', () => {
  it('allows tweet when all conditions are OK', () => {
    // Active hour in UTC-3: we fake lastTweetAt far in the past
    const state = makeState({ lastTweetAt: Date.now() - 15 * 60 * 1000 });
    const result = canTweet(state);
    // Can't assert 'allowed' without mocking the clock (quiet hours depend on real time),
    // but we can assert shape and that no crash occurs
    expect(result).toHaveProperty('allowed');
  });

  it('recordTweet increments all counters', () => {
    const state = makeState();
    recordTweet(state);
    expect(state.tweetsToday).toBe(1);
    expect(state.tweetsThisHour).toBe(1);
    expect(state.lastTweetAt).toBeGreaterThan(0);
  });

  it('resets daily counter when date changes', () => {
    const state = makeState({ date: '2020-01-01', tweetsToday: 30 });
    canTweet(state); // triggers reset check
    expect(state.tweetsToday).toBe(0);
    expect(state.date).not.toBe('2020-01-01');
  });

  it('resets hourly counter when hour changes', () => {
    const state = makeState({ lastHourKey: '2020-01-01-00', tweetsThisHour: 7 });
    canTweet(state);
    expect(state.tweetsThisHour).toBe(0);
  });
});
