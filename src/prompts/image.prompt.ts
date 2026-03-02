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
      'Retro CRT monitor display, phosphor green glow, visible scanlines, rectangular UI panels, fixed-width typography layout, structured grid, 8-bit computer aesthetic.',
  },
  {
    name: 'circuit',
    description:
      'Printed circuit board layout, visible copper traces, microchip blocks, structured electronic pathways',
  },
  {
    name: 'order-depth',
    description:
      'Horizontal layered depth-buffer visualization, stacked monochromatic liquidity blocks, sharp shifting pressure zones, dark trading interface, high contrast, pixel-perfect rectangles',
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
      'Geometric vector shards splitting along jagged straight lines, controlled digital fragmentation, sharp angular contrast, dark background, glitch-art elements, broken glass effect',
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
      'Hybrid organic microcircuitry, branching neon bioluminescent filaments, structured neural pathways, swamp-tech aesthetic, emerald and dark-water palette, pixel-art textures',
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
  {
    name: 'liquidity-wall',
    description:
      'Massive vertical monolithic blocks, dense stacked pixelated rectangles, heavy market pressure visualization, industrial dark UI, flat vector aesthetic, no perspective distortion',
  },
  {
    name: 'node-cluster',
    description:
      'Scattered glowing data nodes forming asymmetric clusters, thin connection lines, distributed network structure',
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
    name: 'signal-constellation',
    description:
      'Sparse glowing data nodes connected by thin lines, forming abstract constellation patterns over dark space',
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
- CRITICAL: The final image must contain ZERO text, letters, words or numbers of any kind

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
- ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS OR CHARACTERS OF ANY KIND — not even partial, stylized, pixelated or decorative. Zero text. None.
- ABSOLUTELY NO LOGOS, BRAND NAMES, TITLES OR LABELS — including "SAPO", "CRIPTO", or any other name
- No real-world branding, no faces, no people, ABSOLUTELY NO HUMAN FIGURES, PEOPLE, CHARACTERS OR SILHOUETTES
- Abstract geometric and electronic patterns only
- Tiny low-contrast pixel frog silhouette in bottom-right corner, subtle and secondary
- No photorealism, no volumetric lighting
- Aspect ratio: 16:9
`.trim();
}

// export function buildMondayImagePrompt(): string {
//   return `
// Pixel art illustration for a crypto news terminal called "Sapo Cripto".
// Theme: Monday morning market opening. A new week begins in the swamp.
//
// STYLE: Terminal dashboard awakening — screens lighting up, data streams initializing, signal pulses starting
// COLOR PALETTE: Deep green (#00ff41) on black, with amber (#ffb300) accent highlights suggesting morning energy
// MOOD: Calm anticipation. The swamp wakes up. Another week of watching the market.
//
// STRICT RULES:
// - Dark background base (#0a0a0a)
// - Strict 8-bit pixel grid, visible square pixel blocks
// - ABSOLUTELY NO TEXT, LETTERS, WORDS OR NUMBERS OF ANY KIND
// - ABSOLUTELY NO HUMAN FIGURES, PEOPLE OR CHARACTERS
// - No logos, no real-world branding
// - Tiny pixel frog silhouette in bottom-right corner, subtle
// - Aspect ratio: 16:9
// `.trim();
// }
//
// export function buildWeeklyImagePrompt(): string {
//   return `
// Pixel art illustration for a crypto news terminal called "Sapo Cripto".
// Theme: End of week recap. The swamp closes another chapter.
//
// STYLE: Radar sweep completing a full circle — week reviewed, signals catalogued, archives written
// COLOR PALETTE: Muted green (#1a8c3a) fading to deep teal, suggesting reflection and closure
// MOOD: Calm wisdom. Another week survived. The frog has seen it all before.
//
// STRICT RULES:
// - Dark background base (#0a0a0a)
// - Strict 8-bit pixel grid, visible square pixel blocks
// - No antialiasing, no soft brush strokes
// - ABSOLUTELY NO TEXT, LETTERS, WORDS OR NUMBERS OF ANY KIND
// - ABSOLUTELY NO HUMAN FIGURES, PEOPLE OR CHARACTERS
// - No logos, no real-world branding
// - Tiny pixel frog silhouette in bottom-right corner, subtle
// - Aspect ratio: 16:9
// `.trim();
// }
