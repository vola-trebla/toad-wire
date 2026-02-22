# 🐸 El Sapo Cripto Bot

> _Sin drama, sin hype. Solo señal._

Autonomous AI-powered Telegram bot that monitors global crypto news, summarizes articles in Spanish using Google Gemini, and posts clean digests to [@ElSapoCripto](https://t.me/ElSapoCripto) — built for the Latin American crypto community.

---

## What it does

- Fetches crypto news from 4 RSS sources every few hours
- Filters articles by relevance using keyword matching
- Scrapes full article content for accurate summarization
- Summarizes and translates to Spanish via Google Gemini 2.5 Flash
- Adds editorial commentary ("El Sapo's thought") with personality
- Posts morning price digests with 1h/24h/7d changes
- Posts evening sign-offs with a fun news pick
- Deduplicates articles to avoid reposts
- Runs autonomously 24/7 on Railway

---

## Schedule (Montevideo time, UTC-3)

| Time  | Content                                              |
| ----- | ---------------------------------------------------- |
| 10:00 | 🌅 Morning prices (BTC/ETH/SOL/PEPE/DOGE) + top news |
| 12:00 | 📰 News digest (up to n articles)                    |
| 15:00 | 📰 News digest (up to n articles)                    |
| 18:00 | 📰 News digest (up to n articles)                    |
| 21:00 | 🌙 Evening sign-off + fun news pick                  |

---

## Post format

```
🔥 Kraken xStocks rompe barreras con $25B en volumen

Las acciones tokenizadas de Kraken han superado los $25 mil millones
en volumen en menos de ocho meses...

_Cuando los números hablan solos, el Sapo solo aplaude._ 🐸

📊 🟢 Bullish
🔗 Fuente: CoinTelegraph

#Kraken #xStocks #Tokenizacion #Cripto
```

---

## Tech Stack

| Layer      | Technology                                               |
| ---------- | -------------------------------------------------------- |
| Runtime    | Node.js 22 LTS                                           |
| Language   | TypeScript 5.x (strict)                                  |
| LLM        | Google Gemini 2.5 Flash (Vercel AI SDK)                  |
| Prices     | CoinMarketCap API                                        |
| RSS        | rss-parser (CoinDesk, CoinTelegraph, Decrypt, The Block) |
| Database   | SQLite + Drizzle ORM                                     |
| Telegram   | Grammy                                                   |
| Validation | Zod                                                      |
| Scheduling | node-cron                                                |
| Logging    | Pino                                                     |
| Deploy     | Railway (auto-deploy on push)                            |

---

## Project Structure

```
src/
  index.ts              # Entry point + cron schedule
  config.ts             # Env validation via Zod
  sources/
    rss.ts              # RSS fetcher (4 feeds, shuffled)
    prices.ts           # CoinMarketCap price fetcher
  pipeline/
    scraper.ts          # Article content scraper
    summarize.ts        # Gemini prompt + structured output
    dedup.ts            # Duplicate detection via DB
    format.ts           # Telegram post formatter
    post.ts             # Grammy Telegram sender
  db/
    schema.ts           # Drizzle schema
    client.ts           # SQLite client
  utils/
    logger.ts           # Pino logger
    truncate.ts         # Word-safe text truncation
```

---

## Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=@ElSapoCripto
DATABASE_URL=file:/data/dev.db
COINMARKETCAP_API_KEY=
```

---

## Channel

📢 Telegram: [@ElSapoCripto](https://t.me/ElSapoCripto)
🌎 Language: Spanish (Latin American)
🎯 Audience: Latin American crypto community
🤖 Powered by: Google Gemini 2.5 Flash

---

## Landing Page

🌐 Website: [el-sapo-cripto.vercel.app](https://el-sapo-cripto.vercel.app)

Static landing page built with React + TypeScript + Vite. Live crypto prices via Binance WebSocket.

```
web/
  src/
    App.tsx                 # Main page + Sapo Mood switcher
    hooks/
      useCryptoPrices.ts    # Binance WebSocket hook
    components/
      Ticker.tsx            # Live prices ticker
  index.css                 # Design system + animations
```

## License

MIT
