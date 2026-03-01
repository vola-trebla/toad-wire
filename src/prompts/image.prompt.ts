// src/prompts/image.prompt.ts

// ─── Visual styles ────────────────────────────────────────────────────────────

export interface VisualStyle {
  name: string;
  description: string;
}

export const VISUAL_STYLES: VisualStyle[] = [
  {
    name: 'terminal',
    description:
      'Dark CRT terminal screen, phosphor glow, horizontal scanlines, pixel font readouts, vintage monitor frame',
  },
  {
    name: 'circuit',
    description:
      'Dark PCB circuit board, glowing copper traces, through-hole components, binary data flowing through pathways',
  },
  {
    name: 'radar',
    description:
      'Radar/sonar display, sweeping beam, concentric rings, blips on dark screen, military-grade interface',
  },
  {
    name: 'matrix',
    description:
      'Falling digital code rain, cascading glyphs, dark void background, streams of data dissolving into symbols',
  },
  {
    name: 'oscilloscope',
    description:
      'Oscilloscope waveform display, electric signal lines, dark phosphor screen, frequency patterns and waveforms',
  },
];

export const VISUAL_STYLES_NIGHT: VisualStyle[] = [
  {
    name: 'moonlit-terminal',
    description:
      'Dark terminal screen lit only by moonlight, dim phosphor glow, slow blinking cursor, peaceful standby mode',
  },
  {
    name: 'deep-swamp',
    description:
      'Dark swamp at night, bioluminescent reflections on still water, fireflies as data points, foggy atmosphere',
  },
  {
    name: 'starfield-radar',
    description:
      'Night sky radar, stars as market signals, slow sweeping beam, constellations forming chart patterns',
  },
  {
    name: 'sleeping-circuit',
    description:
      'PCB circuit board in low-power mode, dim traces, most lights off, single heartbeat pulse remaining',
  },
  {
    name: 'night-oscilloscope',
    description:
      'Oscilloscope in the dark, slow calm waveform, minimal signal, quiet frequency, standby glow',
  },
];

// ─── Sentiment palettes ───────────────────────────────────────────────────────

export const SENTIMENT_PALETTE = {
  bullish: 'bright neon green (#00ff41), upward energy, rising patterns, optimistic glow',
  bearish: 'deep red (#ff2200), crimson tones, downward pressure, warning signals',
  neutral: 'steel blue-grey (#4a9eff), balanced tones, analytical calm, cool palette',
} as const;

export type ImageSentiment = keyof typeof SENTIMENT_PALETTE;

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildDescriptorPrompt(summary: string, category: string): string {
  return `You are a visual art director for a crypto news terminal called "Sapo Cripto".

Convert this Spanish crypto news summary into a SHORT visual scene descriptor in English.
Rules:
- Max 2 sentences
- Symbolic and abstract, NOT literal illustration of news
- Use visual metaphors (e.g. "collapsing towers", "rising signal", "broken chains")
- NO company names, NO real people, NO logos
- Focus on the EMOTION and ENERGY of the news, not the facts
- Output ONLY the descriptor, no explanation
- NEVER reference animals, people or objects literally (use metaphors only)
- Pixel frog must be TINY, low-contrast, placed ONLY in bottom-right corner

Category: ${category === 'night' ? 'peaceful night, end of day, calm closing' : category}
Summary: ${summary}`.trim();
}

export function buildImagePrompt(
  descriptor: string,
  sentiment: ImageSentiment,
  style: VisualStyle,
): string {
  const palette = SENTIMENT_PALETTE[sentiment];

  return `
Pixel art illustration for a crypto news terminal called "Sapo Cripto".

STYLE: ${style.description}
COLOR PALETTE: ${palette}
MOOD: ${descriptor}

STRICT RULES:
- NO readable text, NO recognizable letters or numbers  
- abstract glyphs are allowed ONLY if they do not form real characters
- NO real company logos, NO real faces
- Dark background always (#0a0a0a base)
- Small pixel art frog (🐸) hidden in bottom-right corner as Easter egg
- High contrast, cinematic composition
- Pure pixel art / 8-bit aesthetic throughout
- Aspect ratio: 16:9
`.trim();
}
