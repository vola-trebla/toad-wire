import { describe, it, expect } from 'vitest';
import { truncateToWord } from '../utils/truncate.js';

describe('truncate — smoke tests', () => {
  it('returns full text when under limit', () => {
    const text = 'Short';
    expect(truncateToWord(text, 50)).toBe(text);
  });

  it('truncates at word boundary with ellipsis', () => {
    const text = 'Bitcoin price hits new all time high today';
    const result = truncateToWord(text, 20);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(23);
    expect(result).toContain('Bitcoin');
  });

  it('handles single long word', () => {
    const text = 'BitcoinEthereumSolana';
    const result = truncateToWord(text, 10);
    expect(result.endsWith('...')).toBe(true);
    expect(result).toContain('Bitcoin');
  });
});
