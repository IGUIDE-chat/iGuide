import { json } from "./auth"
import * as chat from "./routes/chat"
import * as deepseek from "./routes/deepseek"
import * as gemini from "./routes/gemini"
import * as health from "./routes/health"
import * as integrations from "./routes/integrations"
import * as search from "./routes/search"
import * as tavily from "./routes/tavily"
import type { Env, RouteHandler } from "./types"

/**
 * API routes handled by this Worker. Each module may export `onRequestPost` and
 * `onRequestOptions`; a route that does not export a handler for the incoming
 * method answers 405, matching the Pages Functions behaviour this replaces.
 *
 * This Worker serves both the SPA and every API endpoint, so all routes live
 * under `/api/*` and the browser never makes a cross-origin call.
 */
const API_ROUTES: Record<string, Partial<Record<string, RouteHandler>>> = {
  "/api/chat": { POST: chat.onRequestPost },
  "/api/deepseek": { POST: deepseek.onRequestPost },
  "/api/search": { POST: search.onRequestPost },
  "/api/gemini": { POST: gemini.onRequestPost, OPTIONS: gemini.onRequestOptions },
  "/api/health": { GET: health.onRequestGet },
  "/api/tavily": { POST: tavily.onRequestPost, OPTIONS: tavily.onRequestOptions },
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
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)

    const apiRoute = API_ROUTES[url.pathname]
    if (apiRoute) {
      const handler = apiRoute[request.method]
      if (!handler) return methodNotAllowed(Object.keys(apiRoute))
      return handler({ request, env, params: {}, waitUntil: ctx.waitUntil.bind(ctx) })
    }

    for (const [prefix, handler] of API_PREFIX_ROUTES) {
      if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
        return handler({ request, env, params: {}, waitUntil: ctx.waitUntil.bind(ctx) })
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json(
        { error: "Not found", path: url.pathname, availableEndpoints: AVAILABLE_ENDPOINTS },
        404,
      )
    }

    // Everything else is the SPA. The assets config sets
    // `notFoundHandling: "single-page-application"` so deep links still
    // resolve to index.html.
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
