import { db } from '../db/client.js';
import { microPosts } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { type MicroPost } from '../pipeline/batch-generator.js';

export async function enqueueMicroPosts(posts: MicroPost[], channel = 'x'): Promise<void> {
  if (posts.length === 0) return;

  await db.insert(microPosts).values(
    posts.map((p) => ({
      text: p.text,
      hashtags: JSON.stringify(p.hashtags),
      mood: p.mood,
      batchType: p.batchType,
      channel,
    })),
  );

  logger.info(`📥 Enqueued ${posts.length} micro-posts [channel: ${channel}]`);
}

export async function getNextUnposted(channel = 'x') {
  const result = await db
    .select()
    .from(microPosts)
    .where(and(eq(microPosts.posted, false), eq(microPosts.channel, channel)))
    .orderBy(microPosts.createdAt)
    .limit(1);

  return result[0] ?? null;
}

export async function markMicroPostAsPosted(id: number): Promise<void> {
  await db.update(microPosts).set({ posted: true }).where(eq(microPosts.id, id));
}

export async function getPendingCount(channel = 'x'): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(microPosts)
    .where(and(eq(microPosts.posted, false), eq(microPosts.channel, channel)));

  return result[0]?.count ?? 0;
}

export async function cleanOldMicroPosts(days = 7): Promise<void> {
  await db
    .delete(microPosts)
    .where(
      and(
        eq(microPosts.posted, true),
        sql`created_at < datetime('now', '-' || ${days} || ' days')`,
      ),
    );

  logger.info(`🗑️ Cleaned old micro-posts (>${days} days)`);
}
