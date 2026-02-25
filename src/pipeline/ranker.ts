import { generateObject } from 'ai';
import { z } from 'zod';
import { type FeedArticle } from '../sources/rss.js';
import { logger } from '../utils/logger.js';
import { canMakeRequest, trackRequest } from '../utils/request-budget.js';
import { getModel } from '../llm/router.js';

const RankingSchema = z.object({
  selected: z.array(z.number()).min(1).max(5),
});

export async function rankArticles(
  articles: FeedArticle[],
  limit: number = 3,
): Promise<FeedArticle[]> {
  try {
    if (!canMakeRequest()) {
      logger.warn('⚠️ Budget exhausted, fallback to original order');
      return articles.slice(0, limit);
    }

    const list = articles
      .slice(0, 20)
      .map((a, i) => `${i}. [${a.source}] ${a.title}`)
      .join('\n');

    trackRequest('ranker', 'flash');

    const { object } = await generateObject({
      model: getModel('ranking'),
      schema: RankingSchema,
      prompt: `
You are the analytical brain of *El Sapo Cripto*, an expert curator that selects only high-impact and high-relevance crypto news for a Latin American audience.

Your task:
From the list below, choose the indices of the **${limit} most important, impactful, diverse, and useful headlines**.

Headlines:
${list}

--------------------------------------------
STRICT EVALUATION CRITERIA (in order)
--------------------------------------------

1) **Immediate Impact (highest priority)**
   Select headlines involving:
   - hacks, exploits, breaches, vulnerabilities, loss of funds
   - strong regulation (SEC, ETFs, government actions, central banks)
   - bankruptcies, investigations, lawsuits, arrests
   - events affecting BTC, ETH, SOL, large exchanges or stablecoins
   - protocol failures, chain halts, critical bugs

2) **Latin America Relevance**
   Prefer headlines involving:
   - LATAM regulation, adoption, institutions, exchanges
   - energy/mining, remittances, dollarization
   - Argentina, Brazil, Mexico, Colombia, Chile, El Salvador

3) **Macro / Market Signals**
   Prioritize:
   - major liquidity changes
   - ETF flows
   - on-chain anomalies with large impact
   - significant market movements backed by data

4) **Narrative / Human Interest Value**
   Choose only if meaningful:
   - unusual events with real context value
   - surprising stories with legitimate informational weight
   (Do NOT select trivial curiosities or empty hype.)

5) **Thematic Diversity**
   Avoid:
   - two headlines about the same event, company, protocol, or issue
   - duplicate or near-duplicate topics
   Prefer a balanced mix of categories.

--------------------------------------------
NEGATIVE FILTERS (penalties)
--------------------------------------------
Reject or downrank:
   - memecoins, celebrity pumps, hype with no substance
   - trivial partnership announcements
   - speculative predictions
   - headlines with no measurable impact
   - old news when newer alternatives exist

--------------------------------------------
KEYWORD WEIGHTING (boost these)
--------------------------------------------
hack, exploit, breach, ETF, SEC, regulation, lawsuit, arrest,
liquidation, stablecoin, mining, LatAm, Argentina, Brazil,
Mexico, El Salvador.

--------------------------------------------
SENTIMENT BALANCE
--------------------------------------------
If possible, avoid selecting headlines that produce a 100% bearish
or 100% bullish set. Prefer a mixed emotional tone when variety exists.

--------------------------------------------
SELF-CHECK (MANDATORY)
--------------------------------------------
Before giving the final output:
1. Ensure the selection maximizes:
   - impact
   - LATAM relevance
   - diversity
2. Replace the weakest item with a better candidate if needed.

--------------------------------------------
OUTPUT FORMAT
--------------------------------------------
Return ONLY a list of numeric indices (comma or space separated).
No explanation, no text, no commentary.
      `.trim(),
    });

    const selected = object.selected
      .filter((i) => i >= 0 && i < articles.length)
      .slice(0, limit)
      .map((i) => articles[i]!);

    logger.info(`🎯 Ranker seleccionó: ${selected.map((a) => a.title).join(' | ')}`);
    return selected;
  } catch (error) {
    logger.error({ err: error }, '❌ Ranker failed, fallback to original order');
    return articles.slice(0, limit);
  }
}
