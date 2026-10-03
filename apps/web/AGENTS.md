# AGENTS.md

This file is the canonical short-form rule set for agents working in
`apps/web/`.

If this file and another project document disagree, follow this file first.

For repo-wide rules (secrets, CI, Worker retrieval, data model), see the root
[`AGENTS.md`](../../AGENTS.md).

## Scope

- This file applies to `apps/web/`.
- The active runtime entry is `src/index.tsx`.
- The only active app-composition file is `src/App.tsx`.
- `worker/index.ts` is a thin `export default { fetch }` that delegates to the
  Hono app `worker/app.ts` builds, so the SPA and the whole API surface share
  one origin.
- `worker/routes/index.ts` is the Worker's single URL table: the exact-path
  routes, the prefix routes, the dorm mount prefix, and the `API_ENDPOINTS`
  list the `/api/*` 404 is derived from. Add an endpoint there, not only in
  `app.ts`.
- Hono routes `/api/*` only, and never pages. Pages are served from static
  assets and routed in the browser by react-router 7.
- `worker/middleware/` holds the fallbacks: `apiNotFound.ts` is the JSON 404 for
  unknown `/api/*` paths, `spaFallback.ts` serves everything else from assets,
  and `dormApi.ts` lends `@iguide/dorm` its per-request Supabase client and
  identity resolver.
- The dorm endpoints are mounted from `@iguide/dorm` at `/api/dorms`.
  `packages/dorm` holds that worker-side dorm API and is bundled into this
  Worker's output: it is never deployed or built on its own. It also exports the
  shared dorm model and normalization helpers this app imports.
- `src/services/dormApi.ts` is the only door from this app to `/api/dorms`, and
  it is the only thing that adds the caller's bearer token. Every other dorm
  caller goes through it, including the bundled-dataset fallback and the
  guest-localStorage favorites.
- That Worker also hosts the agent runtime: the streaming tool-use loop
  (`worker/agent/`), its tool registry (`worker/tools/`), skills
  (`worker/skills/`), the MCP connection router (`worker/mcp/`), and Supabase
  token verification (`worker/auth.ts`).
- The Worker is configured in `cloudflare.config.ts` (`cf/config`). The SPA
  fallback is `assets.notFoundHandling: "single-page-application"`, and
  `assets.runWorkerFirst: ["/api/*"]` sends only API traffic through the Worker.
- `vite.config.ts` registers `@cloudflare/vite-plugin` for both `vp dev` and
  `vp build`, so dev boots the real Worker with `.dev.vars` secrets and serves
  `/api/*` through the production routing table.
- `vp build` and `cf build` produce the same output: the Worker bundle plus the
  SPA's static assets under `.cloudflare/output/`. There is no `dist/`.
  `cf deploy` uploads that output.
- `scripts/` holds the chat persona and memory SQL
  (`scripts/migrations/add_soul_and_memory.sql`) and the RLS fixes
  (`scripts/optimize_rls_policies.sql`, `scripts/fix_function_security.sql`).
  Dorm SQL stays in `packages/dorm/scripts/migrations/`, next to the dorm API
  it describes. The dorm data scripts are back here instead —
  `scripts/validate-dorm-data.ts`, `scripts/seed-dorms-table.ts` and
  `scripts/audit-dorm-media.ts` — because they read the SPA's bundled dataset
  under `src/components/housing/constants/dormData`. Two unused leftovers from
  the removed QMD knowledge base are also still here: `scripts/qmd-server.mjs`
  (the search server behind the old `/api/search` route) and
  `scripts/generate-handbook-ocr.py` (an OCR generator for QMD content).
  Nothing references them.

## Core Principles

1. Document the current runtime tree, not a target tree.
   If imports and builds still use the current structure, docs must describe the
   current structure.
2. Keep code local to the feature unless it is clearly shared.
   Default to local placement before promoting code into global folders.
3. Keep `src/pages/**` thin.
   Pages should handle route-level orchestration, not become feature owners.
4. Treat `src/components/<feature>/**` as the primary home for feature-specific
   UI.
5. Keep `src/components/layout/**` layout-only.
   Layout code can know about shell structure and navigation, but not feature
   business logic.
6. Keep `src/components/ui/**` business-agnostic.
   Do not move feature behavior, API logic, or domain-specific state there.
7. Promote code to `src/hooks/**`, `src/services/**`, `src/types/**`, or
   `src/utils/**` only when it is shared across unrelated features.
8. Use `src/constants/**`, `src/data/**`, and `src/i18n/**` for static data,
   content, and translations, not hidden business logic.
9. Do not call `src/features/**` the canonical structure until the runtime
   imports and build have actually moved there.
10. During migrations, do not mix half-finished file moves with unrelated
    feature work.

## Practical Placement Rules

- Server-side API routes belong in `worker/routes/<name>.ts`, exporting
  handlers typed as `RouteHandler` from `worker/types.ts`, and are registered in
  the `API_ROUTES` or `API_PREFIX_ROUTES` table in `worker/routes/index.ts`,
  which `worker/app.ts` mounts. Never put them under `src/`, which ships to the
  browser.
- Route-only composition belongs in `src/pages/**`.
- Feature-local UI belongs next to that feature under `src/components/**`.
- Shared layout belongs in `src/components/layout/**`.
- Shared dumb UI belongs in `src/components/ui/**`; primitives that a feature
  package also needs belong in `packages/ui` (`@iguide/ui`).
