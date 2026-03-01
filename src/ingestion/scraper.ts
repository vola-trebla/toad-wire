import { logger } from '../utils/logger.js';

const MAX_CHARS = 3000;
const RETRY_DELAY_MS = 2000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ElSapoCripto/1.0)',
};

// Source-specific CSS selectors for better content extraction
const SOURCE_SELECTORS: Record<string, string[]> = {
  'coindesk.com': ['article .at-content-wrapper', 'article .article-body', 'article'],
  'cointelegraph.com': ['article .post-content', '.post__content', 'article'],
  'theblock.co': ['.article-body', '.post-body', 'article'],
  'blockworks.co': ['.article-content', '.post-content', 'article'],
  'decrypt.co': ['.article-content', '.post-content', 'article'],
  'dlnews.com': ['.article-body', 'article'],
  'cryptobriefing.com': ['.article-content', 'article'],
  'beincrypto.com': ['.article-body', '.content-body', 'article'],
  'cryptoslate.com': ['.article-content', 'article'],
  'criptonoticias.com': ['.article-body', '.entry-content', 'article'],
};

function getSelectorsForUrl(url: string): string[] {
  const domain = Object.keys(SOURCE_SELECTORS).find((d) => url.includes(d));
  return domain ? SOURCE_SELECTORS[domain]! : ['article'];
}

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
      const selectors = getSelectorsForUrl(url);
      const text = extractText(html, selectors);

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

function extractText(html: string, selectors: string[]): string {
  let extracted = html;

  // Try each selector in order, use first match
  for (const selector of selectors) {
    // Simple tag match (e.g. 'article')
    const tagMatch = selector.match(/^(\w+)$/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const match = html.match(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'i'));
      if (match) {
        extracted = match[0];
        break;
      }
    }

    // Class selector (e.g. 'article .post-content')
    const classMatch = selector.match(/\.([\\w-]+)$/);
    if (classMatch) {
      const cls = classMatch[1];
      const match = html.match(new RegExp(`<[^>]+class="[^"]*${cls}[^"]*"[\\s\\S]*?</[^>]+>`, 'i'));
      if (match) {
        extracted = match[0];
        break;
      }
    }
  }

  return extracted
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
