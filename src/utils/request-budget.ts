import { logger } from './logger.js';

const FLASH_DAILY_LIMIT = 100;
const TIMEZONE_OFFSET_MS = -3 * 60 * 60 * 1000;

function getTodayKey(): string {
  const now = new Date(Date.now() + TIMEZONE_OFFSET_MS);
  return now.toISOString().split('T')[0]!;
}

interface BudgetState {
  date: string;
  flashUsed: number;
  flashLiteUsed: number;
}

const state: BudgetState = {
  date: getTodayKey(),
  flashUsed: 0,
  flashLiteUsed: 0,
};

function resetIfNewDay(): void {
  const today = getTodayKey();
  if (state.date !== today) {
    logger.info(
      `🔄 Budget reset for new day: ${today} (yesterday — Flash: ${state.flashUsed}/${FLASH_DAILY_LIMIT}, Flash-Lite: ${state.flashLiteUsed})`,
    );
    state.date = today;
    state.flashUsed = 0;
    state.flashLiteUsed = 0;
  }
}

export function canMakeRequest(): boolean {
  if (process.env.BYPASS_BUDGET === 'true') return true;
  resetIfNewDay();
  return state.flashUsed < FLASH_DAILY_LIMIT;
}

export function trackRequest(label: string, model: 'flash' | 'flash-lite' = 'flash'): void {
  if (process.env.BYPASS_BUDGET === 'true') return;
  resetIfNewDay();

  if (model === 'flash-lite') {
    state.flashLiteUsed++;
    logger.info(`📊 LLM [${label}] flash-lite — used today: ${state.flashLiteUsed}`);
  } else {
    state.flashUsed++;
    logger.info(`📊 LLM [${label}] flash — used today: ${state.flashUsed}/${FLASH_DAILY_LIMIT}`);
  }
}

export function getRemainingRequests(): number {
  resetIfNewDay();
  return FLASH_DAILY_LIMIT - state.flashUsed;
}

export function getBudgetStatus() {
  resetIfNewDay();
  return {
    flash: {
      used: state.flashUsed,
      limit: FLASH_DAILY_LIMIT,
      remaining: FLASH_DAILY_LIMIT - state.flashUsed,
    },
    flash_lite: { used: state.flashLiteUsed },
    date: state.date,
  };
}
