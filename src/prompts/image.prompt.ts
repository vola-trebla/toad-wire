// src/prompts/image.prompt.ts

// ─── Visual styles ────────────────────────────────────────────────────────────

export interface VisualStyle {
  name: string;
  description: string;
}

export const VISUAL_STYLES: VisualStyle[] = [
  // ─── Cyberpunk Core ─────────────────────────────────────────────────────────
  {
    name: 'neon-terminal',
    description:
      'Retro CRT monitor with scanlines, phosphor glow cycling between cyan and magenta, floating UI panels with kanji-style grid overlays, 8-bit pixel aesthetic, rain of data characters.',
  },
  {
    name: 'matrix-cascade',
    description:
      'Vertical streams of falling luminous glyphs on pure black, columns of data at varying speeds and brightness, some characters frozen mid-fall, deep green base with electric cyan highlights.',
  },
  {
    name: 'neural-mesh',
    description:
      'Dense 3D neural network visualization, thousands of interconnected nodes pulsing with signal propagation, layered depth with hot magenta synaptic flashes on deep indigo background.',
  },
  // ─── Techno-Retro ──────────────────────────────────────────────────────────
  {
    name: 'vhs-glitch',
    description:
      'Corrupted VHS tape aesthetic, horizontal tracking distortion bands, RGB channel separation, blocky compression artifacts, warm amber and cool teal interference patterns.',
  },
  {
    name: 'synthwave-grid',
    description:
      'Infinite perspective grid receding into a neon sunset horizon, chrome wireframe mountains, hot pink and electric blue gradients, retro-futuristic 1980s computer art aesthetic.',
  },
  {
    name: 'crt-phosphor',
    description:
      'Extreme close-up of CRT pixel substructure, visible RGB phosphor dots, electron beam scan pattern, warm amber glow bleeding into shadow, retro-tech microscopy aesthetic.',
  },
  // ─── AI Lab / Research ─────────────────────────────────────────────────────
  {
    name: 'attention-map',
    description:
      'Transformer attention heatmap visualization, warm-to-cool color gradient blocks arranged in matrix formation, self-attention cross-patterns, structured rectangular grid with glowing hotspots.',
  },
  {
    name: 'loss-landscape',
    description:
      'Topographic 3D loss surface with sharp ravines and smooth plateaus, contour elevation lines in electric purple and deep orange, gradient descent paths glowing as thin trails.',
  },
  {
    name: 'token-rain',
    description:
      'Abstract tokenization visualization, text fragments dissolving into numerical embeddings, floating vector coordinates, transition from readable shapes to pure geometry, cyan-to-violet gradient.',
  },
  // ─── Infrastructure / Compute ──────────────────────────────────────────────
  {
    name: 'gpu-rack',
    description:
      'Isometric server rack visualization, dense stacked compute units with status LEDs, heat dissipation waves, structured industrial aesthetic, deep teal and warning amber palette.',
  },
  {
    name: 'dataflow-pipe',
    description:
      'Horizontal data pipeline visualization, parallel streams of different widths and speeds, bottleneck compression points, industrial plumbing aesthetic with neon fluid, dark chrome surfaces.',
  },
  {
    name: 'cluster-topology',
    description:
      'Distributed compute cluster map, asymmetric node placement with weighted connection lines, pulse propagation visualization, satellite-view aesthetic, electric purple on void black.',
  },
  // ─── Glitch / Disruption ───────────────────────────────────────────────────
  {
    name: 'signal-corrupt',
    description:
      'Aggressive digital signal corruption, jagged fault lines splitting the frame, geometric vector shards, RGB channel displacement, controlled fragmentation on pure black.',
  },
  {
    name: 'bit-rot',
    description:
      'Data decay visualization, structured pixel grid gradually dissolving into entropy, clean geometry on one side decaying into noise on the other, teal and rust-orange palette.',
  },
  {
    name: 'overfit-noise',
    description:
      'Overfitting visualization — perfect structured pattern on the left dissolving into chaotic memorized noise on the right, sharp boundary between order and chaos, magenta and white.',
  },
  // ─── Bio-Digital / Swamp-Tech ──────────────────────────────────────────────
  {
    name: 'bio-circuit',
    description:
      'Hybrid organic microcircuitry, branching bioluminescent neural filaments, structured synaptic pathways merging with silicon traces, swamp-tech aesthetic, emerald and dark-water palette.',
  },
  {
    name: 'mycelium-net',
    description:
      'Underground fungal network pattern as data infrastructure metaphor, branching filaments connecting resource nodes, bioluminescent pulses, dark soil tones with electric green highlights.',
  },
];

export const VISUAL_STYLES_NIGHT: VisualStyle[] = [
  {
    name: 'idle-terminal',
    description:
      'Dim CRT with single blinking cursor, almost-black screen, faint phosphor afterglow, one thin scanline drifting slowly downward.',
  },
  {
    name: 'cooldown-rack',
    description:
      'Server rack powering down, LEDs dimming one by one, residual heat shimmer, deep indigo and fading amber.',
  },
  {
    name: 'gradient-descent-rest',
    description:
      'Loss landscape at convergence — smooth valley floor, minimal contour lines, low-energy equilibrium, muted purple on near-black.',
  },
  {
    name: 'dormant-mesh',
    description:
      'Neural network in sleep mode, sparse node activity, occasional faint pulse traveling along a single edge, deep space black with dim cyan.',
  },
  {
    name: 'night-mycelium',
    description:
      'Underground network at rest, barely visible bioluminescent threads, slow rhythmic pulse at root nodes, dark earth tones with faint emerald.',
  },
  {
    name: 'static-channel',
    description:
      'Dead TV channel static at lowest brightness, barely perceptible grain, monochrome noise field, minimal visual energy.',
  },
];

// ─── Sentiment palettes ───────────────────────────────────────────────────────

export const SENTIMENT_PALETTE = {
  bullish:
    'electric cyan (#00ffff) and hot magenta (#ff00ff) accents on deep black, neon optimism, sharp highlights, forward momentum energy',
  bearish:
    'warning amber (#ff6600) bleeding into deep crimson (#cc0000), glitch distortion, tension patterns, system alert aesthetic',
  neutral:
    'cool violet (#7b68ee) and muted teal (#2dd4bf) on charcoal, analytical calm, balanced geometry, observatory mode',
} as const;

export type ImageSentiment = keyof typeof SENTIMENT_PALETTE;

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildDescriptorPrompt(summary: string, category: string): string {
  return `You are a visual art director for an AI news terminal called "Toad Wire".

Convert this AI news summary into a SHORT visual scene descriptor in English.
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
Pixel art illustration for an AI news terminal called "Toad Wire".

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
- ABSOLUTELY NO LOGOS, BRAND NAMES, TITLES OR LABELS — including "TOAD", "WIRE", or any other name
- No real-world branding, no faces, no people, ABSOLUTELY NO HUMAN FIGURES, PEOPLE, CHARACTERS OR SILHOUETTES
- Abstract geometric and electronic patterns only
- Tiny low-contrast pixel frog silhouette in bottom-right corner, subtle and secondary
- No photorealism, no volumetric lighting
- Aspect ratio: 16:9
`.trim();
}
