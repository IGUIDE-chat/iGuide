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
  RLS fixes `scripts/optimize_rls_policies.sql` and `scripts/fix_function_security.sql`. Two unused leftovers from the removed QMD knowledge base are also still here:
  `scripts/qmd-server.mjs` (the search server behind the old `/api/search` route) and
  `scripts/generate-handbook-ocr.py` (an OCR generator for QMD content). Nothing references them.

## Setup

Install the workspace once from the repo root with `pnpm install`. Then, in `apps/web/`, copy the two
env templates. Git ignores both real files.

- `.env.local.example` → `.env.local`: read by the Vite build and shipped to the browser. Only
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_MAPBOX_TOKEN` are used from it.
- `.dev.vars.example` → `.dev.vars`: Worker secrets for `pnpm run dev`. `Env` requires
  `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The template marks the rest optional, but `/api/chat` gives
  no answer without `DEEPSEEK_API_KEY`, and web search needs `TAVILY_API_KEY`. `GOOGLE_API_KEY` only
  feeds the `/api/gemini` proxy, which nothing calls. In production, set them from `apps/web/` with
  `pnpm exec cf workers secrets update <NAME> --worker uiuc`.

## Commands (from `apps/web/`)

| Command                   | What it does                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm run dev`            | `vp dev`: Vite with the Worker running behind it. Root equivalent: `pnpm run dev:web`.     |
| `pnpm run build`          | `vp build`: builds the SPA and the Worker.                                                 |
| `pnpm run deploy`         | `cf deploy --prebuilt`: deploys the existing build output without rebuilding; build first. |
| `pnpm run build:preview`  | `vp build --mode preview`. Run it with `CLOUDFLARE_PREVIEW_BUILD=true` (see below).        |
| `pnpm run deploy:preview` | `cf previews deploy --prebuilt`: deploys that preview build.                               |

`cf previews deploy --prebuilt` only accepts Build Output flagged as a Preview build, and the build
sets that flag only when `CLOUDFLARE_PREVIEW_BUILD=true` is in the environment. Without it the deploy
stops with "Build Output was not created by a Preview build". So run
`CLOUDFLARE_PREVIEW_BUILD=true pnpm run build:preview` (in PowerShell, set
`$env:CLOUDFLARE_PREVIEW_BUILD = "true"` first), or use `pnpm exec cf previews deploy` without
`--prebuilt`, which builds with the flag set and deploys in one step.

Lint with `pnpm run lint` and check formatting with `pnpm exec vp fmt --check` (the `fmt` script
rewrites files). From the repo root, `pnpm exec vp check` runs format, lint and type checks
(`pnpm run check` does the same and applies fixes).

## Database

Run the SQL by hand in the Supabase SQL editor. Dorm tables, storage and seed data are set up from
[`packages/dorm`](../../packages/dorm/README.md#dorm-database); run that chain first.

The tracked SQL does not create every table the app uses. Create `conversations`, `messages`,
`reading_history`, `user_profiles` and `mailing_list` yourself. Then run
`scripts/migrations/add_soul_and_memory.sql`, which references `conversations`.
`scripts/optimize_rls_policies.sql` and `scripts/fix_function_security.sql` assume some of those
tables already exist.
