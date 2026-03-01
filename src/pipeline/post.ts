import 'dotenv/config';
import { Bot, InputFile } from 'grammy';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

export async function sendToTelegram(text: string): Promise<void> {
  try {
    await bot.api.sendMessage(config.TELEGRAM_CHANNEL_ID, text, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    });

    logger.info('📨 Posted to Telegram');
  } catch (error) {
    logger.error(`❌ Failed to post to Telegram: ${error}`);
  }
}

export async function sendToTelegramWithPhoto(imageBuffer: Buffer, caption: string): Promise<void> {
  try {
    await bot.api.sendPhoto(config.TELEGRAM_CHANNEL_ID, new InputFile(imageBuffer, 'sapo.png'), {
      caption,
      parse_mode: 'Markdown',
    });
    logger.info('📨 Posted to Telegram with photo');
  } catch (error) {
    logger.error(`❌ Failed to post photo to Telegram: ${error}`);
    // Fallback — send without photo
    await sendToTelegram(caption);
  }
}
