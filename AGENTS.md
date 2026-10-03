# IlliniGuide agent guide

These rules apply repository-wide. `apps/web/AGENTS.md` takes precedence within
`apps/web/**`, and `packages/dorm/AGENTS.md` within `packages/dorm/**`.

## Project

A UIUC knowledge platform with a React 19 frontend and Cloudflare Worker gateway.
Supabase provides auth and Postgres; DeepSeek handles inference and Tavily
supplies web search.

| Path             | Role                                                                                                                                                                                    |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/`      | Frontend and Worker: SPA, static assets, agent loop, tools, skills, MCP.                                                                                                                |
| `packages/dorm/` | Dorm API (`@iguide/dorm`), bundled into the single Worker and mounted at `/api/dorms`; it also owns the shared dorm model and normalization helpers the SPA imports, plus the dorm SQL. |
| `packages/ui/`   | Business-agnostic UI primitives shared by the app and feature packages.                                                                                                                 |

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

## Commands

```bash
vp install                    # workspace dependencies
vp dev                        # SPA and Worker together, including /api/*
curl http://localhost:5173/api/health

vp check --fix                # format, lint, and typecheck with fixes
vp lint
vp build

# Worker and SPA suites are node:test files
(cd apps/web && node --test "worker/**/*.test.ts" "src/**/*.test.ts")
```

Run from the repo root: `dev`, `build`, and `preview` resolve to `apps/web`
through `defaultPackage` in the root `vite.config.ts`, and `cf` and `tsx`
commands run through `vp exec cf` and `vp dlx tsx` from `apps/web`.

Worker build, deploy, and secret commands all go through `vp exec cf` (or `cf`
once inside `apps/web`). There is no wrangler in this repo: no `wrangler.toml`,
no `npx wrangler`.

Run checks before delivery; `package.json` defines no validation scripts, so
`vp check` and the `node --test` run above are the whole local gate.

## Secrets

- Treat `VITE_` variables and Vite `define` values as public browser data.
- Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_MAPBOX_TOKEN` are
  injected into the SPA. Without the first two, sign-in and sync are off and
  dorms load from bundled data; without the Mapbox token, the map shows a notice.
