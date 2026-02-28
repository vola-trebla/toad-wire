import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger to avoid noise
vi.mock('./logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('request-budget', () => {
  beforeEach(async () => {
    // Reset module state between tests
    vi.resetModules();
    delete process.env.BYPASS_BUDGET;
  });

  it('should allow requests when under limit', async () => {
    const { canMakeRequest } = await import('../utils/request-budget.js');
    expect(canMakeRequest()).toBe(true);
  });

  it('should track flash-lite separately', async () => {
    const { trackRequest, getBudgetStatus } = await import('../utils/request-budget.js');
    trackRequest('test', 'flash-lite');
    trackRequest('test', 'flash-lite');
    const status = getBudgetStatus();
    expect(status.flash_lite.used).toBe(2);
    expect(status.flash.used).toBe(0); // flash unaffected
  });

  it('should bypass budget when BYPASS_BUDGET=true', async () => {
    process.env.BYPASS_BUDGET = 'true';
    const { trackRequest, canMakeRequest } = await import('../utils/request-budget.js');
    for (let i = 0; i < 20; i++) {
      trackRequest(`test-${i}`, 'flash');
    }
    expect(canMakeRequest()).toBe(true);
  });

  it('should not block flash-lite requests when flash is exhausted', async () => {
    const { trackRequest, getBudgetStatus } = await import('../utils/request-budget.js');
    for (let i = 0; i < 18; i++) {
      trackRequest(`test-${i}`, 'flash');
    }
    trackRequest('lite', 'flash-lite');
    const status = getBudgetStatus();
    expect(status.flash_lite.used).toBe(1);
  });
});
