# IlliniGuide Monorepo

English | [中文](./README_CN.md)

---

## English Version

A UIUC knowledge platform built on a React app and a single Cloudflare Worker that serves both the SPA and every API endpoint.

## Monorepo Map

| Path            | Role                                                                                      |
| :-------------- | :---------------------------------------------------------------------------------------- |
| `apps/web/`     | React app and its Cloudflare Worker: static assets, agent loop, tools, MCP, and `/api/*`. |
| `dorm_scripts/` | Standalone Puppeteer/Bun review scrapers.                                                 |

## Unified Setup

### Install

The workspace is a pnpm workspace driven by Vite+ from the repository root:

```bash
pnpm install
```

### App dev

```bash
pnpm run dev:web
pnpm run typecheck
```

`vp` is workspace-aware from the root. `vp dev` and `vp build` resolve the runnable
package on their own, and `vp -C apps/<package> <command>` runs a command inside a
single package. Recursive tasks use `vp run -r <task>`, or `--filter <package>` to
target one of them.

### Supabase dorm data

Run the SQL migrations in Supabase:

- `apps/web/scripts/migrations/create_dorms_table.sql`
- `apps/web/scripts/migrations/add_categorized_tags.sql`

Then seed or resync data with:

```bash
vp run --filter @iguide/web seed:dorms
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

### Worker and API basics

```bash
pnpm run dev:web
curl http://localhost:5173/api/health
```

The Worker serves the SPA and the whole API surface from one origin. It verifies
Supabase JWTs, routes by Geo-IP, hosts the server-side tool-use runtime, and
supports SSE chat responses.

## API Notes

- Every endpoint lives under `/api/*`, so the browser only makes same-origin calls.
- JWT auth via Supabase tokens.
- Health check at `/api/health` and streaming tool-use responses from `/api/chat`.
- Core production env vars now include: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`.
- `/api/chat` always runs the Worker's tool-use agent. Copy `apps/web/.dev.vars.example` to `apps/web/.dev.vars` for local runs; the template covers every field of the Worker's `Env` interface.

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
   - `web_search` for Tavily-backed live web search
   - `custom_skills` for curated higher-level campus tasks
4. Tavily web search is the only retrieval source.

---

## Architecture Overview

### One-liner

A serverless-first stack uses Cloudflare Worker as the agent runtime, Supabase as the user-data layer, and managed APIs for model inference and web search.

### Runtime Split

#### Layer 1 — Edge Layer

- Cloudflare Worker is the public entrypoint and the primary control plane.
- It verifies Supabase JWTs, applies rate limits, exposes SSE chat responses, and runs the tool-use agent loop.
- It also hosts the MCP-style tool registry used by the model.

#### Layer 2 — User Data Layer

- Supabase Auth handles sign-up, login, OAuth, and password recovery.
- PostgreSQL stores chat history.
- RLS keeps each user scoped to their own records.
- Async logging writes conversations after the main response path completes.

#### Layer 3 — External Intelligence Services

- DeepSeek provides hosted model inference.
- Tavily provides hosted live web search, and is the only retrieval source.

### Why Serverless-First Matters

- The default production path does not require a dedicated VPS.
- Cloudflare Worker + Supabase keep the control plane and data plane managed.

### Operational Simplicity

- A single `web` Cloudflare Worker serves the frontend (Workers Static Assets) and every
  `/api/*` endpoint, so there is no separate gateway host and no cross-origin hop.
- That same Worker hosts the MCP-style tool registry and the agent loop.
- Supabase hosts auth, structured memory, and conversations.
- Hosted APIs keep model inference and web search off self-managed infrastructure.

## Deployment and Configuration Quick Reference

### Default Production Topology

```text
Browser -> web Worker (static assets + /api/*)
  -> Supabase
  -> DeepSeek API
  -> Tavily API
```

### Required Configuration

#### Frontend / App

- Configure the app to call the Cloudflare Worker chat endpoint.

#### Cloudflare Worker

Required secrets / vars:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`

### Minimal Deployment Flow

1. Deploy the Supabase auth and user-data schema.
2. Deploy the Cloudflare Worker and confirm `/api/health` and `/api/chat` SSE.
3. Build the frontend in staging.
4. Verify SSE responses, tool calls, and fallback behavior.
5. Promote to production.

### Rollback Rule

Redeploy the previous Worker build. There is no second chat path to fall back to.

### Validation Examples

```bash
# Worker health
curl http://localhost:5173/api/health

# Workspace typecheck (every package)
pnpm run typecheck

# SPA and Worker local dev
pnpm run dev:web
```

### Tech Stack Summary

- **Supabase:** Auth, Postgres, and RLS.
- **Cloudflare Workers:** Edge gateway, tool registry, agent loop, and SSE runtime.
- **Cloudflare Workers Static Assets:** Frontend hosting (`web` Worker).
- **DeepSeek API:** Hosted model inference.
- **Tavily API:** The only retrieval source.
