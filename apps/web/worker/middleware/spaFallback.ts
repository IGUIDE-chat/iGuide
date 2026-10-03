import type { MiddlewareHandler } from "hono"

import type { Env } from "../types"

/**
 * Everything that is not an API path is the SPA. The assets config sets
 * `notFoundHandling: "single-page-application"`, so deep links still resolve to
 * index.html; `runWorkerFirst: ["/api/*"]` is what keeps this out of the way of
 * the API surface.
 */
export const spaFallback: MiddlewareHandler<{ Bindings: Env }> = (c) =>
  c.env.ASSETS.fetch(c.req.raw)
