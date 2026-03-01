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
      'Old CRT terminal interface, subtle phosphor glow, scanlines, rectangular UI panels, structured grid layout',
  },
  {
    name: 'circuit',
    description:
      'Printed circuit board layout, visible copper traces, microchip blocks, structured electronic pathways',
  },
  {
    name: 'radar',
    description:
      'Circular radar interface, sweeping beam arc, concentric rings, minimal blip signals on dark screen',
  },
  {
    name: 'signal-rain',
    description:
      'Vertical falling light columns, segmented digital streaks, controlled cascading data particles',
  },
  {
    name: 'oscilloscope',
    description:
      'Oscilloscope display with sharp waveform lines, horizontal scan grid, precise signal amplitude patterns',
  },
  {
    name: 'datastream',
    description:
      'Parallel vertical data streams, structured numeric blocks, motion blur limited to straight channels',
  },
  {
    name: 'neon-grid',
    description:
      'Symmetrical glowing grid, rectangular cells, layered financial geometry, precise perspective alignment',
  },
  {
    name: 'fracture',
    description:
      'Geometric shards splitting along straight vector lines, controlled fragmentation, sharp angular contrast',
  },
  {
    name: 'signal-wireframe',
    description:
      '3D polygon wireframe mesh, glowing edges, structured triangular surfaces, clean spatial depth',
  },
  {
    name: 'heatmap',
    description:
      'Clustered rectangular heat zones, smooth gradient blocks, density visualization across a grid plane',
  },
  {
    name: 'holo-chart',
    description:
      'Floating translucent chart panels, vertical candlestick silhouettes, layered holographic UI frames',
  },
  {
    name: 'bio-circuit',
    description:
      'Hybrid organic circuitry, branching neon filaments, structured yet natural signal pathways',
  },
  {
    name: 'quantum-field',
    description:
      'Interference wave patterns, layered probability arcs, symmetrical luminous distortions across dark space',
  },
  {
    name: 'static-noise',
    description:
      'Digital static field, controlled glitch fragments, rectangular corrupted blocks on dark background',
  },
  {
    name: 'market-topography',
    description:
      'Contour elevation lines forming structured terrain map, layered height bands, smooth gradient slopes',
  },
  {
    name: 'flow-map',
    description:
      'Directional vector arrows, curved liquidity paths, structured flow channels across dark grid',
  },
  {
    name: 'pulse-grid',
    description:
      'Symmetrical grid with horizontal signal pulses, evenly spaced energy waves, rhythmic visual cadence',
  },
];

export const VISUAL_STYLES_NIGHT: VisualStyle[] = [
  {
    name: 'moonlit-terminal',
    description:
      'Dim CRT interface with low phosphor brightness, sparse UI panels, single blinking cursor glow',
  },
  {
    name: 'deep-swamp',
    description:
      'Dark reflective surface with scattered light particles, low fog layer, minimal glowing reflections',
  },
  {
    name: 'starfield-radar',
    description:
      'Dark circular radar grid with faint star-like points, slow sweeping beam arc, minimal motion',
  },
  {
    name: 'sleeping-circuit',
    description:
      'Circuit board in low-power mode, faint trace lines, single subtle pulse across microchip nodes',
  },
  {
    name: 'night-oscilloscope',
    description: 'Minimal oscilloscope waveform, low amplitude signal, dim grid background',
  },
  {
    name: 'nocturnal-grid',
    description:
      'Soft symmetrical grid fading into darkness, muted blue-green highlights, sparse signal activity',
  },
  {
    name: 'swamp-lanterns',
    description:
      'Scattered glowing orbs over dark reflective plane, soft light halos, slow drifting particles',
  },
  {
    name: 'neon-mist',
    description:
      'Thin fog layer with faint linear neon accents, soft drifting particles across dark void',
  },
  {
    name: 'silent-topography',
    description: 'Low-contrast contour terrain map, faint elevation lines, smooth dark gradients',
  },
  {
    name: 'deep-circuit-dream',
    description: 'Minimal circuit pathways with slow rhythmic pulse, low brightness microchip glow',
  },
  {
    name: 'void-stream',
    description:
      'Thin luminous streams flowing across empty dark space, controlled particle motion',
  },
  {
    name: 'night-fracture',
    description: 'Dark geometric surfaces with faint edge highlights, subtle controlled cracks',
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
- Dark background base (#0a0a0a)
- Strict 8-bit pixel grid, visible square pixel blocks
- No anti-aliasing, no soft brush strokes
- No smooth gradients, use limited color banding
- High contrast between foreground and background
- Clean geometric composition, strong silhouettes
- Abstract UI elements only, no readable characters
- No logos, no real-world branding, no faces
- Tiny low-contrast pixel frog silhouette in bottom-right corner, subtle and secondary
- No photorealism, no volumetric lighting
- Aspect ratio: 16:9
`.trim();
}