- Shared persistence and external integrations belong in `src/services/**`.
- The dorm (housing) React UI lives in this app, under
  `src/pages/dorms/**` and `src/components/housing/**`. The dorm API lives in
  `packages/dorm` and is mounted into this Worker at `/api/dorms`; the package
  is bundled here, never deployed on its own. Shell code (`App.tsx`,
  `src/components/layout/**`) must not import dorm components; a feature that
  needs shell space fills `useLayout().setSidebarSlot` or
  `setMobileHeaderSlot` from inside its own route.

## Verification

For structure-affecting changes:

1. Run `vp check` when TypeScript boundaries moved: it type-checks, lints, and
   formats in one pass (`vp check --fix` to apply fixes).
2. Run `vp build` for renamed imports, route changes, or moved modules.
3. Run the dorm data scripts above when changing dorm data contracts or media
   rules; `packages/dorm/AGENTS.md` has its own suite for the package.
4. Run the Worker and SPA suites from `apps/web` with
   `node --test "worker/**/*.test.ts" "src/**/*.test.ts"`. They are `node:test`
   files, and `vp test` (Vitest) cannot start in this app: the Cloudflare Vite
   plugin rejects Vitest's `ssr` environment. That run includes
   `src/services/__tests__/dormApi.contract.test.ts`, which drives the real
   `src/services/dormApi.ts` against the real Worker app from `worker/app.ts`
   and stubs only the network — change either side of `/api/dorms` and it is
   that test that says so.
5. `worker/agent/loop.test.ts` and `worker/agent/loop.baseline.test.ts` fail
   because they import a prompt `.txt` without the resolution hooks in
   `worker/test/utils/workerModules.ts` and die with
   `ERR_UNKNOWN_FILE_EXTENSION`. That pair is the known-failing set in this
   tree; any other failure is yours.

## Environment and secrets

- `.env.local.example` → `.env.local`: read by the Vite build and shipped to the
  browser. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
  `VITE_MAPBOX_TOKEN` are used from it. Git ignores the real file.
- `.dev.vars.example` → `.dev.vars`: Worker secrets for local `vp dev` runs.
  `Env` requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`. `/api/chat` also gives
  no answer without `DEEPSEEK_API_KEY`, and web search needs `TAVILY_API_KEY`.
  In production, set them from `apps/web/` with
  `vp exec cf workers secrets update <NAME> --worker uiuc`.
- Install the workspace once from the repo root with `vp install`.

## Database

Run the SQL by hand in the Supabase SQL editor, starting with the dorm chain in
[`packages/dorm/AGENTS.md`](../../packages/dorm/AGENTS.md#dorm-database).

The dorm SQL itself lives next to the API it describes, in
`packages/dorm/scripts/migrations/`, and `packages/dorm/AGENTS.md` owns its
order and its known conflicts. The data scripts live here, because they read
this app's bundled dataset under
`src/components/housing/constants/dormData.ts`:
`scripts/validate-dorm-data.ts`, `scripts/audit-dorm-media.ts`, and
`scripts/seed-dorms-table.ts`. Run all three from `apps/web/` with `vp dlx tsx`;
the seed takes both variables from the shell, not from env files:

```sh
vp dlx tsx scripts/validate-dorm-data.ts   # offline check of the bundled dataset
vp dlx tsx scripts/audit-dorm-media.ts     # sends HEAD requests to suspicious media URLs
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> vp dlx tsx scripts/seed-dorms-table.ts
```

`SUPABASE_SERVICE_KEY` bypasses RLS, which is why the seed needs it and the
Worker never does: the dorm API is mounted from `@iguide/dorm` at `/api/dorms`
and reads through an anon Supabase client with the caller's token forwarded, so
RLS stays the only authority and no service-role key exists in the Worker.

The tracked SQL does not create every table the app uses. Create `conversations`,
`messages`, `reading_history`, `user_profiles` and `mailing_list` yourself, then
run `scripts/migrations/add_soul_and_memory.sql`, which references
`conversations`. `scripts/optimize_rls_policies.sql` and
`scripts/fix_function_security.sql` assume some of those tables already exist.

## assistant-ui

This project uses assistant-ui for chat interfaces.

Documentation: https://www.assistant-ui.com/llms-full.txt

Key patterns:

- Use AssistantRuntimeProvider at the app root
- Thread component for full chat interface
- AssistantModal for floating chat widget
- useChatRuntime hook with AI SDK transport

## Chat Components

### General Chat (`src/components/chat/**` + `src/pages/chat/ChatPage.tsx`)

- Full-page general-purpose chat interface
- Uses assistant-ui runtime (ChatRuntimeProvider, ChatThread)
- Supports tool-use (SearchToolUI, WebSearchToolUI, GrepDocsToolUI)
- Conversation management with persistent IDs
- Route: `/chat`

### Housing Chat (`src/components/housing/AIChat.tsx`)

- Housing/dorm-specific floating chat widget
- Dorm mention detection and highlighting
- Shows dorm cards with navigation to dorm details
- Uses housing-specific i18n and this app's streamChatResponse, lent through
  `configureDormServices` in `src/pages/dorms/DormRoute.tsx`
- Embedded in DormDetailPage and DormListPage
- Domain-specific to housing module per Colocation Principle
