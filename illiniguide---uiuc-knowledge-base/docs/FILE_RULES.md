# Project File Organization Rules

This document is the canonical structure contract for
`illiniguide---uiuc-knowledge-base/`.

It must stay aligned with:

- `Ask/illiniguide---uiuc-knowledge-base/README.md`
- `Ask/illiniguide---uiuc-knowledge-base/docs/ARCHITECTURE.md`

---

## 1) Repository-Level Scope

At repository root (`Ask/`), the business-facing directories are:

- `api-gateway/`
- `backend/`
- `data_collection/`
- `illiniguide---uiuc-knowledge-base/`
- `qa/`

Do not expand hidden tooling folders such as `.agent/`, `.claude/`, or `.gemini/`
inside business structure documentation.

---

## 2) Main Application Structure

Canonical active structure for `illiniguide---uiuc-knowledge-base/`:

```text
illiniguide---uiuc-knowledge-base/
|-- docs/
|   `-- diagrams/
|-- functions/
|   `-- api/
|-- public/
|-- scripts/
|   `-- migrations/
|-- src/
|   |-- app/
|   |-- components/
|   |   |-- chat/
|   |   |-- housing/
|   |   |   |-- dorm-detail/
|   |   |   |   `-- sections/
|   |   |   |-- dorm-list/
|   |   |   |-- dorm-map/
|   |   |   |-- edit-panel/
|   |   |   |-- filter-modal/
|   |   |   `-- i18n/
|   |   `-- layout/
|   |-- constants/
|   |   `-- housing/
|   |-- contexts/
|   |-- data/
|   |   `-- articles/
|   |-- hooks/
|   |-- i18n/
|   |-- pages/
|   |   |-- chat/
|   |   |-- courses/
|   |   |-- dorms/
|   |   |-- library/
|   |   |-- profile/
|   |   `-- resume/
|   |-- scripts/
|   |-- services/
|   |-- types/
|   `-- utils/
`-- tests/
```

Notes:

- `src/App.tsx` is the only active app-composition file.
- `src/components/App.tsx` is no longer part of the active structure.
- This package currently has no mounted legacy directories. If legacy code is
  reintroduced, it must live under an explicit legacy boundary.

---

## 3) Directory Contract

| Path | Responsibility | Runtime Critical | State |
| :--- | :--- | :--- | :--- |
| `docs/` | Project docs, setup specs, architecture notes. | No | Active |
| `functions/api/` | Cloudflare Pages API handlers. | Yes | Active |
| `public/` | Static assets served directly by Vite. | Yes | Active |
| `scripts/` | Repo-level maintenance and data scripts. | No | Active |
| `scripts/migrations/` | Manual SQL migrations and database setup scripts. | Yes | Active |
| `src/app/` | Route declarations and page registry wiring. | Yes | Active |
| `src/components/` | Shared and feature-presentational UI components. | Yes | Active |
| `src/components/chat/` | Chat UI subcomponents only. No conversation persistence logic. | Yes | Active |
| `src/components/layout/` | App shell, nav, sidebar, and layout-only subcomponents. | Yes | Active |
| `src/components/housing/` | Housing feature UI composition. | Yes | Active |
| `src/components/housing/dorm-detail/` | Dorm detail feature sections. | Yes | Active |
| `src/components/housing/dorm-list/` | Dorm list feature subcomponents and controllers. | Yes | Active |
| `src/components/housing/dorm-map/` | Map builders, layers, and map-specific helpers. | Yes | Active |
| `src/components/housing/edit-panel/` | Dorm admin edit panel shell, tabs, and form orchestration. | Yes | Active |
| `src/components/housing/filter-modal/` | Dorm filter modal sections and helpers. | Yes | Active |
| `src/constants/` | Shared constants and static definitions. | Yes | Active |
| `src/constants/housing/` | Housing constants and source datasets. | Yes | Active |
| `src/contexts/` | React context providers and shared app state boundaries. | Yes | Active |
| `src/data/articles/` | Library article source files. | Yes | Active |
| `src/hooks/` | Shared hooks reused across routes/features. | Yes | Active |
| `src/i18n/` | Global i18n texts and language config. | Yes | Active |
| `src/pages/` | Route-level page orchestration. | Yes | Active |
| `src/pages/chat/` | Chat route entry and page-local orchestration hooks. | Yes | Active |
| `src/pages/dorms/` | Dorm route entry pages. | Yes | Active |
| `src/scripts/` | In-app helper scripts used by frontend workflows. | No | Active |
| `src/services/` | API, persistence, and integration layer. | Yes | Active |
| `src/types/` | Shared TypeScript types and interfaces. | Yes | Active |
| `src/utils/` | Pure helpers and transformation utilities. | No | Active |
| `tests/` | Test scripts and verification artifacts. | No | Active |

Reserved legacy boundaries, only if needed later:

- `src/legacy/**`
- `src/components/housing/legacy/**`
- `legacy/projects/**`

---

## 4) Architecture Contracts

1. Route source of truth
   Define route declarations in `src/app/routes.tsx`.

2. Page registry source of truth
   Register route/page metadata in `src/app/pageRegistry.ts`.

3. Page-level orchestration belongs in `src/pages/**`
   Page files and page-local hooks may own data loading, persistence flows,
   and feature orchestration.

4. `src/components/**` stays presentation-first
   Components may compose UI and localized feature behavior, but persistence
   flows and route ownership should stay above them.

5. Legacy boundary
   Active runtime code must not import from reserved legacy paths.

---

## 5) Structure Doc Exclusions

Do not include generated or dependency directories in structure trees:

- `node_modules/`
- `dist/`
- `__pycache__/`

---

## 6) Verification Checklist

For structure changes:

1. Run `npm run verify:architecture` if the change affects routing or structure rules.
2. Run `npm run typecheck`.
3. Run `npm run build` for component/module reorganizations.
4. Update these docs together:
   - `Ask/illiniguide---uiuc-knowledge-base/README.md`
   - `Ask/illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md`
   - `Ask/illiniguide---uiuc-knowledge-base/docs/ARCHITECTURE.md`

---

## Quick Summary

- The active structure now includes `src/components/chat/`,
  `src/components/layout/`, `src/components/housing/edit-panel/`, and
  `src/components/housing/dorm-list/`.
- `src/App.tsx` is the only active app-composition entry.
- `src/components/App.tsx` is no longer part of the active structure.
- Any future legacy code must move into an explicit reserved legacy boundary.
