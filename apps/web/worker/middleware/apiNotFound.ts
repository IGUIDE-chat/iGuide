import type { MiddlewareHandler } from "hono"

import { json } from "../auth"
import { API_ENDPOINTS } from "../routes"
import type { Env } from "../types"

/**
 * The JSON 404 for unknown `/api/*` paths. Mounted after every API route and
 * before the SPA fallback, so an API mistake answers `404 application/json`
 * with the list of endpoints that do exist instead of `200 text/html`.
 */
export const apiNotFound: MiddlewareHandler<{ Bindings: Env }> = async (c) =>
  json(
    {
      error: "Not found",
      path: c.req.path,
      availableEndpoints: API_ENDPOINTS,
    },
    404,
  )
