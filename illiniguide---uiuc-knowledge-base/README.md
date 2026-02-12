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

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run verify:architecture
```
