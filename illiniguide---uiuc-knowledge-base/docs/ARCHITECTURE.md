# Architecture Boundaries

## Layers

1. Entry Layer
- `src/index.tsx`
- Mounts providers and router entry only.

2. App Composition Layer
- `src/App.tsx`
- Owns top-level app composition and provider wiring.
- There must be only one active app-composition file in this package.

3. Route Layer
- `src/app/routes.tsx`
- Declares routes only.
- No feature business logic should live here.

4. Page Layer
- `src/pages/**`
- Owns route-level orchestration.
- Page-local hooks are allowed here when they are route-specific.
- Example: `src/pages/chat/ChatPage.tsx` and `src/pages/chat/useChatSession.ts`.

5. Feature / Component Layer
- `src/components/**`
- Owns reusable UI and feature presentation.
- Should not become the route owner for persistence-heavy flows.
- Example: `src/components/ChatScreen.tsx` is presentation, while conversation
  loading/sending now lives in the page layer.

6. Shared Layout Layer
- `src/components/layout/**`
- Owns app shell, nav, sidebar, and layout-only composition.
- Must not absorb dorm-specific or chat-specific domain logic.

7. Feature Submodule Layer
- `src/components/housing/dorm-list/**`
- `src/components/housing/dorm-detail/**`
- `src/components/housing/dorm-map/**`
- `src/components/housing/edit-panel/**`
- `src/components/housing/filter-modal/**`
- Use these folders for feature-local shells, tabs, sections, and controllers.

8. Shared Hook Layer
- `src/hooks/**`
- Only for hooks reused across pages or features.
- Example: `src/hooks/useDormFilterBadge.ts`.

9. Data / Config Layer
- `src/constants/**`
- `src/i18n/**`
- `src/data/**`
- Static config, text, and source data only.

10. Service Layer
- `src/services/**`
- API, database, storage, and persistence integration.

## Current Structure Implications

- `src/components/App.tsx` is no longer part of the active runtime structure.
- `src/pages/**` should own orchestration before `src/components/**`.
- Large feature files should be decomposed into subfolders before they become
  page-orchestration bottlenecks.

Recent examples now aligned with this rule:

- Chat orchestration moved to `src/pages/chat/useChatSession.ts`.
- Layout decomposition lives under `src/components/layout/**`.
- Dorm admin edit panel decomposition lives under
  `src/components/housing/edit-panel/**`.
- Dorm list controller/map/favorite animation logic lives under
  `src/components/housing/dorm-list/**`.

## Legacy Policy

This package currently has no active legacy directories checked into the runtime tree.

If legacy code is reintroduced, it must live under one of these reserved paths:

- `src/legacy/**`
- `src/components/housing/legacy/**`
- `legacy/projects/**`

Active modules must not import from those paths.

## Enforced Checks

- `npm run verify:architecture` checks:
  - no active imports from reserved legacy boundaries
  - route and page registry parity
  - single active app/auth source
  - only one active root Vite config

- `npm run typecheck` validates module boundaries after refactors.
- `npm run build` validates runtime bundling after structural moves.

---

## Quick Summary

1. `src/pages/**` owns page orchestration.
2. `src/components/**` owns presentation and feature-local composition.
3. `src/components/layout/**` is the layout-only boundary.
4. `src/components/housing/edit-panel/**` and
   `src/components/housing/dorm-list/**` are the current housing submodule boundaries.
5. If legacy code returns later, it must move into a reserved legacy path.
