// src/orchestration/social-state.ts
import { db } from '../db/client.js';
import { botState, xMonitoredAccounts } from '../db/schema.js';
import { logger } from '../utils/logger.js';

const INITIAL_BOT_STATE = [
  { key: 'persona_mode', value: 'normal' },
  { key: 'last_mention_id', value: '0' },
  { key: 'catalina_until', value: '0' },
];

const MONITORED_ACCOUNTS = [
  { handle: 'VitalikButerin', category: 'founder', priority: 5 },
  { handle: 'cz_binance', category: 'founder', priority: 5 },
  { handle: 'SBF_FTX', category: 'founder', priority: 3 },
  { handle: 'michael_saylor', category: 'whale', priority: 5 },
  { handle: 'APompliano', category: 'media', priority: 4 },
  { handle: 'DocumentingBTC', category: 'media', priority: 4 },
  { handle: 'WClementeIII', category: 'whale', priority: 4 },
  { handle: 'CryptoLatam', category: 'media', priority: 4 },
  { handle: 'AltcoinDailyio', category: 'media', priority: 3 },
  { handle: 'CoinDesk', category: 'media', priority: 4 },
  { handle: 'Cointelegraph', category: 'media', priority: 4 },
  { handle: 'BitcoinMagazine', category: 'media', priority: 3 },
  { handle: 'lopp', category: 'founder', priority: 4 },
  { handle: 'aantonop', category: 'founder', priority: 4 },
  { handle: 'CryptoCopaAmerica', category: 'degen', priority: 2 },
];

export async function initSocialState(): Promise<void> {
  // Seed botState keys if missing
  for (const { key, value } of INITIAL_BOT_STATE) {
    await db.insert(botState).values({ key, value }).onConflictDoNothing().execute();
  }

  // Seed monitored accounts if table is empty
  const existing = await db.select().from(xMonitoredAccounts).limit(1);
  if (existing.length === 0) {
    await db
      .insert(xMonitoredAccounts)
      .values(MONITORED_ACCOUNTS.map((a) => ({ ...a, enabled: true })));
    logger.info(`✅ Seeded ${MONITORED_ACCOUNTS.length} monitored accounts`);
  }

  logger.info('✅ Social state initialized');
}
