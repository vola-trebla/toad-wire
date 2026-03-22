export type Mood = 'neutral' | 'bullish' | 'bearish';

export interface MoodConfig {
  label: string;
  emoji: string;
  tagline: string;
  signal: string;
  signalText: string;
  sentiment: string;
}

export const MOODS: Record<Mood, MoodConfig> = {
  neutral: {
    label: 'STABLE',
    emoji: '🔵',
    tagline:
      'TOAD-WIRE Engine is monitoring global information streams in real-time. High signal-to-noise ratio maintained.',
    signal: 'STB',
    signalText: 'Normal operations. Scanning 1024+ sources. No anomalies detected.',
    sentiment: 'neutral',
  },
  bullish: {
    label: 'AGGRESSIVE',
    emoji: '🚀',
    tagline:
      'High-frequency signal detection active. Filtering for exponential growth patterns and breakthrough innovation.',
    signal: 'OPT',
    signalText: 'Aggressive acquisition. Positive sentiment dominating global feeds.',
    sentiment: 'bullish',
  },
  bearish: {
    label: 'DEFENSIVE',
    emoji: '🩸',
    tagline:
      'System in risk-mitigation mode. Filtering for systemic failures, volatility, and negative market pressure.',
    signal: 'CRIT',
    signalText: 'Volatility detected. Protective filters engaged. High alert mode.',
    sentiment: 'bearish',
  },
};
