import type { Context } from "hono"

import type { Env, RouteHandler } from "../types"
import * as chat from "./chat"
import * as deepseek from "./deepseek"
import * as gemini from "./gemini"
import * as health from "./health"
import * as integrations from "./integrations"
import * as tavily from "./tavily"

/**
 * The Worker's whole URL table. `createApiApp()` mounts these on the Hono app,
 * and the advertised endpoint list in the `/api/*` 404 is derived from them, so
 * the two cannot drift apart.
 *
 * This Worker serves both the SPA and every API endpoint, so all routes live
 * under `/api/*` and the browser never makes a cross-origin call.
 */
export interface ApiRoute {
  /** Exact path; nothing below it matches. */
  path: string
  /**
   * Supported methods keyed by method name. Key order is the order of the
   * `Allow` header a 405 answers with.
   */
  methods: Record<string, RouteHandler>
}

/**
 * Exact API routes. A path that exists but is asked for a method it does not
 * declare answers 405, matching the Pages Functions behaviour this replaces.
 */
export const API_ROUTES: ApiRoute[] = [
  { path: "/api/chat", methods: { POST: chat.onRequestPost } },
  { path: "/api/deepseek", methods: { POST: deepseek.onRequestPost } },
  {
    path: "/api/gemini",
    methods: { POST: gemini.onRequestPost, OPTIONS: gemini.onRequestOptions },
  },
  { path: "/api/health", methods: { GET: health.onRequestGet } },
  {
    path: "/api/tavily",
    methods: { POST: tavily.onRequestPost, OPTIONS: tavily.onRequestOptions },
  },
]

/**
 * Prefix routes match anywhere below their prefix. `/api/integrations*` is the
 * MCP connection registry, which has its own sub-paths; auth is resolved inside
 * the handler, not by the router.
 */
export interface ApiPrefixRoute {
  prefix: string
  handler: RouteHandler
}

export const API_PREFIX_ROUTES: ApiPrefixRoute[] = [
  { prefix: "/api/integrations", handler: integrations.onRequest },
]

/**
 * Where the dorm domain API is mounted. It is a Hono sub-app built by
 * `@iguide/dorm` rather than a handler from this directory, so it belongs to
 * neither route table above but is still part of the Worker's URL table and
 * still feeds the advertised endpoint list.
 */
export const DORM_API_PREFIX = "/api/dorms"

/**
 * Unknown `/api/*` paths must not fall through to the SPA: the assets config
 * maps every unmatched path to index.html, which would answer an API mistake
 * with `200 text/html` and hide the bug from the client. The advertised list is
 * derived from the route tables and the mounted dorm sub-app, so it cannot
 * drift from what is served.
 */
export const API_ENDPOINTS: string[] = [
  ...API_ROUTES.map((route) => route.path),
  ...API_PREFIX_ROUTES.map(({ prefix }) => `${prefix}/*`),
  `${DORM_API_PREFIX}/*`,
].sort()

/**
 * Adapts the Hono context to the `RouteHandler` contract the route modules are
 * written against. `c.req.raw` is the untouched request, so handlers keep
 * reading the body and streaming SSE exactly as they did before the router
 * existed. It is generic over the app env so a context carrying extra context
 * variables (the mounted dorm sub-app's dependencies) still fits.
 */
export function toRouteContext<E extends { Bindings: Env }>(c: Context<E>) {
  return {
    request: c.req.raw,
    env: c.env,
    params: {},
    waitUntil: (promise: Promise<unknown>) => c.executionCtx.waitUntil(promise),
  }
}

/** 405 for a known path reached with a method it does not declare. */
export function methodNotAllowed(allowed: string[]): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allowed.join(", ") },
  })
}
