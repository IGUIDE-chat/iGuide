# @iguide/dorm

[中文](README_CN.md)

The dorm (housing) domain: a worker-side Hono API for the `dorms`, dorm comments, favorites and
viewing-history tables, plus the shared data model the SPA and the API both speak. It is a workspace
package so dorm reads and writes happen in the Worker, under RLS, instead of from the browser.

`@iguide/dorm` is a runtime dependency of the SPA as well as of the Worker: the dorm UI under
`apps/web/src/components/housing/` imports the domain model and its helpers from this package,
while the Worker mounts the sub-app below. There is no React here, and the package is never deployed
or built on its own.

## Boundary

The React UI lives in `apps/web/src/components/housing/`, and the host imports only what
`src/index.ts` exports. This package imports nothing from any app.

```ts
import { createDormApi, asDormSupabase, dormDeps } from "@iguide/dorm"

app.use("/api/dorms/*", async (c, next) => {
  c.set(dormDeps, {
    supabase: asDormSupabase(clientForThisRequest(c.req.raw)),
    resolveIdentity: (request) => resolveIdentity(request, c.env),
  })
  await next()
})
app.route("/api/dorms", createDormApi())
```

- Per request the host injects a Supabase client that forwards the caller's `Authorization: Bearer`
  token, plus a function that resolves who is calling. The sub-app captures no environment.
- The anon client plus RLS is the only authority; there is no service-role path, so the Worker gains
  no privilege it did not already have.
- Failures return `{ error, code }`. Database messages are logged in the Worker, never returned.

- Access is per request, resolved from the caller's own Supabase user document: the dorm list, one
  dorm, its comments and the comment stats are guest-readable; `/favorites` and `/history` need a
  signed-in caller (`401` otherwise); edit history, dorm updates, restores, image uploads and
  comment moderation need an admin (`401` signed out, `403` signed in), where admin means
  `user_metadata.is_admin` being exactly `true`. The full surface is in [AGENTS.md](AGENTS.md).

`src/index.ts` also exports the domain model — the `Dorm` types in `src/types.ts` and the
row/room normalization in `src/utils/` — because the worker's write path needs them and the SPA
imports them from here instead of keeping a second copy.

## Layout

- `src/worker/`: the Hono sub-app and its repositories.
- `src/types.ts` and `src/utils/`: the domain model and its normalization rules, shared by the
  worker's write path and the SPA.
- `test/`: the API suite; it injects a fake Supabase, so it needs no network.
- `scripts/`: the dorm database SQL.
- `scrapers/`: standalone Puppeteer/Bun review scrapers, outside the workspace (see its README).

`src/index.ts` is the whole public surface — the sub-app, the `asDormSupabase` and `dormDeps`
helpers, the repository types, and that domain model. It uses explicit `.ts` import extensions, so
`node -e 'import("./packages/dorm/src/index.ts")'` loads it under type stripping and proves every
export binds to something real at runtime.

The data scripts live with the dataset they import, in `apps/web/scripts/`; how to run them, including
the `SUPABASE_SERVICE_KEY` the seed takes from the shell, is in
[apps/web/AGENTS.md](../../apps/web/AGENTS.md#database). The Worker never uses that key.

## Database and data scripts

The SQL order, the known conflicts, and the endpoint table are in
[AGENTS.md](AGENTS.md).
