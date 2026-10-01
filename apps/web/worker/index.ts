import * as deepseek from "./routes/deepseek"
import * as gemini from "./routes/gemini"
import * as search from "./routes/search"
import * as tavily from "./routes/tavily"
import type { Env, RouteHandler } from "./types"

/**
 * API routes handled by this Worker. Each module may export `onRequestPost` and
 * `onRequestOptions`; a route that does not export a handler for the incoming
 * method answers 405, matching the Pages Functions behaviour this replaces.
 */
const API_ROUTES: Record<string, Partial<Record<string, RouteHandler>>> = {
  // The agent loop handler lands at "/api/chat" when apps/ai-agent merges in.
  "/api/deepseek": { POST: deepseek.onRequestPost },
  "/api/gemini": { POST: gemini.onRequestPost, OPTIONS: gemini.onRequestOptions },
  "/api/search": { POST: search.onRequestPost, OPTIONS: search.onRequestOptions },
  "/api/tavily": { POST: tavily.onRequestPost, OPTIONS: tavily.onRequestOptions },
}

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

    // Everything else is the SPA. The assets config sets
    // `notFoundHandling: "single-page-application"` so deep links still
    // resolve to index.html.
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
