<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

---

# IlliniGuide — Agent Handbook

This file is the repo-wide source of truth for agents. `apps/web/AGENTS.md` is the
canonical rule set inside that package and wins over this file for `apps/web/**`.

## What this is

A serverless-first UIUC knowledge platform.

```text
Browser / Cloudflare Workers Static Assets (apps/web)
  -> Cloudflare Worker (apps/ai-agent)  — JWT auth, geo routing, tool registry, agent loop, SSE
       -> Supabase (auth, Postgres, RLS, pgvector + FTS)
       -> DeepSeek API (inference)
       -> Tavily API (live web fallback)
       -> Managed embedding API (query/document vectors)
```

No VPS is required on the default production path. `EMBEDDING_FALLBACK_URL` is an
optional self-hosted embedding endpoint only.

## Repo map

| Path                   | Role                                                                                    |
| :--------------------- | :-------------------------------------------------------------------------------------- |
| `apps/web/`            | React 19 app (`@iguide/web`), Worker API routes + static assets, dorm migrations.       |
| `apps/ai-agent/`       | Cloudflare Worker gateway (`@iguide/ai-agent`) — tools, skills, MCP, agent loop, tests. |
| `tools/data-pipeline/` | Supabase import, embedding-dimension check, v2 schema verification.                     |
| `data_collection/`     | Python + C++17 crawler/ETL that harvests UIUC sources into the knowledge base.          |
| `dorm_scripts/`        | Isolated Puppeteer/Bun scrapers for dorm Google Maps reviews. Not in any package.       |
| `supabase/migrations/` | Knowledge-base schema + retrieval RPCs (v2, source-first).                              |

## Commands

```bash
pnpm install                  # once, from the repo root (workspace-wide)

pnpm run dev:web              # Vite app  (vp -C apps/web dev)
pnpm run dev:ai-agent         # Worker    (cf dev, http://localhost:8787)
curl http://localhost:8787/health

pnpm run lint                 # oxlint across the workspace
pnpm run check                # vp check --fix  (format + lint + typecheck)
pnpm run typecheck            # tsc --noEmit, every package
pnpm run test                 # every package that defines `test`
pnpm run build                # build every package
```

CI (`.github/workflows/ci.yml`) runs exactly `pnpm run lint`, `pnpm run typecheck`,
`pnpm run test`, `pnpm run build`, plus a source secret scan and a compiled-bundle
secret scan. All of these must pass before deploy.

`vp` is workspace-aware from the root: `vp dev` / `vp build` resolve the app
package via `defaultPackage` in `vite.config.ts`, `vp -C apps/<pkg> <command>`
targets one package, and `vp run -r <task>` recurses.

Package-specific:

```bash
# Worker tests (node --test, markdown loader)
vp run --filter @iguide/ai-agent test

# Dorm data
vp run --filter @iguide/web seed:dorms            # needs SUPABASE_URL + SUPABASE_SERVICE_KEY
vp run --filter @iguide/web validate:dorm-data
vp run --filter @iguide/web audit:dorm-media

# QMD content pipeline
vp run --filter @iguide/web generate:qmd-content
vp run --filter @iguide/web sync:qmd

# Knowledge-base import
vp run --filter @iguide/data-pipeline import        # JSONL -> Supabase, with embeddings
vp run --filter @iguide/data-pipeline validate:embeddings
vp run --filter @iguide/data-pipeline verify:schema

# Crawler
cd data_collection && python -m venv .venv && .venv/bin/pip install -r requirements.txt
playwright install chromium && ./run_all.sh        # --fresh wipes crawl state

# Dorm scrapers (isolated from apps/web on purpose)
cd dorm_scripts && bun install && bun run scrape:pch
```

Both Cloudflare packages are configured in `cloudflare.config.ts` with
`defineConfig` from `cf/config`; no `wrangler.*` config remains.

## Non-negotiable rules

### Secrets

- Never give a sensitive key a `VITE_` prefix. CI fails on `VITE_*API_KEY`,
  `VITE_*API_TOKEN`, `VITE_*SECRET`, `VITE_DEEPSEEK`, `VITE_TAVILY`, `VITE_COZE_API`,
  `VITE_GOOGLE_API`, `VITE_GEMINI_API` in `apps/web/src/**`, and on hardcoded
  `tvly-` / `pat_` / `sk-<hex>` / `pk.eyJ…` literals.
