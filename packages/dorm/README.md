# @iguide/dorm

[中文](README_CN.md)

The dorm (housing) feature: list, map, detail, compare, reviews, favorites, and admin editing, plus its
database SQL, data scripts, and review scrapers. It is a workspace package so dorm code, dependencies
(Mapbox GL, rc-slider, Headless UI), and state stay out of the rest of the app.

## Boundary

The host app imports only what `src/index.ts` exports, and the package imports nothing from the host.

```tsx
import { configureDormServices, DormRoutes } from "@iguide/dorm"

configureDormServices({ supabase, streamChatResponse }) // once, before DormRoutes renders

<Route path="/dorms/*" element={<DormRoutes language={language} user={user} requestLogin={requestLogin} layout={layout} />} />
```

- `configureDormServices` lends the host's Supabase client (so dorm queries share its session) and the
  chat stream used by the housing assistant.
- `DormRoutes` owns everything under `/dorms`. Dorm data, filters, compare, and favorites are mounted
  inside it, so other pages never load dorm code or query dorm tables.
- `layout` is the slice of the host shell the dorm UI drives: the flying-heart target refs and two
  slot setters. The dorm sidebar and the dorm list's mobile header portal into those slots, so they
  keep dorm context while rendering in the shell.

In `apps/web` the only file that touches this package is `src/pages/dorms/DormRoute.tsx`, lazy-loaded
by the `/dorms/*` route.

The host must also compile Tailwind over this package's sources (`@source` in `apps/web/src/index.css`)
and define the `illini-*` theme colors the components use.

## Layout

- `src/`: the feature. Its folders mirror where the code lived in `apps/web/src`, so moved files kept
  their relative imports and history.
- `scripts/`: dorm database SQL and data scripts.
- `scrapers/`: standalone Puppeteer/Bun review scrapers, outside the workspace (see its README).

## Dorm database

Run the SQL by hand in the Supabase SQL editor. Core dorm schema, in this order:

1. `scripts/migrations/create_dorms_table.sql`. On a fresh project, delete its last line first: it
   comments on a `dorm_overrides` table that no tracked SQL creates, and the SQL editor then rolls back
   the whole file.
2. `scripts/migrations/add_categorized_tags.sql` (safe to rerun)
3. `scripts/migrations/add_dorm_address.sql` and `scripts/migrations/add_dorm_website.sql`, which add
   the `address`, `address_zh` and `website` columns the seed writes

Feature SQL, after the core schema:

- `scripts/migrations/create_storage_bucket.sql`: the `dorm-images` storage bucket.
- `add_dorm_edit_history.sql`, then `fix_dorm_edit_history_rls.sql`; `add_dorm_comments.sql`, then
  `add_dorm_comment_hidden.sql`; `add_floor_plan_bed_size.sql` (all in `scripts/migrations/`).
- `scripts/create_dorm_user_features.sql`: dorm favorites and viewing history.

Known conflict: `add_categorized_tags.sql` limits `bathroom_type` to `communal`, `semi-private` and
`private`, but the seed writes `individual-use` for four dorms. Until that constraint changes, the seed
fails on a database built only from this SQL.

## Dorm data scripts

`tsx` is not a dependency, so run the scripts with `vp dlx tsx`, from `packages/dorm/`:

```sh
vp dlx tsx scripts/validate-dorm-data.ts   # offline check of the bundled dataset
vp dlx tsx scripts/audit-dorm-media.ts     # sends HEAD requests to suspicious media URLs
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> vp dlx tsx scripts/seed-dorms-table.ts
```

The seed reads both variables from the shell, not from env files (in PowerShell, set them first with
`$env:NAME = "..."`). `SUPABASE_SERVICE_KEY` is a service-role key that bypasses RLS. The seed upserts
the bundled `UIUC_DORMS` into `dorms` by `id`. It keeps stored images, gallery and floor-plan media,
merges tags with stored ones, and never deletes rows. It does not read the archived `dorm_overrides`.
