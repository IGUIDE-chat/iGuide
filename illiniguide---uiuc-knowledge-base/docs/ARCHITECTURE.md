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
- Page-local hooks are allowed when they are route-specific.
- Example: `src/pages/chat/ChatPage.tsx` and `src/pages/chat/useChatSession.ts`.

5. Feature / Component Layer
- `src/components/**`
- Owns reusable UI and feature presentation.
- Should not become the route owner for persistence-heavy flows.
- Example: `src/components/chat/ChatScreen.tsx` is presentation, while
  conversation loading and sending live in the page layer.

6. Shared Layout Layer
- `src/components/layout/**`
- Owns app shell, nav, sidebar, and layout-only composition.
- Must not absorb dorm-specific or chat-specific domain logic.

7. Shared UI Layer
- `src/components/ui/**`
- Owns business-agnostic dumb UI, icons, and presentational wrappers.
- Must not own feature-specific API calls or context-dependent behavior.

8. Feature Submodule Layer
- `src/components/housing/constants/**`
- `src/components/housing/dorm-list/**`
- `src/components/housing/dorm-detail/**`
- `src/components/housing/dorm-map/**`
- `src/components/housing/edit-panel/**`
- `src/components/housing/filter-modal/**`
- `src/components/housing/hooks/**`
- `src/components/housing/store/**`
- `src/components/housing/types/**`
- Use these folders for feature-local shells, tabs, sections, and controllers.

9. Shared Hook Layer
- `src/hooks/**`
- Only for hooks reused across pages or features.

10. Data / Config Layer
- `src/constants/**`
- `src/i18n/**`
- `src/data/**`
- Static config, text, and source data only.

11. Service Layer
- `src/services/**`
- API, database, storage, and persistence integration.

12. Legacy Isolation Layer
- `src/legacy/**`
- Stores unused reference code only.
- Active runtime modules must not import from legacy paths.

## Current Structure Implications

- `src/App.tsx` is the only active app-composition file.
- `src/pages/**` should own orchestration before `src/components/**`.
- Shared branding and generic typewriter UI belong under `src/components/ui/**`.
- Layout decomposition belongs under `src/components/layout/**`.
- Large feature files should be decomposed into subfolders before they become
  page-orchestration bottlenecks.

Recent examples now aligned with this rule:

- Chat orchestration lives in `src/pages/chat/useChatSession.ts`.
- Chat presentation lives in `src/components/chat/**`.
- Layout composition lives in `src/components/layout/**`.
- Shared branding and generic UI live in `src/components/ui/**`.
- Dorm admin edit-panel decomposition lives in
  `src/components/housing/edit-panel/**`.
- Dorm list controller, map, and favorite animation logic live in
  `src/components/housing/dorm-list/**`.

## Legacy Policy

This package keeps isolated unused reference code under `src/legacy/**`.

Reserved legacy paths:

- `src/legacy/**`
- `src/components/housing/legacy/**`
- `legacy/projects/**`

Active modules must not import from those paths.

## Checks

- `npm run typecheck` validates module boundaries after refactors.
- `npm run build` validates runtime bundling after structural moves.
- `rg "src/legacy/" src` should only match legacy files or documentation,
  never active runtime imports.

---

## Quick Summary

1. `src/pages/**` owns page orchestration.
2. `src/components/**` owns presentation and feature-local composition.
3. `src/components/layout/**` is the layout-only boundary.
4. `src/components/ui/**` is the business-agnostic shared UI boundary.
5. Housing submodules stay under `src/components/housing/**`.
6. Legacy code must stay inside a reserved legacy path.
