import { TwitterApi } from 'twitter-api-v2';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let client: TwitterApi | null = null;

export function getClient(): TwitterApi | null {
  if (
    !config.X_CONSUMER_KEY ||
    !config.X_CONSUMER_SECRET ||
    !config.X_ACCESS_TOKEN ||
    !config.X_ACCESS_TOKEN_SECRET
  ) {
    return null;
  }

  if (!client) {
    client = new TwitterApi({
      appKey: config.X_CONSUMER_KEY,
      appSecret: config.X_CONSUMER_SECRET,
      accessToken: config.X_ACCESS_TOKEN,
      accessSecret: config.X_ACCESS_TOKEN_SECRET,
    });
  }

  return client;
}

// Read-only client — Bearer Token for X API v2 read endpoints
let readClient: TwitterApi | null = null;

export function getReadClient(): TwitterApi | null {
  if (!config.X_BEARER_TOKEN) return null;

  if (!readClient) {
    readClient = new TwitterApi(config.X_BEARER_TOKEN);
  }

  return readClient;
}

export function isXEnabled(): boolean {
  return getClient() !== null;
}

export async function postTweetWithMedia(text: string, imageData: Buffer): Promise<boolean> {
  const twitter = getClient();

  if (!twitter) {
    logger.warn('⚠️ X client not configured, skipping tweet');
    return false;
  }

  try {
    const mediaId = await twitter.v1.uploadMedia(imageData, { mimeType: 'image/png' });
    const result = await twitter.v2.tweet(text, { media: { media_ids: [mediaId] } });
    logger.info(`🐦 Tweet with media posted: ${result.data.id}`);
    return true;
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to post tweet with media');
    // Fallback — пост без картинки
    return postTweet(text);
  }
}

export async function postTweet(text: string): Promise<boolean> {
  const twitter = getClient();

  if (!twitter) {
    logger.warn('⚠️ X client not configured, skipping tweet');
    return false;
  }

  try {
    const result = await twitter.v2.tweet(text);
    logger.info(`🐦 Tweet posted: ${result.data.id}`);
    return true;
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to post tweet');
    return false;
  }
}
