import { logger } from './logger.js';

const DAILY_LIMIT = 18; // 2 reserve from 20 RPD
const TIMEZONE_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3 Montevideo

function getTodayKey(): string {
  const now = new Date(Date.now() + TIMEZONE_OFFSET_MS);
  return now.toISOString().split('T')[0]!;
}

interface BudgetState {
  date: string;
  used: number;
}

const state: BudgetState = {
  date: getTodayKey(),
  used: 0,
};

function resetIfNewDay(): void {
  const today = getTodayKey();
  if (state.date !== today) {
    logger.info(`🔄 Budget reset for new day: ${today} (yesterday used: ${state.used})`);
    state.date = today;
    state.used = 0;
  }
}

export function canMakeRequest(): boolean {
  resetIfNewDay();
  return state.used < DAILY_LIMIT;
}

export function trackRequest(label: string): void {
  resetIfNewDay();
  state.used++;
  logger.info(`📊 LLM request [${label}] — used today: ${state.used}/${DAILY_LIMIT}`);
}

export function getRemainingRequests(): number {
  resetIfNewDay();
  return DAILY_LIMIT - state.used;
}

export function getBudgetStatus(): {
  used: number;
  limit: number;
  remaining: number;
  date: string;
} {
  resetIfNewDay();
  return {
    used: state.used,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - state.used,
    date: state.date,
  };
}
