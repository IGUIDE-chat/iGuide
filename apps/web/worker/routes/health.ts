import { json, resolveIdentity } from "../auth"
import type { RouteHandler } from "../types"

/**
 * GET /api/health. Reports the edge country so a curl from different regions
 * can confirm the geo split, and whether the caller's token was accepted.
 */
export const onRequestGet: RouteHandler = async ({ request, env }) => {
  const identity = await resolveIdentity(request, env)
  const isAuthenticated = identity.ok ? identity.identity.isAuthenticated : false
  // `cf` is a Workers-only field that the DOM lib types loosely, so narrow it.
  const cfCountry = request.cf?.country
  const country = typeof cfCountry === "string" ? cfCountry : "US"
  return json({
    status: "ok",
    region: country === "CN" ? "CN" : "Global",
    country,
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
}
