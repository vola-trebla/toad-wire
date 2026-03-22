// src/context/news-context.ts

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface NewsContext {
  unusedHeadlines: string[];
  timeOfDay: TimeOfDay;
}

export function getTimeOfDay(): TimeOfDay {
  // UTC-3 Montevideo
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function buildNewsContext(unusedHeadlines: string[] = []): NewsContext {
  return {
    unusedHeadlines,
    timeOfDay: getTimeOfDay(),
  };
}
