# IlliniGuide 🌽 — Your UIUC campus guide, in English and 中文

<p align="center">
  <a href="https://iguide.chat"><img src="https://img.shields.io/badge/live-iguide.chat-E84A27?style=flat-square" alt="Live site"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.18%2B%20%7C%2024.11%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 22.18+ or 24.11+"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-12.7.0-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 12.7.0"></a>
</p>

IlliniGuide (iGuide) is a campus assistant for students at the University of Illinois Urbana-Champaign, built with new students in mind and live at [iguide.chat](https://iguide.chat). Ask it about housing, courses, buses, or campus services in a streaming chat, read a bilingual library of campus guides, or explore residence halls on a map and compare them side by side. The React app and every `/api/*` endpoint ship together as one Cloudflare Worker, with Supabase for accounts, saved chats, favorites, and dorm data.

**Grounded, not guessed.** The chat agent's one retrieval tool is a Tavily web search limited to official `illinois.edu` pages; past that, it answers from general knowledge and says when it's unsure. Every run is bounded (at most 3 agent iterations, 5 tool calls, and 10 s per tool call), provider keys never leave the Worker, and nobody has to sign in: guests keep their chats and favorites in the browser, and signed-in users store them in Supabase instead (guest data isn't carried over when you sign in).

[Website](https://iguide.chat) · [AGENTS.md](AGENTS.md) · [Issues](https://github.com/IGUIDE-chat/iGuide/issues) · [中文](README_CN.md)

## What you can do

- **Chat** — answers stream in as Markdown, with a collapsible "thinking" timeline that times each step, a card for each web search, and copy buttons. Past chats sit in the sidebar, grouped by date, with pin and delete.
- **Library** — 10 guides in 6 categories (housing, academics, transportation, food, social life, safety and health), searchable by title and tag. Signed-in users also get a reading history.
- **Dorms** — the bundled dataset covers 23 halls (19 University Housing, 4 Private Certified Housing). Search, sort, and filter by zone, type, price, beds, bathrooms, A/C, facilities, and lifestyle; browse a Mapbox map with campus zones and landmarks; compare up to 4 halls; save favorites; and open galleries and floor plans. A floating dorm assistant answers questions on every dorm page.
- **Two languages** — every page, article, and dorm label exists in English and Simplified Chinese. The app starts in your browser's language, and you can switch from the sidebar.
- **Optional accounts** — sign in with Google, Microsoft, or email through Supabase Auth. The Profile page lets you edit your display name, the AI persona, and the AI's memory of you.
- **Admin editing** — admins (`user_metadata.is_admin`) edit dorm content, tags, and photos in place, with an edit history they can restore from.

Not live yet: **Courses** and **Resume** are "coming soon" pages with an email waitlist, dorm reviews are built but switched off (`SHOW_COMMENTS = false`), and the Profile → Integrations panel is a UI mock. The persona and memory you edit on the Profile page don't reach the model: the app doesn't send its Supabase token to `/api/chat`, so the agent answers every chat as a guest. Memory only flows one way for now: the model still tags what it learns about you, and the app saves those notes for signed-in users, but nothing reads them back. The chat can still show up to three follow-up question chips, but `/api/chat` no longer asks the model for them, so they rarely appear.

## Quick start

You need Node 22.18+ or 24.11+ (what both `vite-plus` and the `cf` CLI accept) and pnpm. The repo pins `pnpm@12.7.0` through `packageManager`.

```bash
git clone https://github.com/IGUIDE-chat/iGuide.git
cd iGuide
pnpm install
cp apps/web/.env.local.example apps/web/.env.local   # public VITE_ values for the SPA
cp apps/web/.dev.vars.example apps/web/.dev.vars     # Worker secrets for local runs
```

Before you start the server, uncomment and set `DEEPSEEK_API_KEY` in `.dev.vars`. DeepSeek is the only model provider, and although the template lists the key as optional, chat gets no answer without it. Set `TAVILY_API_KEY` there too, or every web search returns an error to the model, which can then answer only from general knowledge. The server-side `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` entries in `.env.local` aren't read by any repo code; the Worker reads `.dev.vars`. Leave any other value you don't have empty rather than keeping its placeholder: without a Supabase URL and key, sign-in and sync are off and dorms load from bundled data; without `VITE_MAPBOX_TOKEN`, the map shows a notice.

```bash
pnpm run dev:web
```

`dev:web` runs the real Worker behind the Vite dev server, so the SPA and `/api/*` share one origin, as they do in production. Check the Worker from a second terminal (5173 is Vite's default port; use the URL `dev:web` prints):

```bash
curl http://localhost:5173/api/health
```

## How it fits together

- [`apps/web/src`](apps/web/src) is the React 19 SPA shell: react-router 7, Tailwind CSS 4, assistant-ui for chat, and supabase-js for auth and user data.
- [`packages/dorm`](packages/dorm) is the dorm feature as its own workspace package: list, Mapbox GL map, detail, compare, and reviews, plus the dorm SQL chain, data scripts, and review scrapers. The web app mounts it lazily at `/dorms/*` through one adapter, so no other page loads dorm code or queries dorm tables. Shared UI primitives live in [`packages/ui`](packages/ui).
- [`apps/web/worker`](apps/web/worker) is the Cloudflare Worker (named `uiuc`). It routes `/api/*` and serves the SPA's static assets for every other path. It also hosts the tool-use [agent loop](apps/web/worker/agent), its [tools](apps/web/worker/tools) and [skills](apps/web/worker/skills), and an experimental [MCP client](apps/web/worker/mcp) for user-registered servers (in memory only, with no UI yet).
- SQL runs by hand in the Supabase SQL editor: the dorm chain in [`packages/dorm/scripts`](packages/dorm/README.md#dorm-database) (dorms, edit history, the photo bucket, favorites and viewing history), then the persona and memory tables in [`apps/web/scripts/migrations`](apps/web/scripts/migrations).
- [`tools/vite-bin`](tools/vite-bin) gives `cf build` a `vite` bin that forwards to the pinned Vite+, so builds don't download an unpinned Vite.

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
                           ├─ any other /api/*  404 JSON listing the available endpoints
                           └─ everything else ─> static assets (the SPA)
```

`/api/chat` is the only chat path: the chat page and the floating dorm assistant both post to it and read back an SSE stream. Greetings, thanks, and other small talk run without tools. When an agent iteration fails, it retries once with at most one tool, then answers without tools.

Nothing needs loading for retrieval: the agent's only source is a Tavily search at question time. [`tests/fixtures/`](tests/fixtures) still holds `seed-data.sql` and `golden-queries.json` from the removed knowledge-base schema; nothing reads them.

## Security

- Anything `VITE_`-prefixed or injected through Vite `define` is public browser data, and so is anything under `apps/web/src`. In the SPA, only the Supabase URL and anon key and the Mapbox token use that prefix; never put a provider key in `src` or in a `VITE_` variable in `.env.local`. The one other `VITE_` name is server-side: the Worker still accepts a legacy `VITE_DEEPSEEK_API_KEY` secret as a fallback for `/api/deepseek` (not `/api/chat`). Set `DEEPSEEK_API_KEY` instead.
- Provider keys (DeepSeek, Tavily, Google) and the Worker's Supabase URL and anon key are Worker secrets. Keep them in `apps/web/.dev.vars` locally; in production, set them from `apps/web` with `pnpm exec cf workers secrets update <NAME> --worker uiuc` (the CLI then asks for the secret type and value). Git ignores `.env*` and `.dev.vars*`; only the `.example` templates are tracked.
- Guests are allowed. `/api/chat` and `/api/integrations` accept requests without a token, but a Bearer token that Supabase rejects gets a 401. Every tokenless caller shares one `anonymous` identity, so an MCP server registered without a token is loaded into every guest chat. There's no `KV` binding yet, so the MCP registry lives in Worker isolate memory and registrations don't last.
- `/api/deepseek`, `/api/tavily`, and `/api/gemini` take no auth at all and relay any request with the Worker's own keys; `/api/deepseek` forwards caller-supplied `messages` as-is, and `/api/tavily` and `/api/gemini` send `Access-Control-Allow-Origin: *`, so any website can call them. The keys stay hidden, but anyone can spend their quota.
- The Worker doesn't rate-limit any endpoint.
- Supabase RLS is on, and dorm writes require `user_metadata.is_admin`.

## Documentation

| Goal                                           | Start here                                                                                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Learn the repo rules, commands, and data model | [AGENTS.md](AGENTS.md)                                                                                                                                                                 |
| Work on the React app or the Worker            | [apps/web/AGENTS.md](apps/web/AGENTS.md)                                                                                                                                               |
| Change the agent's prompt or loop              | [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts) · [apps/web/worker/agent](apps/web/worker/agent)                                                          |
| Add an agent tool or skill                     | [apps/web/worker/tools](apps/web/worker/tools) · [apps/web/worker/skills](apps/web/worker/skills)                                                                                      |
| Configure secrets and the Worker               | [apps/web/.dev.vars.example](apps/web/.dev.vars.example) · [apps/web/.env.local.example](apps/web/.env.local.example) · [apps/web/cloudflare.config.ts](apps/web/cloudflare.config.ts) |
| Work on dorm pages, SQL, or seed data          | [packages/dorm](packages/dorm/README.md)                                                                                                                                               |
| See what runs on pull requests                 | [.github/workflows/react-doctor.yml](.github/workflows/react-doctor.yml)                                                                                                               |

## Development

The repository is a pnpm workspace driven by [Vite+](https://viteplus.dev) (`vp`). `pnpm-workspace.yaml` lists `apps/*`, `packages/*`, and `tools/*`, which today means two packages: `@iguide/web` (`apps/web`) and `@iguide/vite-bin` (`tools/vite-bin`). Dependencies use the `workspace:` and `catalog:` protocols, so plain `npm install` is not supported. `pnpm install` also sets up a pre-commit hook that runs `vp check --fix` on staged files.

```bash
pnpm run dev:web     # Vite dev server with the Worker behind it
pnpm run check       # format, lint, and type-check, with fixes
pnpm run fmt         # Oxfmt, writes in place
pnpm run lint        # Oxlint, type-aware and type-checked
pnpm run build       # production build of apps/web
pnpm run preview     # serve the production build locally
```

`pnpm run test` and `pnpm run typecheck` still exist, but no package defines those tasks, so both run nothing; type checking happens inside `vp lint`. The Worker and SPA tests are `node:test` files that no script runs yet, so run them from `apps/web` with Node:

```bash
cd apps/web
node --test "worker/**/*.test.ts" "src/**/*.test.ts"
```

Two of those files, `worker/agent/loop.test.ts` and `worker/agent/loop.baseline.test.ts`, fail under plain Node today because the agent loop imports its `.txt` prompts as text modules; the rest pass.

There's no CI test workflow. [React Doctor](.github/workflows/react-doctor.yml) reviews pull requests and pushes to `main` that touch `apps/web` and reports without failing the check. Run `pnpm run check`, the tests above, and `pnpm run build` yourself before you push.

## Deploy

One Worker serves the SPA and the whole API, so it's the only thing to deploy. It's configured in [`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts) and deployed with the `cf` CLI, a dev dependency of `apps/web` only. The config pins a Cloudflare `accountId` and the custom domain `iguide.chat`, and mirrors the dashboard by enabling the `workers.dev` subdomain and Preview URLs. A fork must change `accountId` and `domains` before it deploys.

To deploy by hand:

```bash
cd apps/web
pnpm exec cf build    # Worker + SPA assets as Build Output
pnpm run deploy       # cf deploy --prebuilt
```

To try a branch first, deploy a Worker Preview instead. `cf previews deploy` names the preview after the current Git branch. `--prebuilt` accepts only Build Output flagged as a Preview build, and `vp build` sets that flag only when `CLOUDFLARE_PREVIEW_BUILD=true` is in the environment (in PowerShell, run `$env:CLOUDFLARE_PREVIEW_BUILD = "true"` first); without it, the deploy stops with "Build Output was not created by a Preview build":

```bash
cd apps/web
CLOUDFLARE_PREVIEW_BUILD=true pnpm run build:preview   # vp build --mode preview
pnpm run deploy:preview                                # cf previews deploy --prebuilt
```

Alternatively, `pnpm exec cf previews deploy` (without `--prebuilt`) builds with the flag set and deploys in one step.

Roll out in this order:

1. Create the `conversations`, `messages`, `reading_history`, `user_profiles`, and `mailing_list` tables yourself: the tracked SQL doesn't create them, and `apps/web/scripts/migrations/add_soul_and_memory.sql` references `conversations`. Run the dorm chain in `packages/dorm/scripts/migrations/`, starting with `create_dorms_table.sql`, and `packages/dorm/scripts/create_dorm_user_features.sql` (favorites and viewing history), then `add_soul_and_memory.sql`. On a fresh project, delete the last line of `create_dorms_table.sql` first: it comments on a `dorm_overrides` table that no tracked SQL creates, and that error rolls back the whole file in the SQL editor.
2. Seed the dorms table. The script reads `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from the shell, not from `.env` files.

   ```bash
   cd packages/dorm && pnpm run seed
   ```

   On a database built only from the tracked SQL, the seed fails: `add_categorized_tags.sql` adds `chk_bathroom_type`, which allows only `communal`, `semi-private`, and `private`, but the seed writes `individual-use` for four dorms, and one rejected row fails the whole upsert. Widen the constraint before you seed:

   ```sql
   ALTER TABLE public.dorms DROP CONSTRAINT chk_bathroom_type;
   ALTER TABLE public.dorms ADD CONSTRAINT chk_bathroom_type
     CHECK (bathroom_type IN ('communal', 'individual-use', 'semi-private', 'private'));
   ```

3. Set the Worker secrets. `Env` in [`worker/types.ts`](apps/web/worker/types.ts) requires only `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Cloudflare binds `ASSETS`), but chat needs `DEEPSEEK_API_KEY` and search needs `TAVILY_API_KEY`.
4. Deploy a preview (see above), check `/api/health` on it, and verify streaming, tool calls, and fallback.
5. Deploy to production (`pnpm exec cf build`, then `pnpm run deploy`) and check `/api/health` on `iguide.chat`.

**Rollback.** There's no second chat path to fall back to, so roll back the Worker itself. The quickest way points traffic back at an earlier uploaded version without rebuilding:

```bash
cd apps/web
pnpm exec cf workers versions list --worker-id uiuc
pnpm exec cf workers deployments create --worker uiuc --strategy percentage \
  --versions '[{"version_id":"<last good version id>","percentage":100}]'
```

If you need to rebuild instead, check out the last good commit and run `cf build` and `deploy` as above. That also redeploys that commit's `cloudflare.config.ts`.

## Community

Report bugs and request features in [GitHub Issues](https://github.com/IGUIDE-chat/iGuide/issues). Pull requests are welcome; run `pnpm run check` and the tests in [Development](#development) before opening one. AI-assisted PRs are welcome too, as long as the agent follows [AGENTS.md](AGENTS.md) (and [apps/web/AGENTS.md](apps/web/AGENTS.md) inside `apps/web`).

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="Contributors"></a>
