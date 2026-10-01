import { json, resolveIdentity } from "../auth"
import { createMCPRouteServices, maybeHandleIntegrationsRoute } from "../mcp/routes"
import type { RouteHandler } from "../types"

/**
 * `/api/integrations*` — the MCP connection registry. The MCP router matches on
 * its own after stripping the `/api/` prefix, so this wrapper only supplies the
 * authenticated viewer id and turns a non-match into `null`.
 *
 * CORS is not set: the SPA is served by this same Worker, so the browser never
 * makes a cross-origin call here.
 */
export const onRequest: RouteHandler = async ({ request, env }) => {
  const identity = await resolveIdentity(request, env)
  if (!identity.ok) return identity.response

  const response = await maybeHandleIntegrationsRoute(
    request,
    createMCPRouteServices(env),
    identity.identity.userId,
  )

  return response ?? json({ error: "Not found", path: new URL(request.url).pathname }, 404)
}
