import { describe, it, expect, vi } from 'vitest';

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { isRelevant } from '../orchestration/helpers.js';

describe('helpers — smoke tests', () => {
  it('returns true for clean title', () => {
    expect(isRelevant('Bitcoin ETF approved by SEC')).toBe(true);
    expect(isRelevant('Ethereum network upgrade')).toBe(true);
  });

  it('returns false for blacklisted terms', () => {
    expect(isRelevant('Sponsored: Buy this token')).toBe(false);
    expect(isRelevant('Weekly roundup of crypto news')).toBe(false);
    expect(isRelevant('Top NFT game launches')).toBe(false);
  });
});
