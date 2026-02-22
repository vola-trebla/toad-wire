import { describe, it, expect } from 'vitest';
import { MOODS } from '../constants/moods';
import { SCHEDULE } from '../constants/schedule';

describe('MOODS', () => {
    it('contains all three moods', () => {
        expect(Object.keys(MOODS)).toEqual(['neutral', 'bullish', 'bearish']);
    });

    it('contains all three moods', () => {
        Object.values(MOODS).forEach((mood) => {
            expect(mood).toHaveProperty('label');
            expect(mood).toHaveProperty('color');
            expect(mood).toHaveProperty('signal');
            expect(mood).toHaveProperty('cta');
        });
    });
});

describe('SCHEDULE', () => {
    it('contains 5 schedule items', () => {
        expect(SCHEDULE).toHaveLength(5);
    });

    it('each item has all required fields', () => {
        SCHEDULE.forEach((item) => {
            expect(item).toHaveProperty('time');
            expect(item).toHaveProperty('icon');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('desc');
        });
    });
});
