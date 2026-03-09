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
|-- functions/
|   `-- api/
|-- legacy/
|   `-- projects/
|       `-- illiniguide---housing-selection/   [Legacy - Not Mounted]
|-- scripts/
|-- src/
|   |-- app/
|   |-- pages/
|   |   |-- chat/
|   |   |-- library/
|   |   |-- dorms/
|   |   |-- courses/
|   |   |-- resume/
|   |   `-- profile/
|   |-- components/
|   |   `-- housing/
|   |       |-- dorm-list/
|   |       |-- dorm-map/
|   |       |-- dorm-detail/
|   |       |-- filter-modal/
|   |       |-- i18n/
|   |       `-- legacy/                        [Legacy - Not Mounted]
|   |-- contexts/
|   |-- services/
|   |-- constants/
|   |   `-- housing/
|   |-- i18n/
|   |-- data/
|   |   `-- articles/
|   |-- legacy/                                [Legacy - Not Mounted]
|   |-- hooks/
|   |-- types/
|   `-- utils/
|-- supabase-migrations/
`-- tests/
```

## Architecture Rules

- Active runtime code must not import from:
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
