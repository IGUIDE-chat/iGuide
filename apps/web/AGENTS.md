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
- Shared dumb UI belongs in `src/components/ui/**`; primitives that a feature
  package also needs belong in `packages/ui` (`@iguide/ui`).
- Shared persistence and external integrations belong in `src/services/**`.
- Dorm (housing) code belongs in `packages/dorm`, not `src/`. This app reaches
  it only through `src/pages/dorms/DormRoute.tsx`, which imports from
  `@iguide/dorm` and never from the package's internal paths. Shell code
  (`App.tsx`, `src/components/layout/**`) must not import dorm code; a feature
  that needs shell space fills `useLayout().setSidebarSlot` or
  `setMobileHeaderSlot` from inside its own route.

## Verification

For structure-affecting changes:

1. Run `vp check` when TypeScript boundaries moved: it type-checks, lints, and
   formats in one pass (`vp check --fix` to apply fixes).
2. Run `vp build` for renamed imports, route changes, or moved modules.
3. Run `vp dlx tsx scripts/validate-dorm-data.ts` from `packages/dorm/` when
   changing dorm data contracts.
4. Run `vp dlx tsx scripts/audit-dorm-media.ts` from `packages/dorm/` when
   changing dorm media sourcing or media validation.
5. Run the Worker and SPA suites from `apps/web` with
   `node --test "worker/**/*.test.ts" "src/**/*.test.ts"`. They are `node:test`
   files, and `vp test` (Vitest) cannot start in this app: the Cloudflare Vite
   plugin rejects Vitest's `ssr` environment.

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

### Housing Chat (`packages/dorm/src/components/housing/AIChat.tsx`)

- Housing/dorm-specific floating chat widget
- Dorm mention detection and highlighting
- Shows dorm cards with navigation to dorm details
- Uses housing-specific i18n and this app's streamChatResponse, lent through
  `configureDormServices` in `src/pages/dorms/DormRoute.tsx`
- Embedded in DormDetailPage and DormListPage
- Domain-specific to housing module per Colocation Principle
