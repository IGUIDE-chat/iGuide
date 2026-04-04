# IlliniGuide - UIUC Knowledge Base

A comprehensive, zero-cost architecture knowledge base for new UIUC students featuring static content delivery and an AI-powered campus assistant.

## Setup

See [docs/CHATFLOW_SETUP.md](docs/CHATFLOW_SETUP.md) for Coze configuration.

## File Structure

```text
app/
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
|   |   |-- ui/
|   |   |   `-- branding/
|   |   |-- chat/
|   |   |-- housing/
|   |   |   |-- constants/
|   |   |   |-- dorm-detail/
|   |   |   |   `-- sections/
|   |   |   |-- dorm-list/
|   |   |   |-- dorm-map/
|   |   |   |-- edit-panel/
|   |   |   |-- filter-modal/
|   |   |   |-- hooks/
|   |   |   |-- i18n/
|   |   |   |-- store/
|   |   |   `-- types/
|   |   `-- layout/
|   |-- constants/
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
|   |-- legacy/
|   |   |-- auth/
|   |   `-- components/
|   |-- scripts/
|   |-- services/
|   |-- App.tsx
|   |-- constants.ts
|   |-- index.css
|   |-- index.tsx
|   |-- utils/
|   `-- types.ts
`-- tests/
    `-- artifacts/
```

## Architecture Rules

- `src/App.tsx` is the only active app-composition entry in this package.
- Route-level orchestration belongs in `src/pages/**` and page-local hooks.
- `src/components/**` should stay presentation-first and feature-local.
- `src/components/ui/**` is for business-agnostic shared UI only.
- `src/legacy/**` stores isolated unused reference code; active runtime modules must not import from it.
- A small number of active display components may remain at `src/components/` root until a stable documented subtree exists.
- Active runtime code must not import from reserved legacy boundaries:
  - `src/legacy/**`
  - `src/components/housing/legacy/**`
  - `legacy/projects/**`
- New pages must be registered in `src/app/pageRegistry.ts`.
- Route changes must be made in `src/app/routes.tsx`.

Reference: `docs/FILE_RULES.md`

## Database & Data Management

The application uses Supabase for database and storage.
To initialize or update the housing data:

1. Create the `dorms` table and run necessary migrations: `scripts/migrations/create_dorms_table.sql` and `scripts/migrations/add_categorized_tags.sql`
   The second migration also adds the admin editor columns (`application_fee`, `dining_nearby_detail`, categorized tag fields) and is safe to rerun on fresh, partial, or already-migrated databases.
2. Seed the database using the provided script (requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` environment variables):
   ```bash
   npx tsx scripts/seed-dorms-table.ts
   ```
   *This script merges any local static data with existing database overrides into a unified `dorms` table.*

## Commands

```bash
pnpm install
pnpm run dev
pnpm run typecheck
pnpm run build
```
