// src/social/x-responder.ts
import { generateText } from 'ai';
import { withToadEye } from 'toad-eye/vercel';
import { z } from 'zod';
import { db } from '../db/client.js';
import { xInteractions, botState } from '../db/schema.js';
import { getModel } from '../llm/router.js';
import { logger } from '../utils/logger.js';
import { SAPO_REPLY_SYSTEM_PROMPT, buildReplyPrompt } from '../prompts/reply.prompt.js';
import { desc, eq, isNotNull } from 'drizzle-orm';

// ─── Schema ───────────────────────────────────────────────────────────────────

const ReplySchema = z.object({
  text: z.string().max(280),
  tone: z.string(),
  confidence: z.number().min(0).max(1),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPersonaMode(): Promise<string> {
  const row = await db.select().from(botState).where(eq(botState.key, 'persona_mode')).limit(1);
  return row[0]?.value ?? 'normal';
}

async function getRecentReplies(limit = 5): Promise<string[]> {
  const rows = await db
    .select({ replyText: xInteractions.replyText })
    .from(xInteractions)
    .where(isNotNull(xInteractions.replyText))
    .orderBy(desc(xInteractions.repliedAt))
    .limit(limit);

  return rows.map((r) => r.replyText).filter((t): t is string => t !== null);
}

// ─── Validate Reply ───────────────────────────────────────────────────────────

const BANNED_PATTERNS = [
  /\bbuy\b/i, // financial advice
  /\bsell\b/i,
  /\binvest\b/i,
  /\bAGI by\b/i, // timeline predictions
  /\bwill (replace|kill|destroy)\b/i, // doom predictions
  /http[s]?:\/\//i, // no links in replies
];

export function validateReply(text: string): boolean {
  if (text.length > 280) return false;

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      logger.warn(`⚠️ Reply failed validation — matched banned pattern: ${pattern}`);
      return false;
    }
  }

  return true;
}

// ─── Generate Reply ───────────────────────────────────────────────────────────

export async function generateReply(tweet: {
  authorHandle: string;
  content: string;
}): Promise<{ text: string; tone: string; confidence: number } | null> {
  try {
    const [personaMode, recentReplies] = await Promise.all([getPersonaMode(), getRecentReplies()]);

    const prompt = buildReplyPrompt({
      authorHandle: tweet.authorHandle,
      tweetContent: tweet.content,
      personaMode,
      recentReplies,
    });

    const { text: raw } = await generateText({
      model: getModel('reply'),
      system: SAPO_REPLY_SYSTEM_PROMPT,
      prompt,
      experimental_telemetry: withToadEye({ functionId: 'x-reply' }),
    });

    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = ReplySchema.safeParse(JSON.parse(clean));

    if (!parsed.success) {
      logger.warn(`⚠️ Reply schema validation failed: ${parsed.error.message}`);
      return null;
    }

    if (parsed.data.confidence < 0.6) {
      logger.debug(`⏸️ Reply confidence too low (${parsed.data.confidence}) — skipping`);
      return null;
    }

    if (!validateReply(parsed.data.text)) return null;

    return parsed.data;
  } catch (error) {
    logger.warn(`⚠️ generateReply error: ${error}`);
    return null;
  }
}