- The Worker reads `apps/web/.dev.vars`, never `.env.local`: `Env` in
  `apps/web/worker/types.ts` requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`,
  `/api/chat` needs `DEEPSEEK_API_KEY`, and web search needs `TAVILY_API_KEY`.
  `GOOGLE_API_KEY` only feeds the `/api/gemini` proxy, which nothing calls. The
  legacy `VITE_DEEPSEEK_API_KEY` fallback covers `/api/deepseek`, never
  `/api/chat`; set `DEEPSEEK_API_KEY` instead.
- Set production secrets from `apps/web` with
  `vp exec cf workers secrets update <NAME> --worker uiuc`. Git ignores `.env*`
  and `.dev.vars*`; only the `.example` templates are tracked.
- For dev-proxy debugging, set `LLM_REQUEST_DUMP=1`; redacted dumps go to
  `apps/web/.debug/llm-requests/`.

## Architecture

- `apps/web/src` is the React 19 SPA shell: react-router 7, Tailwind CSS 4,
  assistant-ui for chat, and supabase-js for auth and user data.
- `packages/dorm` (`@iguide/dorm`) is the dorm domain API: a Hono sub-app
  plus its Supabase repositories, bundled into the Worker's output and mounted
  at `/api/dorms`. It is never deployed or built on its own. It is a runtime
  dependency of the SPA too — the `Dorm` model and the row/room normalization
  helpers live in `packages/dorm/src/types.ts` and `packages/dorm/src/utils/`,
  and `apps/web` imports them from `@iguide/dorm` instead of keeping a second
  copy. The dorm React UI lives in `apps/web/src` again —
  `src/pages/dorms/DormRoute.tsx` plus `src/components/housing/**` — and the
  SPA reaches it lazily at `/dorms/*`, so no other page loads dorm code.
  `packages/ui` (`@iguide/ui`) holds the UI primitives both use.
- The Worker's `/api/*` is routed by Hono: `worker/app.ts` builds the app,
  `worker/routes/index.ts` is the single URL table every endpoint is registered
  in, and `worker/middleware/` holds the `/api/*` JSON 404 and the SPA
  fallback. Hono never routes pages; react-router 7 still does that in the
  browser.
- `apps/web/worker` is the Cloudflare Worker named `uiuc`, and the only deployed
  Worker. It routes `/api/*` and serves the SPA's static assets for every other
  path, so the app and the whole API share one origin. It also hosts the
  streaming tool-use agent (`worker/agent/`), its tools and skills, and the
  in-memory MCP client.
- `tools/vite-bin` gives `cf build` a `vite` bin that forwards to the pinned
  Vite+, so builds never download an unpinned Vite.
- `tests/fixtures/` still holds `seed-data.sql` and `golden-queries.json` from
  the removed knowledge-base schema; nothing reads them.

```text
Browser ──same origin──> Worker "uiuc" (apps/web/worker)
                           ├─ /api/chat         tool-use agent on DeepSeek,
                           │                    ≤3 iterations, ≤5 tool calls
                           │                      ├─ web_search ─> Tavily (illinois.edu only)
                           │                      └─ custom_skills, MCP tools (experimental)
                           ├─ /api/deepseek     DeepSeek proxy behind the switched-off review translate button
                           ├─ /api/tavily       Tavily proxy that no client calls
                           ├─ /api/gemini       Gemini proxy that no client calls
                           ├─ /api/health, /api/integrations/*
                           ├─ /api/dorms/*       dorm API from @iguide/dorm, anon client + caller token
                           ├─ any other /api/*  404 JSON listing the available endpoints
                           └─ everything else ─> static assets (the SPA)
```

`/api/chat` is the only chat path: the chat page and the floating dorm assistant
both post to it and read back an SSE stream. Greetings, thanks, and other small
talk run without tools. When an agent iteration fails, it retries once with at
most one tool, then answers without tools. Nothing is preloaded for retrieval:
the agent's only source is a Tavily search at question time.

## Endpoint access

- Guests are allowed. `/api/chat` and `/api/integrations` accept requests
  without a token, but a Bearer token that Supabase rejects gets a 401. Every
  tokenless caller shares one `anonymous` identity, so an MCP server registered
  without a token loads into every guest chat.
- `/api/deepseek`, `/api/tavily`, and `/api/gemini` take no auth at all and
  relay any request with the Worker's own keys; `/api/deepseek` forwards
  caller-supplied `messages` as-is, and `/api/tavily` and `/api/gemini` send
  `Access-Control-Allow-Origin: *`, so any website can call them. Keys stay
  hidden, but anyone can spend their quota.
- The Worker rate-limits no endpoint.
- The MCP registry has no `KV` binding, so registrations live in Worker isolate
  memory and do not last.
- Supabase RLS is on. The dorm API reads through an anon client with the
  caller's own bearer token forwarded per query, so RLS decides every row and no
  service-role key exists in the Worker. Its writes require an admin caller,
  resolved from `user_metadata.is_admin` on the same GoTrue user document the
  Worker's identity resolver already fetches.
- `/api/dorms` is the dorm surface: the dorm list, one dorm, its comments, and
  the comment stats are guest-readable; `/favorites` and `/history` need a
  signed-in caller and answer `401` without one; `/:id/edit-history`,
  `PATCH /:id`, `POST /:id/restore`, `POST /:id/images` and comment moderation
  need an admin caller, `401` signed out and `403` signed in but not one.

## Verification

- The Worker and SPA suites are `node:test` files, not Vitest: run them from
  `apps/web` with `node --test "worker/**/*.test.ts" "src/**/*.test.ts"`.
  `vp test` cannot start in this app, because `@cloudflare/vite-plugin` rejects
  Vitest's `ssr` environment.
- `worker/agent/loop.test.ts` and `worker/agent/loop.baseline.test.ts` fail under
  plain Node, because those files import the agent's `.txt` prompts without the
  resolution hooks in `worker/test/utils/workerModules.ts` and die with
  `ERR_UNKNOWN_FILE_EXTENSION`. The rest pass.
- `packages/dorm` has its own suite, run from that directory with
  `node --test "test/**/*.test.ts"`. It injects a fake Supabase, so it needs no
  network. The cross-boundary test lives in the host instead:
  `src/services/__tests__/dormApi.contract.test.ts` drives the real
  `src/services/dormApi.ts` against the real Worker app with only the network
  stubbed.
