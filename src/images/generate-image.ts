/**
 * Image Generator v2 — Gemini 2.5 Flash Image (Nano Banana)
 *
 * Pipeline:
 *   summary (Spanish) → Flash-Lite visual descriptor (English) → Gemini Image
 *
 * Features:
 *   - 17 rotating visual styles (same DNA, different "screens")
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
import {
  buildDescriptorPrompt,
  buildImagePrompt,
  VISUAL_STYLES,
  VISUAL_STYLES_NIGHT,
  type ImageSentiment,
  type VisualStyle,
} from '../prompts/image.prompt.js';

export type { ImageSentiment };

const client = new GoogleGenAI({ apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY });
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const CATEGORY_VISUAL_OVERRIDES: Record<string, string> = {
  // seguridad
  hack: 'fracture',
  exploit: 'seismic-spike',
  breach: 'fracture',
  stolen: 'seismic-spike',
  // regulacion
  sec: 'depth-strata',
  ban: 'liquidity-wall',
  regulation: 'depth-strata',
  lawsuit: 'liquidity-wall',
  // defi
  defi: 'vector-terrain',
  liquidity: 'order-depth',
  protocol: 'bio-circuit',
  // tecnologia
  upgrade: 'bio-circuit',
  fork: 'node-cluster',
  mainnet: 'node-cluster',
  // institucional
  etf: 'holo-chart',
  institutional: 'continent-grid',
  blackrock: 'holo-chart',
  // crisis
  crash: 'seismic-spike',
  collapse: 'fracture',
  liquidat: 'liquidity-wall',
};

function pickStyleForTitle(title: string): VisualStyle {
  const lower = title.toLowerCase();
  for (const [keyword, styleName] of Object.entries(CATEGORY_VISUAL_OVERRIDES)) {
    if (lower.includes(keyword)) {
      const found = VISUAL_STYLES.find((s) => s.name === styleName);
      if (found) return found;
    }
  }
  return VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)]!;
}

function pickStyleNight(): VisualStyle {
  return VISUAL_STYLES_NIGHT[Math.floor(Math.random() * VISUAL_STYLES_NIGHT.length)]!;
}

export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  style: string;
  descriptor: string;
}

async function buildVisualDescriptor(summary: string, category: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel('batch'),
      prompt: buildDescriptorPrompt(summary, category),
    });

    logger.info(`🎨 Visual descriptor: ${text.trim()}`);
    return text.trim();
  } catch (error) {
    logger.warn(`⚠️ Descriptor generation failed, using fallback: ${error}`);
    return `Abstract ${category} crypto market visualization with symbolic data patterns.`;
  }
}

export async function generatePostImage(
  summary: string,
  sentiment: ImageSentiment,
  category: string,
  title?: string,
): Promise<GeneratedImage | null> {
  try {
    const style = pickStyleForTitle(title ?? summary);
    logger.info(`🎨 Image style: ${style.name} | sentiment: ${sentiment}`);

    const descriptor = await buildVisualDescriptor(summary, category);
    const prompt = buildImagePrompt(descriptor, sentiment, style);

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
          `✅ Image generated — style: ${style.name}, size: ${(buffer.length / 1024).toFixed(1)} KB`,
        );
        return { data: buffer, mimeType: part.inlineData.mimeType, style: style.name, descriptor };
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
