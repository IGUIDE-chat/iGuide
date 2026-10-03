# AGENTS.md

Rules for agents working in `packages/dorm/` (`@iguide/dorm`). Repo-wide rules
are in the root [AGENTS.md](../../AGENTS.md).

## Boundary

- The package is a **worker-side dorm domain API**. `src/worker/` is a Hono
  sub-app plus Supabase data access; the host mounts it and bundles it into the
  only deployed Worker. There is no Worker entry, no `cloudflare.config.ts`, and
  no deploy step here — never add one.
- The host never reads anything deeper than `src/index.ts`, and this package
  imports nothing from any app.
- `@iguide/dorm` is a **runtime dependency of the SPA**, not just of the
  Worker. The dorm UI under `apps/web/src/components/housing/` imports the
  domain model and its helpers from this package, and the Worker mounts
  `createDormApi` from it. Anything exported here can reach both bundles.
- `createDormApi()` captures no environment. Per request the host sets the
  `dormDeps` context key with a Supabase client that forwards the caller's
  `Authorization: Bearer` token and a `resolveIdentity` function:

  ```ts
  app.use("/api/dorms/*", async (c, next) => {
    c.set(dormDeps, {
      supabase: asDormSupabase(clientForThisRequest(c.req.raw)),
      resolveIdentity: (request) => resolveIdentity(request, c.env),
    })
    await next()
  })
  app.route("/api/dorms", createDormApi())
  ```

  `asDormSupabase` narrows `SupabaseClient` to the `DormSupabase` interface the
  repositories use; supabase-js's builders are too self-referential for
  TypeScript to compare structurally (TS2589). Never pass a service-role key:
  the anon client plus RLS is the only authority, so the Worker gains no
  privilege it did not have.

- There is **no React here**. The dorm UI lives in
  `apps/web/src/components/housing/` and `apps/web/src/pages/dorms/`, and the
  SPA is the only client: it reaches this API over `/api/dorms` through
  `apps/web/src/services/dormApi.ts` and never queries the dorm tables itself.
- `src/index.ts` is the whole public surface, and it uses explicit `.ts`
  import extensions so `node` can load it under type stripping. It exports the
  Worker API, the repository types the SPA needs, and the shared domain model:
  the `Dorm` types in `src/types.ts` plus the row/room normalization in
  `src/utils/dormData.ts` and `src/utils/roomOptions.ts`. Those three modules
  are the single definition of the dorm data model — the worker's write path
  needs them (`repositories/dormsRepo.ts` maps rows through them) and the SPA
  imports them from `@iguide/dorm` instead of keeping a second copy. Do not
  move them into `apps/web` or duplicate them.
- `src/` therefore holds only `index.ts`, `types.ts`, `utils/` and `worker/`.
  There is no `components/`, `pages/` or `contexts/` here; a React file must
  never land in this package. `src/worker/` and `test/` stay pure `.ts` so
  `node --test` can load them without a bundler.
- `FilterOption` is a real `const` object plus a same-named type alias, and the
  SPA reads its members at runtime (`FilterOption.AC`), so it is a value export
  here. Only genuinely type-only bindings may use `export type`.
- The bundled `UIUC_DORMS` dataset and `buildSummary` stay client-side in
  `apps/web`: the Worker never imports them. The SPA falls back to the bundled
  dataset when `GET /api/dorms` fails, and resets a dorm by sending that
  record to `PATCH /api/dorms/:id`.

## Endpoints

All mounted under `/api/dorms`. Failures return
`{ "error": string, "code": string }`; database messages are logged, never
returned. `401` signed out, `403` signed in but not allowed (or not an admin),
`404` missing row, `400` bad input, `502` database failure.

The Access column is enforced per request from the host's identity, never from
a header or a secret: `requireUser` returns `401` when nobody signed in, and
`requireAdmin` returns `401` signed out and `403` for a signed-in caller whose
`user_metadata.is_admin` (or `isAdmin`) is not exactly `true`. That claim comes
from the caller's own GoTrue document, so it is covered by the same token check
as the user id. `owner` means the row's `user_id` must equal the caller's.

