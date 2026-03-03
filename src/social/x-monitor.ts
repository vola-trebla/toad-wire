// src/social/x-monitor.ts
import { db } from '../db/client.js';
import { botState, xInteractions, xMonitoredAccounts } from '../db/schema.js';
import { getReadClient } from '../delivery/twitter.js';
import { logger } from '../utils/logger.js';
import { eq, sql } from 'drizzle-orm';
import { config } from '../config.js';

// ─── Engagement Score ─────────────────────────────────────────────────────────

function calculateEngagementScore(metrics: {
  like_count?: number;
  retweet_count?: number;
  quote_count?: number;
  reply_count?: number;
}): number {
  return (
    (metrics.like_count ?? 0) +
    (metrics.retweet_count ?? 0) * 2 +
    (metrics.quote_count ?? 0) * 3 +
    (metrics.reply_count ?? 0) * 1.5
  );
}

// ─── Bot State helpers ────────────────────────────────────────────────────────

async function getBotStateValue(key: string): Promise<string> {
  const row = await db.select().from(botState).where(eq(botState.key, key)).limit(1);
  return row[0]?.value ?? '0';
}

async function setBotStateValue(key: string, value: string): Promise<void> {
  await db
    .insert(botState)
    .values({ key, value })
    .onConflictDoUpdate({
      target: botState.key,
      set: { value, updatedAt: sql`CURRENT_TIMESTAMP` },
    });
}

// ─── Save interactions ────────────────────────────────────────────────────────

interface RawInteraction {
  tweetId: string;
  authorId: string;
  authorHandle: string;
  content: string;
  type: 'mention' | 'monitored' | 'search';
  engagementScore: number;
}

async function saveInteractions(interactions: RawInteraction[]): Promise<void> {
  for (const item of interactions) {
    await db.insert(xInteractions).values(item).onConflictDoNothing().execute();
  }
}

// ─── Poll Mentions ────────────────────────────────────────────────────────────

export async function pollMentions(): Promise<void> {
  const client = getReadClient();
  if (!client || !config.X_BOT_USER_ID) {
    logger.debug('⏸️ X read client not configured, skipping mentions poll');
    return;
  }

  try {
    const sinceId = await getBotStateValue('last_mention_id');

    const params: Parameters<typeof client.v2.userMentionTimeline>[1] = {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
      'user.fields': ['username'],
      expansions: ['author_id'],
    };
    if (sinceId !== '0') params.since_id = sinceId;

    const response = await client.v2.userMentionTimeline(config.X_BOT_USER_ID, params);

    const tweets = response.data?.data ?? [];
    if (tweets.length === 0) return;

    // Save newest mention ID for next poll
    await setBotStateValue('last_mention_id', tweets[0]!.id);

    const users = response.data?.includes?.users ?? [];
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const interactions: RawInteraction[] = tweets.map((tweet) => ({
      tweetId: tweet.id,
      authorId: tweet.author_id ?? '',
      authorHandle: userMap.get(tweet.author_id ?? '') ?? 'unknown',
      content: tweet.text,
      type: 'mention' as const,
      engagementScore: calculateEngagementScore(tweet.public_metrics ?? {}),
    }));

    await saveInteractions(interactions);
    logger.info(`📥 Polled ${interactions.length} mentions`);
  } catch (error) {
    logger.warn(`⚠️ pollMentions error: ${error}`);
  }
}

// ─── Poll Monitored Timelines ─────────────────────────────────────────────────

export async function pollMonitoredTimelines(): Promise<void> {
  const client = getReadClient();
  if (!client) return;

  try {
    // Round-robin: pick the account checked longest ago
    const accounts = await db
      .select()
      .from(xMonitoredAccounts)
      .where(eq(xMonitoredAccounts.enabled, true))
      .orderBy(sql`last_checked_at ASC NULLS FIRST`)
      .limit(1);

    const account = accounts[0];
    if (!account?.userId) return;

    const response = await client.v2.userTimeline(account.userId, {
      max_results: 5,
      'tweet.fields': ['public_metrics', 'created_at'],
    });

    const tweets = response.data?.data ?? [];

    const interactions: RawInteraction[] = tweets.map((tweet) => ({
      tweetId: tweet.id,
      authorId: account.userId!,
      authorHandle: account.handle,
      content: tweet.text,
      type: 'monitored' as const,
      engagementScore: calculateEngagementScore(tweet.public_metrics ?? {}),
    }));

    await saveInteractions(interactions);

    // Update lastCheckedAt
    await db
      .update(xMonitoredAccounts)
      .set({ lastCheckedAt: new Date().toISOString() })
      .where(eq(xMonitoredAccounts.id, account.id));

    logger.debug(`📡 Polled timeline @${account.handle}: ${tweets.length} tweets`);
  } catch (error) {
    logger.warn(`⚠️ pollMonitoredTimelines error: ${error}`);
  }
}

// ─── Search Crypto LATAM ──────────────────────────────────────────────────────

export async function searchCryptoLatam(): Promise<void> {
  const client = getReadClient();
  if (!client) return;

  try {
    const response = await client.v2.search('crypto lang:es -is:retweet -is:reply min_faves:10', {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
      'user.fields': ['username'],
      expansions: ['author_id'],
    });

    const tweets = response.data?.data ?? [];
    if (tweets.length === 0) return;

    const users = response.data?.includes?.users ?? [];
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const interactions: RawInteraction[] = tweets.map((tweet) => ({
      tweetId: tweet.id,
      authorId: tweet.author_id ?? '',
      authorHandle: userMap.get(tweet.author_id ?? '') ?? 'unknown',
      content: tweet.text,
      type: 'search' as const,
      engagementScore: calculateEngagementScore(tweet.public_metrics ?? {}),
    }));

    await saveInteractions(interactions);
    logger.debug(`🔍 Search found ${interactions.length} crypto LATAM tweets`);
  } catch (error) {
    logger.warn(`⚠️ searchCryptoLatam error: ${error}`);
  }
}
