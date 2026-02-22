import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_CHANNEL_ID: z.string().min(1),
    DATABASE_URL: z.string().default('file:./dev.db'),
    COINMARKETCAP_API_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;
