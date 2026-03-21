// src/utils/constants.ts

export const TIMEZONE = 'America/Montevideo';

export const BLACKLIST = [
  'sponsored',
  'press release',
  'partner content',
  'promoted',
  'advertisement',
  'podcast recap',
  'weekly roundup',
  'top 10 ai tools',
  'best ai apps',
  'ai girlfriend',
  'make money with ai',
  'passive income',
] as const;

export const MAX_RANKER_INPUT = 15;

export const FAST_TRACK_CATEGORIES =
  /breach|leak|shutdown|ban|agi|breakthrough|acqui.*billion/i;