- The only CI workflow is
  `.github/workflows/react-doctor.yml`: [React Doctor](https://www.react.doctor/ci)
  reviews pull requests and pushes to `main` that touch `apps/web` and reports
  without failing the check. Nothing else runs in CI, so `vp check`, the
  `node --test` run, and `vp build` are the delivery gate.

## Frontend layout

Paths below are relative to `apps/web/`:

- Use `src/index.tsx` as the entry and `src/App.tsx` for app composition.
- Keep `src/pages/**` focused on route orchestration. Put feature UI in
  `src/components/<feature>/`, generic UI in `src/components/ui/`, and layout in
  `src/components/layout/`.
- Promote hooks, services, utilities, and types to shared folders when unrelated
  features use them. Keep `src/legacy/**` outside runtime imports.
- Register pages in `src/app/pageRegistry.ts` and `src/app/routes.tsx`.
- Put API endpoints in `worker/routes/`. `worker/index.ts` handles `/api/*`;
  static assets serve other paths.

## Worker tools and retrieval

- Use tools for executable capabilities and skills for tasks that compose tools.
- Add tools under `apps/web/worker/tools/`, following `web-search.ts`
  and `types.ts`; register them on `ToolRegistry` in `apps/web/worker/routes/chat.ts`.
- Add skill JSON under `apps/web/worker/skills/` and include it in `SKILL_CONFIGS`
  in `apps/web/worker/tools/custom-skills.ts`. Each `required_tools` entry names a
  registered tool.
- The registry allows 5 calls per request, 10 seconds per call, and 4096-byte
  results. Return compact `content` and `metadata`, including structured errors.
  Give schemas clear descriptions and business-named parameters.
- Tavily web search is the only retrieval source. Handle conversational turns in
  `worker/agent/retrieval-policy.ts`.
- Keep tool output internal to the agent loop; stream lightweight SSE progress.
  Implement new retrieval in the Worker.

## Data and migrations

- Enable RLS and grants in each new table's migration: `anon` and `authenticated`
  receive `select`. The Worker holds no service-role key at all: it forwards the
  caller's own bearer token per query, so RLS is the only authority for both
  reads and writes. The one place a service-role key is used is the offline
  seed, which takes `SUPABASE_SERVICE_KEY` from the shell
  (`apps/web/scripts/seed-dorms-table.ts`); it runs offline and is not the
  Worker.
- Apply the dorm chain in `packages/dorm/scripts/migrations/`, starting with
  `create_dorms_table.sql`, then `add_categorized_tags.sql`, then follow-ups.
  `packages/dorm/AGENTS.md` owns the dorm schema order and its known conflicts;
  the seed and audit scripts live in `apps/web/scripts/` because they read the
  SPA's bundled dataset, and `apps/web/AGENTS.md` owns how to run them. It also
  owns the tables the tracked SQL never creates and the chat-owned
  `add_soul_and_memory.sql`.

## Deploy

One Worker serves the SPA and every `/api/*` route, so it is the only thing to
deploy. It uses `cloudflare.config.ts` and the `cf` CLI; check `cf --help` for
syntax. Worker vars live in `apps/web/cloudflare.config.ts`; the `Env` interface
in `apps/web/worker/types.ts` defines required configuration. For local runs,
copy `apps/web/.dev.vars.example` to `.dev.vars` and fill the values `Env` requires.

```bash
vp -C apps/web exec cf build           # Worker + SPA assets as Build Output
vp -C apps/web exec cf deploy --prebuilt
```

`--prebuilt` deploys that build output without rebuilding, and it only accepts
Build Output flagged as a Preview build, which `vp build` sets only when
`CLOUDFLARE_PREVIEW_BUILD=true` is in the environment (in PowerShell, run
`$env:CLOUDFLARE_PREVIEW_BUILD = "true"` first). Without it the deploy stops with
"Build Output was not created by a Preview build" (see [preview
deployments](https://developers.cloudflare.com/workers/configuration/previews/)).

```bash
cd apps/web
CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview
vp exec cf previews deploy --prebuilt
```

Alternatively, `vp exec cf previews deploy` without `--prebuilt` builds with the
flag set and deploys in one step. `cf previews deploy` names the preview after
the current Git branch.

Roll out in this order:

1. Create the tables the tracked SQL omits (`apps/web/AGENTS.md`), run the dorm
   chain (`packages/dorm/AGENTS.md`), then seed the dorms table with
   `apps/web/scripts/seed-dorms-table.ts` (`apps/web/AGENTS.md` for the command).
2. Set the Worker secrets: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are what
   `Env` requires (Cloudflare binds `ASSETS`), but chat needs `DEEPSEEK_API_KEY`
   and search needs `TAVILY_API_KEY`.
3. Deploy a preview, check `/api/health` on it, and verify streaming, tool
   calls, and fallback.
4. Deploy to production and check `/api/health` on `iguide.chat`.

Roll back the Worker itself; there is no second chat path to fall back to. To
point traffic back at an earlier uploaded version without rebuilding (see
[deployments](https://developers.cloudflare.com/workers/configuration/deployments/)):

```bash
cd apps/web
vp exec cf workers versions list --worker-id uiuc
vp exec cf workers deployments create --worker uiuc --strategy percentage \
  --versions '[{"version_id":"<last good version id>","percentage":100}]'
```

To rebuild instead, check out the last good commit and run `vp exec cf build`
and `vp exec cf deploy --prebuilt`. That also redeploys that commit's
`cloudflare.config.ts`.

`/api/chat` is the only chat path: it runs the Worker's tool-use agent and
streams SSE. Verify `/api/health`, SSE, and tool calls in staging before
production.