| Method | Path                                                   | Access                                        |
| :----- | :----------------------------------------------------- | :-------------------------------------------- |
| GET    | `/`                                                    | guest                                         |
| GET    | `/:id`                                                 | guest                                         |
| GET    | `/:id/comments`                                        | guest; hidden rows only for admins            |
| POST   | `/:id/comments`                                        | signed in                                     |
| GET    | `/comments/stats`                                      | guest                                         |
| POST   | `/comments/:commentId/vote`                            | signed in                                     |
| PATCH  | `/comments/:commentId` `{hidden}`                      | admin                                         |
| DELETE | `/comments/:commentId`                                 | owner (`404` otherwise)                       |
| GET    | `/favorites`                                           | signed in                                     |
| POST   | `/favorites`, `/favorites/toggle`                      | signed in                                     |
| PATCH  | `/favorites/:id` `{notes}`                             | owner                                         |
| DELETE | `/favorites/:id`, `/favorites`                         | owner                                         |
| GET    | `/history?limit=`                                      | signed in                                     |
| POST   | `/history`                                             | signed in                                     |
| DELETE | `/history/:id`, `/history/by-dorm/:dormId`, `/history` | owner                                         |
| GET    | `/:id/edit-history`                                    | admin                                         |
| PATCH  | `/:id`                                                 | admin                                         |
| POST   | `/:id/restore`                                         | admin                                         |
| POST   | `/:id/images`                                          | admin; multipart `file`, bucket `dorm-images` |

`POST` bodies take `dorm_id`, `dorm_name`, optional `dorm_name_zh`.
`POST /:id/comments` takes `content`, optional `display_name` and `dorm_vote`
(`1`, `-1`, or null). `POST /comments/:commentId/vote` takes `vote`.
`PATCH /:id` takes `{ updates, edit_history? }`; `updates` is filtered to
`KNOWN_DB_COLUMNS` and `edit_history` (`{ summary, snapshot_before, dorm_name?,
changed_by? }`) is logged fire-and-forget. `POST /:id/restore` takes one entry
from `GET /:id/edit-history`. There is no server-side filtering, sorting, or
pagination beyond the caller's own rows: the SPA keeps that in
`dorm-list/filtering.ts` and `useDormListController.ts`.

## Verification

This package is never deployed or built on its own; it is verified through the
host.

1. Run `vp check` from the repo root; it type-checks, lints, and formats this
   package with the rest.
2. Run `node --test "test/**/*.test.ts"` from `packages/dorm` for the worker
   API suite. It injects a fake `DormSupabase`, so it needs no network.
3. Run `vp build` and `vp exec cf build` in `apps/web/` whenever the exports
   change, since the host bundles these sources into the only deployed Worker.
4. Run `apps/web`'s
   `src/services/__tests__/dormApi.contract.test.ts` — included in that app's
   `node --test "worker/**/*.test.ts" "src/**/*.test.ts"` run — whenever a
   route, a request body or a response shape changes. It drives the real SPA
   client against this package mounted in the real Worker, with only the network
   stubbed, so it is where a drift between the two shows up.

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

The scripts moved back to the SPA with the dataset they import. They live in
`apps/web/scripts/`; the schema they write stays here under `scripts/`.
[`apps/web/AGENTS.md`](../../apps/web/AGENTS.md#database) owns how to run them,
including the `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` the seed takes from the
shell, so do not repeat that command block here. `tsx` is not a dependency of
this package, which is why they run through `vp dlx tsx` from `apps/web/`.

`SUPABASE_SERVICE_KEY` is a service-role key that bypasses RLS. It is the only
place in the project that uses one: the Worker holds an anon key and forwards
the caller's own token, so the seed's privilege is an offline tool, never a
request path. The seed upserts the bundled `UIUC_DORMS` into
`dorms` by `id`. It keeps stored images, gallery and floor-plan media, merges
tags with stored ones, and never deletes rows. It does not read the archived
`dorm_overrides`.
