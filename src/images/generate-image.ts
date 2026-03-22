/**
 * Image Generator — Gemini 2.5 Flash Image
 *
 * Pipeline:
 *   summary → Flash-Lite visual descriptor (English) → Gemini Image
 *
 * Features:
 *   - 17 rotating visual styles (cyberpunk / AI-lab / techno-retro)
 *   - Sentiment-driven dual-color palette
 *   - Category-aware style overrides for AI news topics
 *   - Pixel frog Easter egg always present
 */

import { GoogleGenAI } from '@google/genai';
import { generateText } from 'ai';
import { withToadEye } from 'toad-eye/vercel';
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
  // security / threats
  hack: 'signal-corrupt',
  exploit: 'bit-rot',
  breach: 'signal-corrupt',
  jailbreak: 'overfit-noise',
  vulnerab: 'bit-rot',
  // regulation / policy
  regulat: 'dataflow-pipe',
  ban: 'signal-corrupt',
  lawsuit: 'signal-corrupt',
  legislation: 'cluster-topology',
  // research / models
  benchmark: 'attention-map',
  training: 'loss-landscape',
  reasoning: 'neural-mesh',
  transformer: 'attention-map',
  parameter: 'gpu-rack',
  // infrastructure
  gpu: 'gpu-rack',
  compute: 'gpu-rack',
  inference: 'dataflow-pipe',
  scaling: 'cluster-topology',
  // open source / community
  'open source': 'mycelium-net',
  hugging: 'mycelium-net',
  ollama: 'bio-circuit',
  // product / launches
  release: 'synthwave-grid',
  launch: 'neon-terminal',
  announce: 'matrix-cascade',
  // safety / alignment
  safety: 'overfit-noise',
  alignment: 'loss-landscape',
  // disruption / crisis
  crash: 'signal-corrupt',
  collapse: 'bit-rot',
  shutdown: 'vhs-glitch',
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
      experimental_telemetry: withToadEye({ functionId: 'generate-image-prompt' }),
    });

    logger.info(`🎨 Visual descriptor: ${text.trim()}`);
    return text.trim();
  } catch (error) {
    logger.warn(`⚠️ Descriptor generation failed, using fallback: ${error}`);
    return `Abstract ${category} AI technology visualization with symbolic data patterns.`;
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