- Never put a secret literal in `apps/web/vite.config.ts` `define {}`. That block is
  compiled into the shipped bundle, and the bundle scan greps `apps/web/dist/assets/`.
- Server-side keys live in `apps/web/.env.local` **without** the `VITE_` prefix
  (dev proxy / web Worker) or as Worker secrets (`cf workers secrets update <name>`).
- These web Worker proxy routes must keep existing — CI asserts them:
  `apps/web/worker/routes/deepseek.ts`, `apps/web/worker/routes/tavily.ts`,
  `apps/web/worker/routes/gemini.ts`, plus the `apps/web/worker/index.ts` router.
- Only public values are `VITE_`-prefixed: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_COZE_BOT_ID`,
  `VITE_API_GATEWAY_URL` (defaults to `https://api.iguide.chat`),
  `VITE_USE_TOOL_USE_RAG`.
- Set `LLM_REQUEST_DUMP=1` when debugging dev-proxy model calls; dumps land in
  `apps/web/.debug/llm-requests/` with headers and API-key query params redacted.
  `LLM_REQUEST_DUMP_INCLUDE_SECRETS=1` is a last resort.

### Frontend placement (`apps/web`)

- `src/index.tsx` is the runtime entry; `src/App.tsx` is the only app-composition file.
- `src/pages/**` stays thin — route-level orchestration only.
- Feature UI lives in `src/components/<feature>/**`.
- `src/components/ui/**` stays business-agnostic; `src/components/layout/**` stays
  layout-only.
- Promote to `src/hooks|services|utils|types` only when shared across unrelated features.
- `src/legacy/**` is quarantined: never import from it at runtime.
- New pages go in `src/app/pageRegistry.ts` (registry) and `src/app/routes.tsx` (route).
- `worker/**` is the web Worker: `worker/index.ts` routes `/api/*` and the
  legacy landing prefixes, everything else falls through to static assets. Add
  API endpoints under `worker/routes/`, never under `src/`.
- Document the runtime tree that exists, not the target tree. Don't mix half-finished
  file moves with feature work.

### Worker: tools and skills

- **Tool = executable interface. Skill = task template.** New low-level capability →
  new tool. Composing existing tools into a stable user task → new skill only. Don't
  invent a tool when a skill suffices.
- Tool file: `apps/ai-agent/src/tools/<name>.ts`, shaped after
  `apps/ai-agent/src/tools/search-knowledge-base.ts`, typed by `apps/ai-agent/src/tools/types.ts`.
- Register it in `apps/ai-agent/src/index.ts` on the `ToolRegistry` (basic tools first,
  higher-level tools after). A file that is not registered is dead code.
- Registry runtime contract (`apps/ai-agent/src/tools/registry.ts`): **max 5 tool calls per
  request, 10 s per call, results truncated at 4096 bytes**. Design tool output to
  survive truncation, and return structured `content` plus `metadata` — never a vague
  English error string, or the agent loop cannot act on it.
- The `description` and parameter names in the tool schema are the model's only guide.
  A vague description means the model never calls the tool. Keep params simple and
  business-named.
- Skill JSON: `apps/ai-agent/src/skills/<skill_id>.json`, imported and added to
  `SKILL_CONFIGS` in `apps/ai-agent/src/tools/custom-skills.ts`. It surfaces through the
  `custom_skills` tool; skills are not executors. Every name in `required_tools`
  must be a real registered tool.

### Retrieval policy

- Knowledge-base retrieval is the default. Web search is fallback/augmentation, used
  when local knowledge is insufficient.
- Conversational turns (greetings, thanks, ok/bye, …) skip retrieval tools entirely —
  see `apps/ai-agent/src/agent/retrieval-policy.ts`. Add patterns there, not in the tools.
- Tool output is internal to the agent loop. Stream lightweight progress over SSE;
  never dump raw tool JSON into the user conversation.
- Browser-side prompt-stuffing and client RAG orchestration are legacy behavior,
  reachable only with `VITE_USE_TOOL_USE_RAG=false` / `USE_TOOL_USE_RAG=false`. Do not
  add new client-side retrieval.

### Data model

The knowledge base is source-first with object projections. Every ingested fact flows
through four layers before it becomes queryable:

```text
sources -> source_snapshots -> artifacts -> chunks   (retrieval layer)
                                   |
                                   +-> course / course_offering / academic_calendar_item
                                       / location_or_service / housing  (object layer)
```

- Objects are **projections** and must carry provenance: `source_id`,
  `source_snapshot_id`, `primary_artifact_id`.
