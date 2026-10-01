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
  `worker/routes/**` and serves everything else from static assets.
- The Worker is configured in `cloudflare.config.ts` (`cf/config`). The SPA
  fallback is `assets.notFoundHandling: "single-page-application"`.
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
- Shared dumb UI belongs in `src/components/ui/**`.
- Shared persistence and external integrations belong in `src/services/**`.

## Verification

For structure-affecting changes:

1. Run `npm run typecheck` when TypeScript boundaries moved.
2. Run `npm run build` for renamed imports, route changes, or moved modules.
3. Run `npm run validate:dorm-data` when changing dorm data contracts.
4. Run `npm run audit:dorm-media` when changing dorm media sourcing or media
   validation.
5. Only require `npm run verify:architecture` if the script exists in
   `package.json`.

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
- Uses housing-specific i18n and streamChatResponse
- Embedded in DormDetailPage and DormListPage
- Domain-specific to housing module per Colocation Principle
