# IlliniGuide - UIUC Knowledge Base

Main frontend application for the UIUC assistant platform.

## Runtime Entry

- App entry: `src/index.tsx`
- App composition: `src/App.tsx`
- Route declarations: `src/app/routes.tsx`
- Page registry: `src/app/pageRegistry.ts`

## Project Structure

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

## Architecture Rules

- `src/App.tsx` is the only active app-composition entry in this package.
- Route-level orchestration belongs in `src/pages/**` and page-local hooks.
- `src/components/**` should stay presentation-first and feature-local.
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
npm install
npm run dev
npm run typecheck
npm run build
npm run verify:architecture
```
