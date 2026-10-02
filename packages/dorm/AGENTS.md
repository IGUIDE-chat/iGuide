# AGENTS.md

Rules for agents working in `packages/dorm/` (`@iguide/dorm`). Repo-wide rules
are in the root [AGENTS.md](../../AGENTS.md).

## Boundary

- Hosts import only what `src/index.ts` exports, and this package imports nothing
  from any app. What it needs from the host (Supabase client, chat stream,
  session, shell slots) comes in through `configureDormServices` and the
  `DormRoutes` props.
- Everything under `/dorms` renders inside `DormRoutes`, and dorm providers stay
  inside it. State that must survive leaving `/dorms` uses `useRetainedState`
  (`src/components/housing/store/retainedState.ts`).
- To draw in the shell (sidebar, mobile header), portal into a slot with
  `useShellSlot`; a plain slot node renders outside the dorm providers.
- `src/` mirrors where the code lived in `apps/web/src`. Keep feature UI under
  `src/components/housing/`.
- The host compiles Tailwind over `src/` (`@source` in
  `apps/web/src/index.css`) and defines the `illini-*` theme colors.

## Verification

1. Run `vp check` from the repo root; it type-checks, lints, and formats this
   package with the rest.
2. Run `vp build` in `apps/web/` when exports, routes, or Tailwind classes
   change, since the host bundles these sources.
3. Run the data scripts below when dorm data contracts or media rules change.

## Dorm database

Run the SQL by hand in the Supabase SQL editor. Core dorm schema, in this order:

1. `scripts/migrations/create_dorms_table.sql`. On a fresh project, delete its
   last line first: it comments on a `dorm_overrides` table that no tracked SQL
   creates, and the SQL editor then rolls back the whole file.
2. `scripts/migrations/add_categorized_tags.sql` (safe to rerun)
3. `scripts/migrations/add_dorm_address.sql` and
   `scripts/migrations/add_dorm_website.sql`, which add the `address`,
   `address_zh` and `website` columns the seed writes

Feature SQL, after the core schema:

- `scripts/migrations/create_storage_bucket.sql`: the `dorm-images` storage bucket.
- `add_dorm_edit_history.sql`, then `fix_dorm_edit_history_rls.sql`;
  `add_dorm_comments.sql`, then `add_dorm_comment_hidden.sql`;
  `add_floor_plan_bed_size.sql` (all in `scripts/migrations/`).
- `scripts/create_dorm_user_features.sql`: dorm favorites and viewing history.

The app tables this SQL does not create, and the chat-owned
`add_soul_and_memory.sql`, are in
[`apps/web/AGENTS.md`](../../apps/web/AGENTS.md#database).

Known conflict: `add_categorized_tags.sql` limits `bathroom_type` to `communal`,
`semi-private` and `private`, but the seed writes `individual-use` for four
dorms, and one rejected row fails the whole upsert. Widen the constraint before
seeding:

```sql
ALTER TABLE public.dorms DROP CONSTRAINT chk_bathroom_type;
ALTER TABLE public.dorms ADD CONSTRAINT chk_bathroom_type
  CHECK (bathroom_type IN ('communal', 'individual-use', 'semi-private', 'private'));
```

## Dorm data scripts

`tsx` is not a dependency, so run the scripts with `vp dlx tsx`, from `packages/dorm/`:

```sh
vp dlx tsx scripts/validate-dorm-data.ts   # offline check of the bundled dataset
vp dlx tsx scripts/audit-dorm-media.ts     # sends HEAD requests to suspicious media URLs
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> vp dlx tsx scripts/seed-dorms-table.ts
```

The seed reads both variables from the shell, not from env files (in PowerShell,
set them first with `$env:NAME = "..."`). `SUPABASE_SERVICE_KEY` is a
service-role key that bypasses RLS. The seed upserts the bundled `UIUC_DORMS` into
`dorms` by `id`. It keeps stored images, gallery and floor-plan media, merges
tags with stored ones, and never deletes rows. It does not read the archived
`dorm_overrides`.
