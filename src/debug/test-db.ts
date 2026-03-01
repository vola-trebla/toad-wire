import 'dotenv/config';
import { db } from '../db/client.js';
import { articles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const recent = await db
  .select({
    id: articles.id,
    title: articles.title,
    posted: articles.posted,
    hasEmbedding: articles.embedding,
  })
  .from(articles)
  .where(eq(articles.posted, true))
  .limit(10);

console.table(recent);
console.log(`\nTotal posted: ${recent.length}`);
