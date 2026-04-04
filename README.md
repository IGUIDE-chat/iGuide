# IlliniGuide Monorepo

English | [中文](./README_CN.md)

---

## English Version

A three-layer UIUC knowledge platform split across the app, API gateway, and crawler/ETL pipeline.

## Monorepo Map

| Path | Role |
|:-----|:-----|
| `app/` | React app, Cloudflare Pages functions, docs, migrations, and active UI runtime. |
| `api/` | Cloudflare Worker gateway for JWT auth, geo routing, proxying, CORS, and health checks. |
| `data_collection/` | Python crawler/ETL pipeline for harvesting, cleaning, and incrementally updating UIUC sources. |

## Unified Setup

### App dev

```bash
cd app
pnpm install
pnpm run dev
pnpm run typecheck
```

### Supabase dorm data

Run the SQL migrations in Supabase:

- `scripts/migrations/create_dorms_table.sql`
- `scripts/migrations/add_categorized_tags.sql`

Then seed or resync data with:

```bash
npx tsx scripts/seed-dorms-table.ts
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

### Crawler setup

```bash
cd data_collection
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
chmod +x run_all.sh
./run_all.sh
```

### API gateway basics

```bash
cd api
pnpm install
pnpm run dev
curl http://localhost:8787/health
```

The gateway verifies Supabase JWTs, routes by Geo-IP, proxies to the backend through Argo Tunnel, and supports SSE chat responses.

## API Gateway Notes

- JWT auth via Supabase tokens.
- Geo-IP routing for CN vs global traffic.
- CORS handling, health check, and streaming proxy support.
- Production env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY`, `SILICONFLOW_API_KEY`, `BACKEND_URL`.

## Placement Rules

- `src/App.tsx` is the only active app-composition entry.
- Keep route orchestration thin in `src/pages/**`.
- Keep feature UI in `src/components/<feature>/**`.
- Keep shared UI in `src/components/ui/**` only.
- Keep legacy code isolated in `src/legacy/**` and do not import from it at runtime.
- Register new pages in `src/app/pageRegistry.ts` and route changes in `src/app/routes.tsx`.

## Dify Chatflow Setup

1. Retrieve from the `UIUC Campus Guide` knowledge base first.
2. If retrieval returns results, pass them into the LLM and answer directly.
3. If retrieval is empty, call a web-search tool such as Tavily and answer from live web results.
4. Keep the chatflow knowledge-base-first so web search is only the fallback path.

---

## Architecture Overview

### One-liner
A Cloudflare edge layer, Supabase user-data layer, and Chicago VPS intelligence layer work together as a low-latency RAG system for UIUC content.

### 3-Layer Split

#### Layer 1 — Edge Layer

- Cloudflare Workers handle the public entrypoint.
- The auth proxy verifies Supabase JWTs before proxying traffic.
- Geo-IP routing sends CN traffic to SiliconFlow and global traffic to DeepSeek US.
- Argo Tunnel keeps the Chicago VPS private and stabilizes edge-to-core requests.

#### Layer 2 — User Data Layer

- Supabase Auth handles sign-up, login, OAuth, and password recovery.
- PostgreSQL stores chat history.
- RLS keeps each user scoped to their own records.
- Async logging writes conversations after the main response path completes.

#### Layer 3 — Core Intelligence Layer

- A Chicago-based VPS runs the Python core services, ideally behind FastAPI.
- The core layer stays close to UIUC sources for low-latency crawling and local processing.

### Hybrid Retrieval Pipeline

#### Extract

- Fetch HTML with `httpx`.
- Hash content with MD5 and skip unchanged pages.
- Track document state in `knowledge.db`.

#### Transform

- Clean pages with Trafilatura.
- Split content by Markdown headers instead of raw character counts.
- Inject source metadata into each chunk to preserve course and page context.

#### Load

- Store the knowledge base in SQLite.
- Use FTS5 for exact keyword matches.
- Use sqlite-vec plus ONNX embeddings for semantic retrieval.

#### Query

- Run FTS5 and vector search in parallel.
- Rerank candidates with `bge-reranker-v2-m3`.
- Fall back to Tavily when the top score is too low.

### Why Chicago VPS Matters

- It is physically close to UIUC sources, so crawling is fast.
- CPU-heavy cleaning, chunking, and vectorization stay local instead of using expensive APIs.
- SQLite keeps retrieval and raw-text lookup in one process.

### Operational Simplicity

- `knowledge.db` stays easy to back up and move.
- FTS5 + vector search live beside the source text, so the system avoids extra infra.

### Tech Stack Summary

- **Supabase:** Auth, Postgres, and RLS.
- **Cloudflare Workers / Argo Tunnel:** Edge gateway, routing, and secure backhaul.
- **Python FastAPI:** Core backend services.
- **SQLite 3 + FTS5 + sqlite-vec:** Local knowledge store and retrieval indexes.
- **ONNX Runtime:** Local embedding and reranking inference.
- **httpx + Trafilatura:** Crawling and cleaning.
- **Tavily API:** Web fallback.
