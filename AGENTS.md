# IlliniGuide agent guide

These rules apply repository-wide. `apps/web/AGENTS.md` takes precedence within
`apps/web/**`.

## Project

A UIUC knowledge platform with a React 19 frontend and Cloudflare Worker gateway.
Supabase provides auth and Postgres; DeepSeek handles inference and Tavily
supplies web search.

| Path            | Role                                                                     |
| :-------------- | :----------------------------------------------------------------------- |
| `apps/web/`     | Frontend and Worker: SPA, static assets, agent loop, tools, skills, MCP. |
| `dorm_scripts/` | Standalone Puppeteer/Bun review scrapers.                                |

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
pnpm run dev:web              # SPA and Worker together, including /api/*
curl http://localhost:5173/api/health

pnpm run check                # format, lint, and typecheck with fixes
pnpm run lint
pnpm run typecheck
pnpm run test                 # package test scripts
pnpm run build

vp run --filter @iguide/web test
```

Run checks and relevant package scripts before delivery. CI requires lint,
typecheck, tests, build, and source/bundle secret scans to pass.

## Secrets

- Treat `VITE_` variables and Vite `define` values as public browser data.
- Keep server keys in `apps/web/.env.local` with unprefixed names or in Worker
  secrets (`cf workers secrets update <name>`).
- Preserve the CI-required web Worker router (`apps/web/worker/index.ts`) and
  proxy routes (`worker/routes/deepseek.ts`, `tavily.ts`, `gemini.ts`).
- For dev-proxy debugging, set `LLM_REQUEST_DUMP=1`; redacted dumps go to
  `apps/web/.debug/llm-requests/`.

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
  receive `select`; writes use the service key.
- Apply the dorm chain in `apps/web/scripts/migrations/`, starting with
  `create_dorms_table.sql`, then `add_categorized_tags.sql`, then follow-ups.

## Deploy

One Worker serves the SPA and every `/api/*` route, so it is the only thing to
deploy. It uses `cloudflare.config.ts` and the `cf` CLI; check `cf --help` for
syntax. Worker vars live in `apps/web/cloudflare.config.ts`; the `Env` interface
in `apps/web/worker/types.ts` defines required configuration. For local runs,
copy `apps/web/.dev.vars.example` to `.dev.vars` and fill the values `Env` requires.

```bash
vp run --filter @iguide/web deploy
```

`/api/chat` is the only chat path: it runs the Worker's tool-use agent and
streams SSE. Verify `/api/health`, SSE, and tool calls in staging before
production.
