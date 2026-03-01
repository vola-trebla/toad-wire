/**
 * Image Generator v2 — Gemini 2.5 Flash Image (Nano Banana)
 *
 * Pipeline:
 *   summary (Spanish) → Flash-Lite visual descriptor (English) → Gemini Image
 *
 * Features:
 *   - 5 rotating visual styles (same DNA, different "screens")
 *   - Sentiment-driven color palette
 *   - Flash-Lite for descriptor (free, unlimited)
 *   - Gemini 2.5 Flash Image for generation (500/month)
 *   - Pixel frog Easter egg always present
 *
 * Quota: 500 image generations/month (~16/day)
 */

import { GoogleGenAI } from '@google/genai';
import { generateText } from 'ai';
import { getModel } from '../llm/router.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const client = new GoogleGenAI({ apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY });

const IMAGE_MODEL = 'gemini-2.5-flash-image';

// ─── Visual styles — same DNA, different screens ─────────────────────────────

interface VisualStyle {
  name: string;
  description: string;
}

const VISUAL_STYLES: VisualStyle[] = [
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

const VISUAL_STYLES_NIGHT: VisualStyle[] = [
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

function pickStyle(): VisualStyle {
  return VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)]!;
}

function pickStyleNight(): VisualStyle {
  return VISUAL_STYLES_NIGHT[Math.floor(Math.random() * VISUAL_STYLES_NIGHT.length)]!;
}

// ─── Sentiment color palettes ─────────────────────────────────────────────────

const SENTIMENT_PALETTE = {
  bullish: 'bright neon green (#00ff41), upward energy, rising patterns, optimistic glow',
  bearish: 'deep red (#ff2200), crimson tones, downward pressure, warning signals',
  neutral: 'steel blue-grey (#4a9eff), balanced tones, analytical calm, cool palette',
};

// ─── Step 1: Flash-Lite visual descriptor ────────────────────────────────────

async function buildVisualDescriptor(summary: string, category: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel('batch'),
      prompt: `You are a visual art director for a crypto news terminal called "Sapo Cripto".

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
Summary: ${summary}`,
    });

    logger.info(`🎨 Visual descriptor: ${text.trim()}`);
    return text.trim();
  } catch (error) {
    logger.warn(`⚠️ Descriptor generation failed, using fallback: ${error}`);
    // Fallback — generic descriptor based on category
    return `Abstract ${category} crypto market visualization with symbolic data patterns.`;
  }
}

// ─── Step 2: Build full image prompt ─────────────────────────────────────────

function buildImagePrompt(
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

// ─── Main export ──────────────────────────────────────────────────────────────

export type ImageSentiment = 'bullish' | 'bearish' | 'neutral';

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  style: string;
  descriptor: string;
}

export async function generatePostImage(
  summary: string,
  sentiment: ImageSentiment,
  category: string,
): Promise<GeneratedImage | null> {
  try {
    const style = pickStyle();
    logger.info(`🎨 Image style: ${style.name} | sentiment: ${sentiment}`);

    // Step 1 — Flash-Lite: Spanish summary → English visual descriptor
    const descriptor = await buildVisualDescriptor(summary, category);

    // Step 2 — Gemini Image: prompt → image
    const prompt = buildImagePrompt(descriptor, sentiment, style);

    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData.mimeType) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        logger.info(
          `✅ Image generated — style: ${style.name}, size: ${(buffer.length / 1024).toFixed(1)} KB`,
        );
        return {
          data: buffer,
          mimeType: part.inlineData.mimeType,
          style: style.name,
          descriptor,
        };
      }
    }

    logger.warn('⚠️ Image generation returned no image parts');
    return null;
  } catch (error) {
    logger.error(`❌ Image generation failed: ${error}`);
    return null;
  }
}

export async function generateNightImage(nightMessage: string): Promise<GeneratedImage | null> {
  try {
    const style = pickStyleNight();
    logger.info(`🌙 Night image style: ${style.name}`);

    const descriptor = await buildVisualDescriptor(nightMessage, 'night');
    const prompt = buildImagePrompt(descriptor, 'neutral', style);

    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData.mimeType) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        logger.info(
          `✅ Night image generated — style: ${style.name}, size: ${(buffer.length / 1024).toFixed(1)} KB`,
        );
        return { data: buffer, mimeType: part.inlineData.mimeType, style: style.name, descriptor };
      }
    }
    return null;
  } catch (error) {
    logger.error(`❌ Night image generation failed: ${error}`);
    return null;
  }
}
