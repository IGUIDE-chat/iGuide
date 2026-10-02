# @iguide/web

English | [中文](README_CN.md)

The IlliniGuide (iGuide) web app, live at <https://iguide.chat>: a React SPA plus one Cloudflare
Worker that serves it and handles every `/api/*` route on the same origin. For the product and the
overall architecture, see the root [README](../../README.md). For where code belongs, see
[AGENTS.md](AGENTS.md) (package rules) and the root [AGENTS.md](../../AGENTS.md) (repo-wide rules).

## What lives here

- `src/`: the React SPA. Entry `src/index.tsx`, composition `src/App.tsx`, routes `src/app/routes.tsx`.
- `worker/`: the Worker, entry `worker/index.ts`, configured in `cloudflare.config.ts`. It serves
  `/api/chat` (the tool-use agent; Tavily web search is its only retrieval source), the provider
  proxies, `/api/health` and `/api/integrations*`.
- `src/pages/dorms/DormRoute.tsx`: the only file that touches the dorm feature. The feature itself
  (UI, state, dorm SQL, data scripts) lives in [`packages/dorm`](../../packages/dorm) and is
  lazy-loaded at `/dorms/*`.
- `scripts/`: the chat persona and memory SQL (`scripts/migrations/add_soul_and_memory.sql`) and the
  RLS fixes `scripts/optimize_rls_policies.sql` and `scripts/fix_function_security.sql`. Two unused
  leftovers from the removed QMD knowledge base are also still here:
  `scripts/qmd-server.mjs` (the search server behind the old `/api/search` route) and
  `scripts/generate-handbook-ocr.py` (an OCR generator for QMD content). Nothing references them.

## Setup

Install the workspace once from the repo root with `vp install`. Then, in `apps/web/`, copy the two
env templates. Git ignores both real files.

- `.env.local.example` → `.env.local`: read by the Vite build and shipped to the browser. Only
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_MAPBOX_TOKEN` are used from it.
- `.dev.vars.example` → `.dev.vars`: Worker secrets for `vp dev`. `Env` requires
  `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The template marks the rest optional, but `/api/chat` gives
  no answer without `DEEPSEEK_API_KEY`, and web search needs `TAVILY_API_KEY`. `GOOGLE_API_KEY` only
  feeds the `/api/gemini` proxy, which nothing calls. In production, set them from `apps/web/` with
  `vp exec cf workers secrets update <NAME> --worker uiuc`.

## Commands (from `apps/web/`)

| Command                                 | What it does                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `vp dev`                                | Vite with the Worker running behind it. The same command works from the repo root. |
| `vp build`                              | Builds the SPA and the Worker.                                                     |
| `vp exec cf deploy --prebuilt`          | Deploys the existing build output without rebuilding; build first.                 |
| `vp build --mode preview`               | Preview build. Run it with `CLOUDFLARE_PREVIEW_BUILD=true` (see below).            |
| `vp exec cf previews deploy --prebuilt` | Deploys that preview build.                                                        |

`cf previews deploy --prebuilt` only accepts Build Output flagged as a Preview build, and the build
sets that flag only when `CLOUDFLARE_PREVIEW_BUILD=true` is in the environment. Without it the deploy
stops with "Build Output was not created by a Preview build". So run
`CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview` (in PowerShell, set
`$env:CLOUDFLARE_PREVIEW_BUILD = "true"` first), or use `vp exec cf previews deploy` without
`--prebuilt`, which builds with the flag set and deploys in one step.

Lint with `vp lint` and check formatting with `vp fmt --check` (`vp fmt` rewrites files). From the repo
root, `vp check` runs format, lint and type checks (`vp check --fix` applies fixes).

## Database

Run the SQL by hand in the Supabase SQL editor. Dorm tables, storage and seed data are set up from
[`packages/dorm`](../../packages/dorm/README.md#dorm-database); run that chain first.

The tracked SQL does not create every table the app uses. Create `conversations`, `messages`,
`reading_history`, `user_profiles` and `mailing_list` yourself. Then run
`scripts/migrations/add_soul_and_memory.sql`, which references `conversations`.
`scripts/optimize_rls_policies.sql` and `scripts/fix_function_security.sql` assume some of those
tables already exist.
