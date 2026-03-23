import 'dotenv/config';
import { initObservability, shutdown } from 'toad-eye';
import { logger } from './src/utils/logger.js';

// Импортируем все задачи
import { runNewsPipeline, runMorningDigest } from './src/orchestration/news-pipeline.js';
import { runMondayBriefing, runWeeklySummary } from './src/orchestration/special-pipeline.js';
import {
  checkFeedHealth,
  reportFeedHealth,
  restoreFeedHealthFromDB,
} from './src/ingestion/feed-health.js';
import { runBackup } from './src/utils/backup.js';
import { cleanOldMicroPosts } from './src/queue/micro-posts.js';
import { db } from './src/db/client.js';
import { sql } from 'drizzle-orm';

initObservability({
  serviceName: 'toad-wire',
  instrument: ['ai'],
});

async function trigger() {
  // Определяем время в Монтевидео
  const now = new Date();

  // 🐸 Исправленный форматтер: убираем weekday: 'numeric'
  const hour = parseInt(
    now.toLocaleTimeString('en-US', {
      timeZone: 'America/Montevideo',
      hour: 'numeric',
      hour12: false,
    }),
  );
  const minute = parseInt(
    now.toLocaleTimeString('en-US', {
      timeZone: 'America/Montevideo',
      minute: 'numeric',
    }),
  );
  const day = now.toLocaleDateString('en-US', {
    timeZone: 'America/Montevideo',
    weekday: 'short',
  });

  logger.info(`🐸 Sapo Dispatcher: Current time in Montevideo is ${day} ${hour}:${minute}`);

  // Восстанавливаем состояние здоровья фидов (нужно для проверок)
  await restoreFeedHealthFromDB();

  // 1. Maintenance (02:00 daily)
  if (hour === 2 && minute < 30) {
    logger.info('💾 Running Backup...');
    await runBackup();
  }

  // 2. Cleanup (Sunday 00:00)
  if (day === 'Sun' && hour === 0 && minute < 30) {
    logger.info('🗑️ Cleaning up old articles...');
    db.run(sql`DELETE FROM articles WHERE created_at < datetime('now', '-7 days')`);
    await cleanOldMicroPosts(90);
  }

  // 3. Feed Health (Report Monday 07:00, Check every run)
  if (day === 'Mon' && hour === 7 && minute < 30) {
    await reportFeedHealth();
  }
  await checkFeedHealth();

  // 4. Monday Briefing (09:00)
  if (day === 'Mon' && hour === 9 && minute < 30) {
    await runMondayBriefing();
  }

  // 5. Morning Digest (08:00)
  if (hour === 8 && minute < 30) {
    await runMorningDigest();
  }

  // 6. News Pipeline (19:00, 20:00, 21:00)
  if ([19, 20, 21].includes(hour) && minute < 30) {
    await runNewsPipeline(1);
  }

  // 7. Weekly Summary (Saturday 21:00)
  if (day === 'Sat' && hour === 21 && minute < 30) {
    await runWeeklySummary();
  }

  // Если запуск ручной (workflow_dispatch), и ничего не подошло — просто прогоним новости
  if (process.env.FORCE_RUN === 'true') {
    logger.info('🚀 Force run: executing News Pipeline');
    await runNewsPipeline(1);
  }
}

trigger()
  .then(async () => {
    logger.info('✅ Task completed');
    await shutdown();
  })
  .catch(async (err) => {
    logger.error({ err }, '❌ Dispatcher failed');
    await shutdown();
    process.exit(1);
  });
