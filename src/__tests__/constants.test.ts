import { describe, it, expect } from 'vitest';
import { TIMEZONE, BLACKLIST, MAX_RANKER_INPUT, FAST_TRACK_CATEGORIES } from '../utils/constants.js';

describe('constants — smoke tests', () => {
  it('exports expected constants', () => {
    expect(TIMEZONE).toBe('America/Montevideo');
    expect(BLACKLIST).toBeInstanceOf(Array);
    expect(BLACKLIST.length).toBeGreaterThan(0);
    expect(MAX_RANKER_INPUT).toBe(15);
    expect(FAST_TRACK_CATEGORIES).toBeInstanceOf(RegExp);
  });

  it('BLACKLIST includes known terms', () => {
    expect(BLACKLIST).toContain('sponsored');
    expect(BLACKLIST).toContain('nft game');
  });

  it('FAST_TRACK_CATEGORIES matches breaking keywords', () => {
    expect('hack exchange'.match(FAST_TRACK_CATEGORIES)).toBeTruthy();
    expect('SEC lawsuit'.match(FAST_TRACK_CATEGORIES)).toBeTruthy();
  });
});
