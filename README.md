# 📡 Toad Wire

**Autonomous AI-powered news engine for the artificial intelligence industry.**

Toad Wire monitors 15+ RSS sources across the AI landscape, scores and ranks articles using multi-factor analysis, generates English summaries and original pixel-art visuals via Google Gemini, and publishes optimized digests to Telegram and X — with zero manual intervention, 24/7.

Part of the **Sapo Labs** ecosystem.

---

## System Overview

Toad Wire is a TypeScript monolith running on Railway (single node, Docker, SQLite with WAL mode). The system is decomposed into four major subsystems:

| # | Subsystem | What it does |
|---|-----------|-------------|
| 1 | **News Intelligence Pipeline** | Ingestion, 4-level deduplication, multi-factor scoring, breaking detection |
| 2 | **LLM Orchestration & Content Engine** | Task-based model routing (Gemini Flash/Lite/Pro), structured summarization, batch content generation |
| 3 | **Generative Visual Pipeline** | 2-stage image generation: LLM descriptor → Gemini Image, 24 visual styles, sentiment-driven palettes |
| 4 | **Autonomous Operations Framework** | Cron scheduling, circuit breakers, rate limiting, health monitoring, graceful recovery |

---

## Architecture

```
RSS Feeds (15+)
    │
    ▼
┌─────────────────────────────────────────────┐
│  INGESTION: Parse → Dedup (4 levels) → Save │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  INTELLIGENCE: Score → Cluster → Rank       │
│  (authority × freshness + keyword boosts    │
│   − duplicate penalty − spam penalty)       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  CONTENT: Summarize (EN) → Format → Image   │
│  Gemini Flash  │  Flash-Lite  │  Flash Image │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  DELIVERY: Publisher → Telegram + X          │
│  (circuit breakers, rate limiter, jitter)   │
└─────────────────────────────────────────────┘
```

---

## 1. News Intelligence Pipeline

Multi-source ingestion with intelligent scoring and breaking news detection.

**Ingestion:** 15+ RSS feeds organized into 3 tiers by authority (0.0-1.0). Sources include MIT Technology Review, The Verge AI, Ars Technica, VentureBeat, TechCrunch, OpenAI, Anthropic, DeepMind, Hugging Face, IEEE Spectrum, and more. Feeds are health-monitored with automatic degradation tracking (healthy → degraded → dead).

**4-Level Deduplication:**
- **Level 0 — URL:** Exact URL match (free, instant)
- **Level 1 — Token overlap:** Jaccard similarity on tokenized titles
- **Level 2 — Semantic:** Cosine similarity on embeddings (catches paraphrased duplicates)
- **Level 3 — Story clustering:** Groups articles from different sources covering the same event

**Impact Scoring:**
```
ImpactScore = (authority × freshness) + keywordBoost + contextBoost
              − duplicatePenalty − spamPenalty
```

Keyword boosts are tiered: security events (+0.25), policy/regulation (+0.20), major AI labs (+0.20), frontier models (+0.15), open source (+0.15), safety/alignment (+0.15), research breakthroughs (+0.15), agents/infrastructure (+0.10).

**Breaking Detection:** When 3+ unique sources (or 2+ Tier-1 sources) cluster on the same story, the system triggers an immediate breaking news pipeline with a 2-hour cooldown between breaking posts.

---

## 2. LLM Orchestration & Content Engine

Centralized AI layer with cost-optimized model routing.

**Router Architecture:**

| Task | Model | Rationale |
|------|-------|-----------|
| `news`, `ranking` | Gemini 2.5 Flash | Core work — quality matters |
| `batch`, `goodnight` | Gemini 2.5 Flash-Lite | High volume, lower complexity |
| `weekly` | Gemini 2.5 Pro | Deep analysis, 1 call/week |

Flash-Lite handles ~60% of daily LLM calls at minimal cost. Pro is reserved for weekly deep analysis only.

**Structured Summarization:** Single LLM call produces: English summary, X-ready tweet (≤280 chars), sentiment (optimistic/cautious/neutral), category (research/industry/product/policy/safety/open_source), and named entities — all validated through Zod schemas.

**Batch Content Generation:** Personality-driven micro-post generation across content types: curated headline reactions, AI philosophy, and shitpost mode.

