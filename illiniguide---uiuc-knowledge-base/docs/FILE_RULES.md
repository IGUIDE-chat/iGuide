# Project File Organization Rules

This document defines the canonical folder structure for IlliniGuide and keeps the
same structure contract as:

- `Ask/README.md`
- `Ask/illiniguide---uiuc-knowledge-base/README.md`

---

## 1) Repository-Level Scope (Business Directories)

At repository root (`Ask/`), business-facing directories are:

- `api-gateway/`
- `backend/`
- `data_collection/`
- `illiniguide---uiuc-knowledge-base/`
- `qa/`

Do not document or expand tooling-only hidden folders here (for example `.agent/`,
`.claude/`, `.gemini/`) in business structure sections.

---

## 2) Main Application Structure (`illiniguide---uiuc-knowledge-base/`)

Canonical active structure:

```text
illiniguide---uiuc-knowledge-base/
|-- docs/
|   `-- diagrams/
|-- functions/
|   `-- api/
|-- legacy/
|   `-- projects/
|       `-- illiniguide---housing-selection/   [Legacy - Not Mounted]
|-- scripts/
|-- src/
|   |-- app/
|   |-- components/
|   |   `-- housing/
|   |       |-- dorm-detail/
|   |       |   `-- sections/
|   |       |-- dorm-list/
|   |       |-- dorm-map/
|   |       |-- filter-modal/
|   |       |-- i18n/
|   |       `-- legacy/                        [Legacy - Not Mounted]
|   |-- config/
|   |-- constants/
|   |   `-- housing/
|   |-- contexts/
|   |-- data/
|   |   `-- articles/
|   |-- hooks/
|   |-- i18n/
|   |-- legacy/
|   |   |-- components/
|   |   |-- config/
|   |   `-- contexts/
|   |-- pages/
|   |   |-- chat/
|   |   |-- courses/
|   |   |-- dorms/
|   |   |-- library/
|   |   |-- profile/
|   |   `-- resume/
|   |-- services/
|   |-- types/
|   `-- utils/
|-- supabase-migrations/
`-- tests/
```

---

## 3) Directory Contract (Responsibilities)

| Path | Responsibility | Runtime Critical | State |
| :--- | :--- | :--- | :--- |
| `docs/` | Project docs and setup specs. | No | Active |
| `functions/api/` | Cloudflare Pages API handlers. | Yes | Active |
| `scripts/` | Utility and maintenance scripts. | No | Active |
| `src/app/` | Route composition and page registry wiring. | Yes | Active |
| `src/components/` | Shared UI components. | Yes | Active |
| `src/components/housing/legacy/` | Archived housing UI references. | No | Legacy |
| `src/config/` | Runtime/app config modules. | Yes | Active |
| `src/constants/` | Shared constants. | Yes | Active |
| `src/constants/housing/` | Housing constants and datasets. | Yes | Active |
| `src/contexts/` | React context providers. | Yes | Active |
| `src/data/articles/` | Library content source files. | Yes | Active |
| `src/hooks/` | Shared hooks. | Yes | Active |
| `src/i18n/` | i18n texts and config. | Yes | Active |
| `src/legacy/` | Archived code, not mounted at runtime. | No | Legacy |
| `src/pages/` | Route-level pages. | Yes | Active |
| `src/services/` | API/domain service layer. | Yes | Active |
| `src/types/` | Shared TypeScript types/interfaces. | Yes | Active |
| `src/utils/` | Utilities/helpers. | No | Active |
| `supabase-migrations/` | SQL migrations and policy updates. | Yes | Active |
| `tests/` | Test scripts and validation artifacts. | No | Active |
| `legacy/projects/illiniguide---housing-selection/` | Historical prototype archive. | No | Legacy |

---

## 4) Architecture Contracts (Must Follow)

1. **Route source of truth**  
   Define route declarations in `src/app/routes.tsx`.

2. **Page registry source of truth**  
   Register route/page metadata in `src/app/pageRegistry.ts`.

3. **Page registry documentation sync**  
   Keep route docs in sync with `docs/PAGE_REGISTRY.md`.

4. **Legacy boundary**  
   Legacy code must stay under one of:
   - `src/legacy/**`
   - `src/components/housing/legacy/**`
   - `legacy/projects/**`
   
   Active runtime code must not mount or depend on legacy paths.

---

## 5) Exclusions for Structure Docs

Do not include generated/dependency/cache directories in structure documentation:

- `node_modules/`
- `dist/`
- `__pycache__/`

---

## 6) Verification and Update Checklist

For structural changes:

1. Run `npm run verify:architecture`.
2. Run `npm run check:all` before merge.
3. Update all structure docs together:
   - `README.md` (repo root)
   - `illiniguide---uiuc-knowledge-base/README.md`
   - `illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md`
4. Preserve explicit legacy markers:
   - `[Legacy - Not Mounted]`
   - `【历史归档-不参与运行时挂载】` (when using Chinese docs)
