import 'dotenv/config';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { google } from '@ai-sdk/google';
import { embed } from 'ai';

const OBVIOUS_DUPLICATE_THRESHOLD = 0.85;
const SEMANTIC_THRESHOLD = 0.8;
const DAYS_LOOKBACK = 3;

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((t) => t.length > 2),
    );
}

function tokenOverlap(a: string, b: string): number {
    const tokensA = tokenize(a);
    const tokensB = tokenize(b);
    const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
    const union = new Set([...tokensA, ...tokensB]);
    return intersection.size / union.size;
}

function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i]!, 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
}

async function getEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: google.textEmbedding('gemini-embedding-001'),
        value: text,
    });
    return embedding;
}

export async function isSimilarToPublished(title: string): Promise<boolean> {
    try {
        const since = new Date(Date.now() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000).toISOString();
        const recent = await db
            .select()
            .from(articles)
            .where(and(eq(articles.posted, true), gte(articles.createdAt, since)));

        if (recent.length === 0) return false;

        // Step 1: obvious duplicate via token overlap
        const obviousDuplicate = recent.find(
            (a) => tokenOverlap(title, a.title) > OBVIOUS_DUPLICATE_THRESHOLD,
        );

        if (obviousDuplicate) {
            logger.info(`🚫 Obvious duplicate (cheap filter): "${title}"`);
            return true;
        }

        // Step 2: semantic check via embeddings
        logger.info(`🔍 Running semantic check for "${title}"...`);
        const newEmbedding = await getEmbedding(title);

        for (const candidate of recent) {
            let candidateEmbedding: number[];

            if (candidate.embedding) {
                candidateEmbedding = JSON.parse(candidate.embedding);
            } else {
                candidateEmbedding = await getEmbedding(candidate.title);
                await db
                    .update(articles)
                    .set({ embedding: JSON.stringify(candidateEmbedding) })
                    .where(eq(articles.id, candidate.id));
            }

            const similarity = cosineSimilarity(newEmbedding, candidateEmbedding);
            logger.info(
                `📐 Similarity "${title}" vs "${candidate.title}": ${similarity.toFixed(3)}`,
            );

            if (similarity > SEMANTIC_THRESHOLD) {
                logger.info(`🚫 Semantic duplicate detected: "${title}"`);
                return true;
            }
        }

        return false;
    } catch (error) {
        logger.error({ err: error }, '❌ Similarity check failed, skipping');
        return false;
    }
}
