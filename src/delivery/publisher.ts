// src/delivery/publisher.ts
//
// Single delivery abstraction for all pipelines.
// Pipelines prepare content — Publisher delivers it.
// Adding a new channel (Discord, WhatsApp, etc.) = new block here, zero changes in pipelines.

import { logger } from '../utils/logger.js';
import { withCircuit } from '../utils/circuit-breaker.js';
import { sendToTelegram, sendToTelegramPlain, sendToTelegramWithPhoto } from './telegram.js';
import { telegramCircuit, xCircuit } from '../orchestration/state.js';
import { isXEnabled, postTweet, postTweetWithMedia, getClient } from './twitter.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChannelContent = {
  text: string;
  image: Buffer | undefined;
};

export type PublishPayload = {
  telegram: ChannelContent;
  x: ChannelContent | undefined; // undefined = TG-only post
};

export type PublishOptions = {
  telegramPlain?: boolean; // use sendToTelegramPlain (no markdown parse)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function content(text: string, image?: Buffer): ChannelContent {
  return { text, image };
}

// ─── Publisher ────────────────────────────────────────────────────────────────

export async function publish(
  payload: PublishPayload,
  options: PublishOptions = {},
): Promise<void> {
  // ── Telegram ──────────────────────────────────────────────────────────────
  const { text: tgText, image: tgImage } = payload.telegram;

  if (tgImage) {
    await withCircuit(telegramCircuit, () => sendToTelegramWithPhoto(tgImage, tgText), logger);
  } else if (options.telegramPlain) {
    await withCircuit(telegramCircuit, () => sendToTelegramPlain(tgText), logger);
  } else {
    await withCircuit(telegramCircuit, () => sendToTelegram(tgText), logger);
  }

  // ── X ─────────────────────────────────────────────────────────────────────
  if (!payload.x || !isXEnabled()) return;

  const { text: xText, image: xImage } = payload.x;

  if (xImage) {
    await withCircuit(xCircuit, () => postTweetWithMedia(xText, xImage), logger);
  } else {
    await withCircuit(xCircuit, () => postTweet(xText), logger);
  }
}

// ─── Reply to Tweet ───────────────────────────────────────────────────────────

export async function replyToTweet(tweetId: string, text: string): Promise<boolean> {
  const client = getClient();
  if (!client || !isXEnabled()) return false;

  try {
    await withCircuit(xCircuit, () => client.v2.reply(text, tweetId), logger);
    logger.info(`↩️ Replied to tweet ${tweetId}`);
    return true;
  } catch (error) {
    logger.warn(`⚠️ replyToTweet error: ${error}`);
    return false;
  }
}