---

## 3. Generative Visual Pipeline

Two-stage AI image generation with 24 rotating visual styles.

**Pipeline:**
1. **Descriptor Stage:** Gemini Flash-Lite converts news summary into a visual scene descriptor (abstract, symbolic — not literal illustration)
2. **Generation Stage:** Gemini 2.5 Flash Image renders pixel art using the descriptor + style + sentiment palette

**Style System:**
- 16 daytime styles (terminal, micro-matrix, circuit, market-topography, holo-chart, fracture, seismic-spike, oscilloscope, etc.)
- 8 nighttime styles (moonlit-terminal, sleeping-circuit, signal-constellation, etc.)
- Category-based overrides: security news → `fracture`/`seismic-spike`, open source → `vector-terrain`/`bio-circuit`, industry → `holo-chart`/`continent-grid`

**Sentiment Palettes:**
- Optimistic: neon green (#00ff41), upward energy
- Cautious: deep red (#ff2200), downward pressure
- Neutral: steel blue (#4a9eff), analytical calm

Budget: 500 image generations/month (~16/day). Fallback: if generation fails, post publishes without image.

---

## 4. Autonomous Operations Framework

Self-healing infrastructure with zero manual intervention.

**Cron Scheduler:** 15+ rules covering morning digests, midday news, prime time posts, breaking news scanning (every 10 min), weekly summaries, and maintenance jobs. All times in UTC-3 with quiet hours (23:00-07:00).

**Circuit Breakers:** Three independent instances protecting Telegram, X API, and Gemini. Pattern: CLOSED → 5 consecutive failures → OPEN (all requests blocked) → 5 min cooldown → HALF-OPEN (single trial) → success → CLOSED.

**X Rate Limiter:** Deterministic posting limits mimicking organic behavior — 45 tweets/day (API max: 50, 5 buffer), 8/hour, minimum 10 min between posts, randomized 10-25 min intervals.

**Publisher Abstraction:** Pipelines prepare content, Publisher delivers. Channel-agnostic design — adding Discord or WhatsApp requires one new block with zero changes to any pipeline.

**Graceful Shutdown:** SIGTERM handler performs WAL checkpoint before exit, ensuring zero data loss on Railway redeploys.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | TypeScript, Node.js |
| Framework | Hono (HTTP server) |
| Database | SQLite (WAL mode) + Drizzle ORM |
| AI / LLM | Google Gemini (Flash, Flash-Lite, Pro, Flash Image) via Vercel AI SDK |
| Observability | toad-eye (OpenTelemetry), Pino, Sentry, Axiom |
| Scheduling | node-cron (15+ rules, UTC-3) |
| Delivery | twitter-api-v2 (OAuth 1.0a), Telegram Bot API (grammY) |
| Infrastructure | Railway (Docker, single node) |
| Validation | Zod (LLM output schemas, config validation) |

---

## Tech Decisions & Trade-offs

**Why SQLite over PostgreSQL?** Single-process monolith, ~350 records/day. SQLite with WAL mode handles 10,000+ writes/sec. PostgreSQL would add operational complexity with zero benefit at this scale.

**Why a Monolith?** Single Node.js process with cron-based scheduling. No message queues, no microservices, no Redis. The overhead of distributed infrastructure would provide negative ROI at current scale.

**Why Task-Based LLM Routing?** Business logic declares intent (`'news'`, `'ranking'`, `'batch'`), router selects the model. Switching a task to a different model = one line change in the router, zero changes in 15+ pipeline files.

**Why 4-Level Dedup?** Each level catches what the previous missed: URL → exact copies, token overlap → reformatted titles, cosine similarity → paraphrased content, story clustering → multi-source coverage.

**Why Pixel Art?** Pixel art constraints (8-bit grid, no anti-aliasing, limited palette) force Gemini Image into a narrow output space, producing consistently recognizable brand aesthetic across 500+ monthly images.

---

## Author

Built by **Sapo Labs** — AI systems & automation. Part of a solo engineering portfolio demonstrating end-to-end AI system design: from data ingestion and scoring algorithms through LLM orchestration and generative AI, to production infrastructure with self-healing capabilities.

---

*The toad doesn't sleep. The toad observes.* 🐸
