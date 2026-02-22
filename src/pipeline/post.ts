import 'dotenv/config';
import { Bot } from 'grammy';
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
