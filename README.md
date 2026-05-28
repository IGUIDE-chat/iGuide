# IlliniGuide Monorepo

English | [中文](./README_CN.md)

---

## English Version

A three-layer UIUC knowledge platform split across the app, API gateway, and crawler/ETL pipeline.

## Monorepo Map

| Path | Role |
| ---- | ---- |
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

The gateway verifies Supabase JWTs, routes by Geo-IP, hosts the server-side tool-use runtime, and supports SSE chat responses.

## API Gateway Notes

- JWT auth via Supabase tokens.
- Geo-IP routing for CN vs global traffic.
- CORS handling, health check, and streaming tool-use responses.
- Core production env vars now include: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`, `USE_TOOL_USE_RAG`, `EMBEDDING_API_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`.
- `EMBEDDING_FALLBACK_URL` is optional and should only be configured when you explicitly want a self-hosted fallback path.

## Placement Rules

- `src/App.tsx` is the only active app-composition entry.
- Keep route orchestration thin in `src/pages/**`.
- Keep feature UI in `src/components/<feature>/**`.
- Keep shared UI in `src/components/ui/**` only.
- Keep legacy code isolated in `src/legacy/**` and do not import from it at runtime.
- Register new pages in `src/app/pageRegistry.ts` and route changes in `src/app/routes.tsx`.

## Retrieval and Tool-Use Policy

1. The browser sends the user message to the Cloudflare Worker.
2. The Worker runs the server-side DeepSeek agent loop.
3. The agent chooses tools dynamically:
   - `search_knowledge_base` for Supabase hybrid retrieval
   - `web_search` for Tavily-backed live web search
   - `grep_docs` for exact text lookup
   - `custom_skills` for curated higher-level campus tasks
4. Knowledge-base retrieval stays the default path. Web search is fallback or augmentation when local knowledge is insufficient.
5. Frontend prompt-stuffing and browser-side retrieval orchestration are legacy behavior behind a feature flag only.

---

## Architecture Overview

### One-liner

A serverless-first stack uses Cloudflare Worker as the agent runtime, Supabase as the unified knowledge and user-data layer, and managed APIs for model inference, web search, and embeddings.

### Runtime Split

#### Layer 1 — Edge Layer

- Cloudflare Worker is the public entrypoint and the primary control plane.
- It verifies Supabase JWTs, applies rate limits, exposes SSE chat responses, and runs the tool-use agent loop.
- It also hosts the MCP-style tool registry used by the model.

#### Layer 2 — User Data Layer

- Supabase Auth handles sign-up, login, OAuth, and password recovery.
- PostgreSQL stores chat history.
- Supabase pgvector + full-text search power the knowledge base.
- RLS keeps each user scoped to their own records.
- Async logging writes conversations after the main response path completes.

#### Layer 3 — External Intelligence Services

- DeepSeek provides hosted model inference.
- Tavily provides hosted live web search.
- A managed embedding API is the default path for query/document vector generation.
- An optional self-hosted embedding fallback can be configured, but it is not part of the default production path.

### Hybrid Retrieval Pipeline

#### Extract

- Fetch HTML with `httpx`.
- Hash content with MD5 and skip unchanged pages.
- Track crawler state in the crawler pipeline.

#### Transform

- Clean pages with Trafilatura.
- Split content by Markdown headers instead of raw character counts.
- Inject source metadata into each chunk to preserve course and page context.

#### Load

- Store the knowledge base in Supabase PostgreSQL.
- Use pgvector for semantic retrieval.
- Use PostgreSQL full-text search for exact and keyword matches.
- Keep embeddings at a fixed dimension configured by `EMBEDDING_DIMENSIONS`.

#### Query

- Generate the query embedding through the configured embedding provider.
- Run vector search and full-text search in parallel through Supabase RPC functions.
- Fuse results with RRF.
- Let the model decide whether to call web search, grep, or custom skills after retrieval.

### Why Serverless-First Matters

- The default production path does not require a dedicated VPS.
- Cloudflare Worker + Supabase keep the control plane and data plane managed.
- Managed embedding APIs reduce ops burden while preserving retrieval quality.
- A fallback self-hosted embedding endpoint remains optional for cost or availability reasons.

### Operational Simplicity

- Cloudflare Pages hosts the frontend.
- Cloudflare Worker hosts the API gateway, MCP-style tool registry, and agent loop.
- Supabase hosts auth, structured memory, conversations, pgvector, and full-text retrieval.
- Hosted APIs keep model inference, web search, and embeddings off self-managed infrastructure.

## Deployment and Configuration Quick Reference

### Default Production Topology

```text
Browser / Cloudflare Pages
  -> Cloudflare Worker
    -> Supabase
    -> DeepSeek API
    -> Tavily API
    -> Managed Embedding API
```

Optional only:

```text
Cloudflare Worker
  -> EMBEDDING_FALLBACK_URL (self-hosted embedding endpoint)
```

### Required Configuration

#### Frontend / App

- Configure the app to call the Cloudflare Worker chat endpoint.
- Treat browser-side RAG orchestration as legacy behavior behind `USE_TOOL_USE_RAG=false` only.

#### Cloudflare Worker

Required secrets / vars:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`
- `USE_TOOL_USE_RAG`
- `EMBEDDING_API_BASE_URL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`

Optional:

- `EMBEDDING_FALLBACK_URL`

#### Supabase

- Enable `pgvector`.
- Run the retrieval-related migrations.
- Validate the documents/chunks tables and RPC functions before enabling the new path.

### Minimal Deployment Flow

1. Deploy Supabase schema and RPC functions.
2. Configure and validate the managed embedding provider.
3. Deploy the Cloudflare Worker with `USE_TOOL_USE_RAG=false` first.
4. Load data into Supabase and validate hybrid retrieval.
5. Enable tool-use in staging with `USE_TOOL_USE_RAG=true`.
6. Verify SSE responses, tool calls, fallback behavior, and benchmark quality.
7. Promote to production.

### Rollback Rule

If the new tool-use path regresses, disable it by switching `USE_TOOL_USE_RAG=false`. The default rollback target is the legacy frontend-driven path. Do not require a VPS to restore service.

### Validation Examples

```bash
# Worker health
curl http://localhost:8787/health

# App typecheck
cd app && pnpm run typecheck

# Worker local dev
cd api && pnpm run dev
```

### Tech Stack Summary

- **Supabase:** Auth, Postgres, and RLS.
- **Supabase pgvector + PostgreSQL FTS:** Unified knowledge retrieval.
- **Cloudflare Workers:** Edge gateway, tool registry, agent loop, and SSE runtime.
- **Cloudflare Pages:** Frontend hosting.
- **DeepSeek API:** Hosted model inference.
- **Managed Embedding API:** Default embedding generation path.
- **Optional self-hosted embedding endpoint:** Explicit fallback only.
- **httpx + Trafilatura:** Crawling and cleaning.
- **Tavily API:** Web fallback.
