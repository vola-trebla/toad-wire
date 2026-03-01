import { logger } from '../utils/logger.js';

const MAX_CHARS = 3000;
const RETRY_DELAY_MS = 2000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ElSapoCripto/1.0)',
};

export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      logger.warn(`⚠️ URL validation failed (${response.status}): ${url}`);
      return false;
    }
    return true;
  } catch {
    logger.warn(`⚠️ URL unreachable: ${url}`);
    return false;
  }
}

export async function scrapeArticle(url: string): Promise<string | null> {
  const valid = await validateUrl(url);
  if (!valid) return null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: HEADERS,
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
      if (attempt === 1) {
        logger.warn(`⚠️ Scrape attempt 1 failed, retrying in ${RETRY_DELAY_MS}ms: ${url}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error({ err: error }, `❌ Failed to scrape after 2 attempts: ${url}`);
      }
    }
  }

  return null;
}

function extractText(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (articleMatch) html = articleMatch[0];

  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/leer también:[^\n]+/gi, '')
    .replace(/artículos relacionados:[^\n]+/gi, '')
    .replace(/related articles?[^\n]+/gi, '')
    .replace(/publicidad|advertisement/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
