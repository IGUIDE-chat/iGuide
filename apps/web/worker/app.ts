import { createDormApi, dormDeps, type DormApiDeps } from "@iguide/dorm"
import { Hono } from "hono"
import type { Context } from "hono"

import { apiNotFound } from "./middleware/apiNotFound"
import { lendDormDeps } from "./middleware/dormApi"
import { spaFallback } from "./middleware/spaFallback"
import {
  API_PREFIX_ROUTES,
  API_ROUTES,
  DORM_API_PREFIX,
  methodNotAllowed,
  toRouteContext,
} from "./routes"
import type { Env } from "./types"

/**
 * Bindings the Hono app reads; `Env` stays owned by `worker/types.ts`. The
 * `dormDeps` variable is the slot `@iguide/dorm` reads its per-request
 * Supabase client and identity resolver from, so the dorm sub-app can be
 * mounted here without carrying any environment of its own.
 */
export type AppEnv = {
  Bindings: Env
  Variables: { [dormDeps]: DormApiDeps }
}

/**
 * Builds the Worker's HTTP app: the API surface mounted on Hono, the dorm
 * domain API mounted from `@iguide/dorm` at `/api/dorms`, a JSON 404 for
 * unknown `/api/*` paths, and the SPA fallback for everything else. Order
 * matters — the dorm mount and the API 404 have to run before the fallback,
 * or an API mistake would be answered with index.html.
 *
 * Methods are dispatched from the route table rather than with one Hono
 * registration per method, because Hono answers `HEAD` from the `GET` handler.
 * A wrong method on a known path must be a 405, not a second working endpoint.
 */
export function createApiApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>()

  for (const route of API_ROUTES) {
    app.all(route.path, (c) => {
      if (!Object.hasOwn(route.methods, c.req.method)) {
        return methodNotAllowed(Object.keys(route.methods))
      }
      return route.methods[c.req.method](toRouteContext(c))
    })
  }

  for (const { prefix, handler } of API_PREFIX_ROUTES) {
    app.all(prefix, (c) => handler(toRouteContext(c)))
    app.all(`${prefix}/*`, (c) => handler(toRouteContext(c)))
  }

  // The dorm domain API is a Hono sub-app from `@iguide/dorm`. Both the mount
  // prefix and everything below it lend the package its per-request
  // dependencies first, and both sit before `app.all("/api/*", apiNotFound)`
  // so a dorm path can never answer with the generic API 404. `route()`
  // re-registers the sub-app's routes on this app, so the `dormDeps` context
  // set above is what those handlers read.
  const dormApi = createDormApi()
  app.all(DORM_API_PREFIX, lendDormDeps)
  app.all(`${DORM_API_PREFIX}/*`, lendDormDeps)
  app.route(DORM_API_PREFIX, dormApi)

  // `app.route()` re-registers the sub-app's routes but not its `notFound`, so a
  // path the dorm router does not know would otherwise fall through to the
  // generic `/api/*` 404 and answer with the Worker's endpoint list. Delegating
  // the miss back to the sub-app keeps the dorm error envelope for the whole
  // prefix. No dorm handler can run here — this only fires when none matched.
  const dormMiss = (c: Context<AppEnv>) => dormApi.request(c.req.raw)
  app.all(DORM_API_PREFIX, dormMiss)
  app.all(`${DORM_API_PREFIX}/*`, dormMiss)

  app.all("/api/*", apiNotFound)
  app.all("*", spaFallback)

  return app
}
