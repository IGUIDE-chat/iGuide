import { Hono } from "hono"

import type { DormEnv } from "./deps.ts"
import { dormErrorHandler, json } from "./errors.ts"
import { commentsRouter } from "./routers/comments.ts"
import { dormsRouter } from "./routers/dorms.ts"
import { favoritesRouter } from "./routers/favorites.ts"
import { historyRouter } from "./routers/history.ts"

/**
 * Build the dorm domain API as a Hono sub-app. It captures no environment:
 * the host sets `dormDeps` on the request context before routing to it, so
 * the Supabase client and the identity resolver travel with the request.
 *
 * Mount order is load-bearing — `/comments`, `/favorites` and `/history` are
 * registered before the dorms router so `GET /:id` cannot swallow them.
 */
export function createDormApi(): Hono<DormEnv> {
  const app = new Hono<DormEnv>()

  app.onError(dormErrorHandler)
  app.notFound(() => json({ error: "Not found", code: "NOT_FOUND" }, 404))

  app.route("/comments", commentsRouter)
  app.route("/favorites", favoritesRouter)
  app.route("/history", historyRouter)
  app.route("/", dormsRouter)

  return app
}
