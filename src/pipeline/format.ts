import { type Summary } from './summarize.js';
import { type FeedArticle } from '../sources/rss.js';

export function formatPost(article: FeedArticle, summary: Summary): string {
  const sentimentMap = {
    bullish: '🟢 Bullish',
    bearish: '🔴 Bearish',
    neutral: '⚪️ Neutral',
  };

  const tags = summary.tags.join(' ');

  return `${summary.emoji} *${summary.title}*

${summary.summary}

_${summary.thought}_ 🐸

📊 ${sentimentMap[summary.sentiment]}
🔗 [Fuente: ${article.source}](${article.url})

${tags}`;
}
