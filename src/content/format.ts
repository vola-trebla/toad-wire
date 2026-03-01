import { type Summary } from './summarize.js';
import { type FeedArticle } from '../ingestion/rss.js';

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

const THOUGHT_EMOJIS = [
  '🧠',
  '🤖',
  '🧩',
  '🔍',
  '📡',
  '📊',
  '📈',
  '🛰️',
  '⚙️',
  '🧮',
  '🧬',
  '🔮',
  '🪬',
  '🦾',
  '💭',
  '🌐',
  '⚡️',
  '🔭',
  '🧿',
  '💡',
  '🪐',
  '🔬',
  '🎯',
];

function getRandomThoughtEmojis(): string {
  const shuffled = [...THOUGHT_EMOJIS].sort(() => Math.random() - 0.5);
  return `${shuffled[0]!} ${shuffled[1]!}`;
}

export function formatPostTelegram(article: FeedArticle, summary: Summary): string {
  const tags = summary.tags.join(' ');

  return `${sentimentMap[summary.sentiment]} · ${categoryMap[summary.category]}

${summary.emoji} *${summary.title}*
🔗 [Fuente: ${article.source}](${article.url})

${summary.summary}

_${summary.thought}_ ${getRandomThoughtEmojis()}

${tags}`;
}

export function formatPostX(article: FeedArticle, summary: Summary): string {
  const tags = summary.tags.join(' ');

  return `${sentimentMap[summary.sentiment]} · ${categoryMap[summary.category]}

${summary.emoji} ${summary.title}
🔗 Fuente: ${article.source}

${summary.summary}

${summary.thought} ${getRandomThoughtEmojis()}

${tags}`;
}
