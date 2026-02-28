# 🐸 El Sapo Cripto

> Autonomous AI-powered crypto news bot for Spanish-speaking LATAM audiences.
> Aggregates, summarizes, and publishes crypto news to Telegram — fully automated.

📢 Telegram: [@ElSapoCripto](https://t.me/ElSapoCripto)
🌎 Website: [elsapocripto.com](https://elsapocripto.com)

---

## 🏗️ Architecture

```
RSS Sources (9 feeds)
       │
       ▼
Fetch + Filter + Dedup
  (keyword blacklist, age filter, semantic similarity)
       │
       ▼
Importance Scoring
  (source authority × freshness decay × keyword boost)
       │
       ▼
LLM Ranker (Gemini 2.5 Flash)
  → selects top N articles
       │
       ▼
Single-Request Summarize + Format
  → Telegram post + tweet version (1 LLM call per article)
       │
  ┌────┴────┐
  ▼         ▼
Telegram    X (Twitter)
(full post) (compact tweet)
```

### LLM Budget (Free Tier)

| Model | RPD | Usage |
|-------|-----|-------|
| Gemini 2.5 Flash | 20 | High-quality news posts (7/day) |
| Gemini 2.5 Flash-Lite | 1,000 | Batch micro-content for X |

---

## 👨‍🔬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5.x (strict) |
| LLM | Google Gemini 2.5 Flash + Flash-Lite (Vercel AI SDK) |
| Prices | CoinMarketCap API |
| Fear & Greed | Alternative.me API |
| RSS | rss-parser (9 feeds) |
| Database | SQLite + Drizzle ORM (with migrations) |
| Telegram | Grammy |
| Validation | Zod |
| Scheduling | node-cron |
| Logging | Pino + Axiom (structured, searchable) |
| Error tracking | Sentry |
| Health checks | Hono HTTP server |
| Uptime monitoring | UptimeRobot |
| Deploy | Railway (auto-deploy on push) |
| CI/CD | GitHub Actions (lint + typecheck + build) |

---

## 📁 Project Structure

```
src/
  index.ts                  # Entry point + cron schedule
  config.ts                 # Env validation via Zod
  sources/
    rss.ts                  # RSS fetcher (9 feeds, shuffled + interleaved)
    prices.ts               # CoinMarketCap price fetcher
    feargreed.ts            # Fear & Greed Index fetcher
  pipeline/
    scraper.ts              # Article scraper (HEAD validation + retry)
    summarize.ts            # Gemini single-request: summarize + format
    ranker.ts               # LLM-based article ranker
    dedup.ts                # URL deduplication via DB
    similarity.ts           # Semantic dedup via embeddings
    format.ts               # Telegram post formatter
    post.ts                 # Grammy Telegram sender
  health/
    server.ts               # Hono health check endpoint (/health)
  db/
    schema.ts               # Drizzle schema
    client.ts               # SQLite client + auto-migrations
  utils/
    logger.ts               # Pino + Axiom transport
    sentry.ts               # Sentry init
    truncate.ts             # Word-safe text truncation
    backup.ts               # Daily SQLite backup with rotation
  debug/
    test-pipeline.ts        # Manual pipeline test runner

drizzle/                    # DB migration files (auto-generated)
web/                        # Landing page (React + Vite → Vercel)
.github/workflows/          # CI/CD pipelines
```

---

## 📆 Schedule (Montevideo, UTC-3)

| Time | Content |
|------|---------|
| 10:00 | 🌅 Morning prices (BTC/ETH/SOL/DOGE + Fear & Greed) + top news |
| 12:00 | 📰 News digest |
| 15:00 | 📰 News digest |
| 18:00 | 📰 News digest |
| 21:00 | 🌙 Evening sign-off + fun news pick |
| 02:00 | 💾 DB backup (silent) |
| 00:00 Sun | 🗑️ Old articles cleanup (>7 days) |

---

## 📝 Post Format

```
🔥 Kraken xStocks rompe barreras con $25B en volumen

Las acciones tokenizadas de Kraken han superado los $25 mil millones
en volumen en menos de ocho meses...

_Cuando los números hablan solos, el Sapo solo aplaude._ 🐸

📊 🟢 Bullish
🔗 [Fuente: CoinTelegraph](https://...)

#Kraken #xStocks #Tokenizacion #Cripto
```

---

## 🔧 Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=@EI_Sapo
DATABASE_URL=file:/data/dev.db
COINMARKETCAP_API_KEY=
SENTRY_DSN=
AXIOM_TOKEN=
AXIOM_DATASET=el-sapo-cripto
```

---

## 🚀 Commands

```bash
npm run dev           # Run with hot reload (tsx watch)
npm run build         # Compile TypeScript
npm run start         # Run compiled dist/
npm run lint          # ESLint
npm run typecheck     # TypeScript check (no emit)
npm run format        # Prettier

npm run db:push       # Push schema to DB (dev)
npm run db:migrate    # Run migrations
npm run db:studio     # Drizzle Studio UI

npm run test:pipeline # Manual pipeline dry-run
```

---

## 🏥 Health Check

```
GET https://el-sapo-cripto-production.up.railway.app/health

{
  "status": "ok",
  "uptime_seconds": 3600,
  "last_posted_at": "2026-02-25T10:00:00.000Z",
  "last_article_in_db": "Bitcoin supera los $100K..."
}
```

---

## 🌐 RSS Sources

| Source | Feed |
|--------|------|
| CoinDesk | coindesk.com/arc/outboundfeeds/rss/ |
| CoinTelegraph | cointelegraph.com/rss |
| Decrypt | decrypt.co/feed |
| The Block | theblock.co/rss.xml |
| DL News | dlnews.com/arc/outboundfeeds/rss/ |
| CryptoBriefing | cryptobriefing.com/feed/ |
| Blockworks | blockworks.co/feed |
| Finbold | finbold.com/feed/ |
| BeInCrypto | beincrypto.com/feed/ |

---

## 📜 License

MIT

---

*El Sapo construye callado. 🐸*