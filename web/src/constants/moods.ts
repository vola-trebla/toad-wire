export type Mood = 'neutral' | 'bullish' | 'bearish';

export interface MoodConfig {
    label: string;
    emoji: string;
    color: string;
    signal: string;
    signalText: string;
    tagline: string;
    cta: string;
}

export const MOODS: Record<Mood, MoodConfig> = {
    neutral: {
        label: 'NEUTRAL',
        emoji: '🐸',
        color: '#2dff6e',
        signal: '─',
        signalText: 'El mercado respira. El sapo observa.',
        tagline: 'Sin drama. Sin FOMO. Solo datos.',
        cta: 'Únete al canal',
    },
    bullish: {
        label: 'BULLISH',
        emoji: '🚀🐸',
        color: '#2dff6e',
        signal: '▲',
        signalText: '¡Las ranas saltan cuando hay sangre verde!',
        tagline: 'El sapo huele oportunidad. ¿Tú también?',
        cta: '¡Únete ahora!',
    },
    bearish: {
        label: 'BEARISH',
        emoji: '🐸💀',
        color: '#ff3b3b',
        signal: '▼',
        signalText: 'El mercado llora. El sapo toma notas.',
        tagline: 'Cuando todos venden, el sapo analiza.',
        cta: 'No entres en pánico →',
    },
};
