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
- `worker/index.ts` is the Worker entrypoint. It routes `/api/*` to
  `worker/routes/**` and serves everything else from static assets, so the SPA
  and the whole API surface share one origin.
- That Worker also hosts the agent runtime: the streaming tool-use loop
  (`worker/agent/`), its tool registry (`worker/tools/`), skills
  (`worker/skills/`), the MCP connection router (`worker/mcp/`), and the
  Supabase/embedding helpers (`worker/lib/`).
- The Worker is configured in `cloudflare.config.ts` (`cf/config`). The SPA
  fallback is `assets.notFoundHandling: "single-page-application"`, and
  `assets.runWorkerFirst: ["/api/*"]` sends only API traffic through the Worker.
- `vite.config.ts` registers `@cloudflare/vite-plugin` for `vite build` only, so
  `vp dev` keeps using the Vite proxy for `/api/*` against `.env.local` secrets.
- Two build outputs exist on purpose. `vp build` produces the SPA in `dist/`
  (what CI's bundle scan reads); `cf build` produces the Worker plus its
  static assets under `.cloudflare/output/`. `cf deploy` runs the latter.
- `scripts/` holds the dorm database SQL (`scripts/migrations/*.sql`,
  `scripts/*.sql`) and the dorm data scripts. Two unused leftovers from the
  removed QMD knowledge base are also still here: `scripts/qmd-server.mjs` (the
  search server behind the old `/api/search` route) and
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

- Server-side proxy routes belong in `worker/routes/<name>.ts`, exporting
  `onRequestPost` / `onRequestOptions` typed as `RouteHandler` from
  `worker/types.ts`. Never put them under `src/` — CI's secret scan greps
  `src/**` and rejects `VITE_*API_KEY` patterns there.
- Route-only composition belongs in `src/pages/**`.
- Feature-local UI belongs next to that feature under `src/components/**`.
- Shared layout belongs in `src/components/layout/**`.
- Shared dumb UI belongs in `src/components/ui/**`.
- Shared persistence and external integrations belong in `src/services/**`.

## Verification

For structure-affecting changes:

1. Run `vp check` when TypeScript boundaries moved: it type-checks, lints, and
   formats in one pass (`vp check --fix` to apply fixes).
2. Run `vp build` for renamed imports, route changes, or moved modules.
3. Run `vp dlx tsx scripts/validate-dorm-data.ts` when changing dorm data
   contracts.
4. Run `vp dlx tsx scripts/audit-dorm-media.ts` when changing dorm media
   sourcing or media validation.
5. Run the Worker and SPA suites from `apps/web` with
   `node --test "worker/**/*.test.ts" "src/**/*.test.ts"`. They are `node:test`
   files, and `vp test` (Vitest) cannot start in this app: the Cloudflare Vite
   plugin rejects Vitest's `ssr` environment.

## Environment and secrets

- `.env.local.example` → `.env.local`: read by the Vite build and shipped to the
  browser. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
  `VITE_MAPBOX_TOKEN` are used from it. Git ignores the real file.
- `.dev.vars.example` → `.dev.vars`: Worker secrets for local `vp dev` runs.
  `Env` requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The template marks the
  rest optional, but `/api/chat` gives no answer without `DEEPSEEK_API_KEY`, and
  web search needs `TAVILY_API_KEY`. `GOOGLE_API_KEY` only feeds the
  `/api/gemini` proxy, which nothing calls. In production, set them from
  `apps/web/` with `vp exec cf workers secrets update <NAME> --worker uiuc`.
- Install the workspace once from the repo root with `vp install`.

## Dorm database

Run the SQL by hand in the Supabase SQL editor. Core dorm schema, in this order:

1. `scripts/migrations/create_dorms_table.sql`. On a fresh project, delete its
   last line first: it comments on a `dorm_overrides` table that no tracked SQL
   creates, and the SQL editor then rolls back the whole file.
2. `scripts/migrations/add_categorized_tags.sql` (safe to rerun)
3. `scripts/migrations/add_dorm_address.sql` and
   `scripts/migrations/add_dorm_website.sql`, which add the `address`,
   `address_zh` and `website` columns the seed writes

Feature SQL, after the core schema:

- `scripts/migrations/create_storage_bucket.sql`: the `dorm-images` storage bucket.
- `add_dorm_edit_history.sql`, then `fix_dorm_edit_history_rls.sql`;
  `add_dorm_comments.sql`, then `add_dorm_comment_hidden.sql`;
  `add_floor_plan_bed_size.sql`; `add_soul_and_memory.sql` (all in
  `scripts/migrations/`).
- `scripts/create_dorm_user_features.sql`: dorm favorites and viewing history.
- `scripts/migrations/add_message_sources.sql`: `messages.sources`, the web
  pages each chat reply cited. Until it runs, replies are saved without them.

The tracked SQL does not create every table the app uses. Create `conversations`
(referenced by `add_soul_and_memory.sql`), `messages`, `reading_history`,
`user_profiles` and `mailing_list` yourself. `scripts/optimize_rls_policies.sql`
and `scripts/fix_function_security.sql` assume some of them already exist.

Known conflict: `add_categorized_tags.sql` limits `bathroom_type` to `communal`,
`semi-private` and `private`, but the seed writes `individual-use` for four
dorms, and one rejected row fails the whole upsert. Widen the constraint before
seeding:

```sql
ALTER TABLE public.dorms DROP CONSTRAINT chk_bathroom_type;
ALTER TABLE public.dorms ADD CONSTRAINT chk_bathroom_type
  CHECK (bathroom_type IN ('communal', 'individual-use', 'semi-private', 'private'));
```

## Dorm data scripts

`tsx` is not a dependency, so run the scripts with `vp dlx tsx`, from `apps/web/`:

```sh
vp dlx tsx scripts/validate-dorm-data.ts   # offline check of the bundled dataset
vp dlx tsx scripts/audit-dorm-media.ts     # sends HEAD requests to suspicious media URLs
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> vp dlx tsx scripts/seed-dorms-table.ts
```

The seed reads both variables from the shell, not from env files (in PowerShell,
set them first with `$env:NAME = "..."`). `SUPABASE_SERVICE_KEY` is a
service-role key that bypasses RLS. The seed upserts the bundled `UIUC_DORMS` into
`dorms` by `id`. It keeps stored images, gallery and floor-plan media, merges
tags with stored ones, and never deletes rows. It does not read the archived
`dorm_overrides`.

## shadcn/ui and AI Elements

UI primitives come from [shadcn/ui](https://ui.shadcn.com) and chat building
blocks from [AI Elements](https://ai-sdk.dev/elements), both copied into the
repo by the shadcn CLI (`components.json`):

- `src/components/ui/` holds shadcn primitives next to the app's own generic
  UI. `src/components/ai-elements/` holds AI Elements components.
- Add components with `npx shadcn@latest add <name>` or
  `npx shadcn@latest add @ai-elements/<name>` from `apps/web`. The CLI may
  write `import { cn } from "cn"`; the helper lives at `@/utils/cn`.
- Copied files are ours to edit; mark local changes with a comment so a later
  `add --overwrite` does not silently drop them.
- Theme tokens (`--background`, `--primary`, ...) are defined in
  `src/index.css` and mapped onto the slate + Illini palette. The app is
  light-only; `dark:` utilities only apply under a `.dark` ancestor.

## Chat Components

### General Chat (`src/components/chat/**` + `src/pages/chat/ChatPage.tsx`)

- Full-page general-purpose chat interface (`ChatThread`), state in
  `useChatSession`, scrolling in `useTopAnchoredScroll`
- Replies show the agent's thinking steps until the answer starts, then the
  web pages it read (`source-url` SSE events) as a sources pill and numbered
  citations
- Conversation management with persistent IDs
- Route: `/chat`

### Housing Chat (`src/components/housing/AIChat.tsx`)

- Housing/dorm-specific floating chat widget
- Dorm mention detection and highlighting
- Shows dorm cards with navigation to dorm details
- Uses housing-specific i18n and streamChatResponse
- Embedded in DormDetailPage and DormListPage
- Domain-specific to housing module per Colocation Principle
