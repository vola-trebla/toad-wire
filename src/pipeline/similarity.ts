import 'dotenv/config';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { type FeedArticle } from '../sources/rss.js';

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

async function getEmbeddings(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
        model: google.textEmbedding('gemini-embedding-001'),
        values: texts,
    });
    return embeddings;
}

export async function filterSimilar(candidates: FeedArticle[]): Promise<FeedArticle[]> {
    try {
        const since = new Date(Date.now() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000).toISOString();
        const posted = await db
            .select()
            .from(articles)
            .where(and(eq(articles.posted, true), gte(articles.createdAt, since)));

        if (posted.length === 0) return candidates;

        // Step 1: cheap token overlap filter
        const afterCheap: FeedArticle[] = [];
        for (const article of candidates) {
            const isDupe = posted.some(
                (p) => tokenOverlap(article.title, p.title) > OBVIOUS_DUPLICATE_THRESHOLD,
            );
            if (isDupe) {
                logger.info(`🚫 Obvious duplicate: "${article.title}"`);
            } else {
                afterCheap.push(article);
            }
        }

        if (afterCheap.length === 0) return [];

        // Step 2: batch embeddings (1 API call instead of N)
        logger.info(`🔍 Running batch semantic check for ${afterCheap.length} articles...`);
        const candidateEmbeddings = await getEmbeddings(afterCheap.map((a) => a.title));

        // Ensure posted articles have embeddings
        const postedEmbeddings: number[][] = [];
        const needEmbedding = posted.filter((p) => !p.embedding);

        if (needEmbedding.length > 0) {
            const newEmbeds = await getEmbeddings(needEmbedding.map((p) => p.title));
            for (let i = 0; i < needEmbedding.length; i++) {
                await db
                    .update(articles)
                    .set({ embedding: JSON.stringify(newEmbeds[i]) })
                    .where(eq(articles.id, needEmbedding[i]!.id));
                needEmbedding[i]!.embedding = JSON.stringify(newEmbeds[i]);
            }
        }

        for (const p of posted) {
            postedEmbeddings.push(JSON.parse(p.embedding!));
        }

        // Step 3: compare and filter
        const result: FeedArticle[] = [];
        for (let i = 0; i < afterCheap.length; i++) {
            let isDupe = false;
            for (let j = 0; j < postedEmbeddings.length; j++) {
                const sim = cosineSimilarity(candidateEmbeddings[i]!, postedEmbeddings[j]!);
                if (sim > SEMANTIC_THRESHOLD) {
                    logger.info(
                        `🚫 Semantic duplicate: "${afterCheap[i]!.title}" vs "${posted[j]!.title}" (${sim.toFixed(3)})`,
                    );
                    isDupe = true;
                    break;
                }
            }
            if (!isDupe) result.push(afterCheap[i]!);
        }

        logger.info(`✅ Similarity filter: ${candidates.length} → ${result.length} articles`);
        return result;
    } catch (error) {
        logger.error({ err: error }, '❌ Similarity filter failed, skipping');
        return candidates;
    }
}
