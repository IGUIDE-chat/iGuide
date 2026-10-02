# @iguide/web

English | [中文](README_CN.md)

The IlliniGuide (iGuide) web app, live at <https://iguide.chat>: a React SPA plus one Cloudflare
Worker that serves it and handles every `/api/*` route on the same origin. For the product and the
overall architecture, see the root [README](../../README.md). For where code belongs, see
[AGENTS.md](AGENTS.md) (package rules) and the root [AGENTS.md](../../AGENTS.md) (repo-wide rules).

## What lives here

- `src/`: the React SPA. Entry `src/index.tsx`, composition `src/App.tsx`, routes `src/app/routes.tsx`.
- `worker/`: the Worker, entry `worker/index.ts`, configured in `cloudflare.config.ts`. It serves
  `/api/chat` (the tool-use agent; Tavily web search is its only retrieval source), `/api/health`
  and `/api/integrations*`.
- `src/pages/dorms/DormRoute.tsx`: the only file that touches the dorm feature, which lives in
  [`packages/dorm`](../../packages/dorm) and is lazy-loaded at `/dorms/*`.
- `scripts/`: the chat persona and memory SQL and the RLS fixes.

[AGENTS.md](AGENTS.md) owns where code belongs, which env variables matter, and the database setup.
Dorm SQL and seed scripts are in [`packages/dorm/AGENTS.md`](../../packages/dorm/AGENTS.md).

## Setup

Install the workspace once from the repo root with `vp install`, then copy the two env templates in
`apps/web/`; Git ignores both real files. [AGENTS.md](AGENTS.md#environment-and-secrets) says which
variables each one needs.

## Commands (from `apps/web/`)

| Command                                 | What it does                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `vp dev`                                | Vite with the Worker running behind it. The same command works from the repo root. |
| `vp build`                              | Builds the SPA and the Worker.                                                     |
| `vp exec cf deploy --prebuilt`          | Deploys the existing build output without rebuilding; build first.                 |
| `vp build --mode preview`               | Preview build. Run it with `CLOUDFLARE_PREVIEW_BUILD=true` (see below).            |
| `vp exec cf previews deploy --prebuilt` | Deploys that preview build.                                                        |

`cf previews deploy --prebuilt` only accepts Build Output flagged as a Preview build, so run
`CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview` first, or use `vp exec cf previews deploy`
without `--prebuilt`, which builds with the flag set and deploys in one step ([details](https://developers.cloudflare.com/workers/configuration/previews/)).

Lint with `vp lint` and check formatting with `vp fmt --check` (`vp fmt` rewrites files). From the repo
root, `vp check` runs format, lint and type checks (`vp check --fix` applies fixes).
