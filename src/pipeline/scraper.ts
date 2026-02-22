import { logger } from '../utils/logger.js';

const MAX_CHARS = 3000;

export async function scrapeArticle(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ElSapoCripto/1.0)',
            },
            signal: AbortSignal.timeout(8000),
        });

        const html = await response.text();
        const text = extractText(html);

        if (!text || text.length < 100) {
            logger.warn(`⚠️ Too short or empty content: ${url}`);
            return null;
        }

        return text.slice(0, MAX_CHARS);
    } catch (error) {
        logger.error({ err: error }, `❌ Failed to scrape: ${url}`);
        return null;
    }
}

function extractText(html: string): string {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
