import { type Summary } from './summarize.js';
import { type FeedArticle } from '../sources/rss.js';

const sentimentMap = {
  bullish: '🟢 Bullish',
  bearish: '🔴 Bearish',
  neutral: '⚪️ Neutral',
};

const categoryMap = {
  regulacion: '⚖️ Regulación',
  defi: '🏦 DeFi',
  trading: '📈 Trading',
  seguridad: '🔐 Seguridad',
  tecnologia: '⚙️ Tecnología',
  latam: '🌎 LATAM',
};

export function formatPost(article: FeedArticle, summary: Summary): string {
  const tags = summary.tags.join(' ');

  return `${sentimentMap[summary.sentiment]} · ${categoryMap[summary.category]}

${summary.emoji} *${summary.title}*
🔗 [Fuente: ${article.source}](${article.url})

${summary.summary}

_${summary.thought}_ 🧠🤖

${tags}`;
}

export function formatTweet(article: FeedArticle, summary: Summary): string {
  return `${sentimentMap[summary.sentiment]} ${summary.emoji}

${summary.tweet}

🔗 ${article.url}

${summary.tags.slice(0, 3).join(' ')}`;
}
