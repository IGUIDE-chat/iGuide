import { json } from "./auth"
import * as chat from "./routes/chat"
import * as health from "./routes/health"
import * as integrations from "./routes/integrations"
import type { Env, RouteHandler } from "./types"

/**
 * API routes handled by this Worker. Each entry maps HTTP methods to the
 * `RouteHandler`s a `routes/*` module exports; a method with no handler
 * answers 405, matching the Pages Functions behaviour this replaces.
 *
 * This Worker serves both the SPA and every API endpoint, so all routes live
 * under `/api/*` and the browser never makes a cross-origin call.
 */
const API_ROUTES: Record<string, Partial<Record<string, RouteHandler>>> = {
  "/api/chat": { POST: chat.onRequestPost },
  "/api/health": { GET: health.onRequestGet },
}

/**
 * Prefix routes match anywhere below their prefix. `/api/integrations*` is the
 * MCP connection registry, which has its own sub-paths.
 */
const API_PREFIX_ROUTES: Array<[prefix: string, handler: RouteHandler]> = [
  ["/api/integrations", integrations.onRequest],
]

/**
 * Unknown `/api/*` paths must not fall through to the SPA: the assets config
 * maps every unmatched path to index.html, which would answer an API mistake
 * with `200 text/html` and hide the bug from the client. The advertised list is
 * derived from the route tables so it cannot drift from what is served.
 */
const AVAILABLE_ENDPOINTS: string[] = [
  ...Object.keys(API_ROUTES),
  ...API_PREFIX_ROUTES.map(([prefix]) => `${prefix}/*`),
].sort()

function methodNotAllowed(allowed: string[]): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allowed.join(", ") },
  })
}

export default {
  fetch: (request, env, ctx) => app.fetch(request, env, ctx),
} satisfies ExportedHandler<Env>