- **Never write a crawler that emits domain objects directly.** Write a fetcher /
  normalizer that lands in `sources -> source_snapshots -> artifacts`, then project.
  Exception: an official structured feed (ICS, JSON API) still enters the four layers
  as a `normalized_json` / `object_payload` artifact before projection.
- `raw_crawl.jsonl` is the primary input anchor (fields: `url`, `title`, `content`,
  `links`, `timestamp`). `uiuc_knowledge_base/**/*.md` is a **derived** artifact.
- `pagerank_score` and `priority` are deprecated legacy search-engine fields — never
  feed them into models or retrieval metadata.
- Crawler `category` tags are **weak metadata** for triage/filtering only, never an
  authoritative ontology. Retrieval filters categories in the Worker, not in SQL.
- RLS is on everywhere; `anon` and `authenticated` get `select`. Write to tables with
  the service key only. If you add a table, add its RLS and grants in the same migration.

### Migrations

Two independent chains — do not interleave them:

```text
supabase/migrations/            knowledge base (run in order)
  001_a1_source_tables.sql       sources, source_snapshots, artifacts, chunks + RLS
  002_object_first_tables.sql   course, course_offering, academic_calendar_item,
                                 location_or_service, housing + RLS
  003_search_functions.sql       hybrid_search, keyword_search, search_objects

apps/web/scripts/migrations/     app/dorm data (dorm chain first)
  create_dorms_table.sql, add_categorized_tags.sql, then the add_*/fix_* follow-ups
```

New knowledge-base migrations go in `supabase/migrations/` with the next numeric
prefix. The applied schema is the SQL in `supabase/migrations/`, not any prose.

### Retrieval internals

- Embeddings: `multilingual-e5-small`, **384 dimensions** (`chunks.embedding vector(384)`,
  HNSW cosine index). `EMBEDDING_DIMENSIONS` must match the column, or migration and
  import both fail — run `validate:embeddings` after changing it.
- `hybrid_search(query_text, query_embedding, match_count=10, full_text_weight=1.0,
semantic_weight=1.0, rrf_k=50)`: vector (`<=>`) and FTS (`websearch_to_tsquery`) run
  independently over a `2 * match_count` candidate window each, then fuse with
  `1/(rrf_k + rank)` weighted RRF. `keyword_search` is the degraded path when the
  embedding provider fails.
- Import chunking defaults (`tools/data-pipeline/import-to-supabase.ts`): 2000-char
  chunks, 200-char overlap, batches of 32.
- `search_knowledge_base` exposes `limit` with default 5, max 10, and falls back to
  `keyword_search` when embedding generation fails.

## Deploy and roll back

1. Apply Supabase schema, enable `pgvector`, run `supabase/migrations/*` in order.
2. Configure the embedding provider; verify 384-dim output.
3. Deploy the Worker with `USE_TOOL_USE_RAG=false`; confirm `GET /health`.
4. Import data, then validate `hybrid_search` returns sane rows.
5. Enable `USE_TOOL_USE_RAG=true` in staging; verify SSE, tool calls, and fallback.
6. Promote to production.

Both apps deploy with `cf`:

```bash
vp run --filter @iguide/ai-agent deploy     # cf deploy — api.iguide.chat
vp run --filter @iguide/web deploy         # cf deploy — SPA + Worker API routes
vp run --filter @iguide/web deploy:dry-run # cf deploy --dry-run
```

`cf` has no `tail` and no `--env` equivalent, so live log streaming and the old
`deploy:production` script are gone. `cf workers types` replaces
`wrangler types`, and `cf workers secrets update <name>` replaces
`wrangler secret put`.

Rollback is one flag: set `USE_TOOL_USE_RAG=false` (Worker var or secret), redeploy
the Worker, and set `VITE_USE_TOOL_USE_RAG=false` before rebuilding the frontend. No
VPS is needed to restore service.

Worker vars live in `apps/ai-agent/cloudflare.config.ts`; required secrets include
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`,
`EMBEDDING_API_BASE_URL`, `EMBEDDING_API_KEY` (plus `SILICONFLOW_API_KEY`,
`BACKEND_URL`, and `QMD_*` for the geo-routed legacy paths). Copy
`apps/ai-agent/.dev.vars.example` to `.dev.vars` for local Worker runs. The import
pipeline instead uses `SUPABASE_SERVICE_KEY`; the Worker `Env` interface in
`apps/ai-agent/src/index.ts` is the authoritative list.
