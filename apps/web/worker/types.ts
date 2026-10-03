/**
 * Shared handler contract for the web Worker.
 *
 * The `onRequest*` handlers are plain `(context) => Promise<Response>`
 * functions so the router can dispatch by method without pulling in a routing
 * library. They used to be typed as Pages Functions; the signature is
 * unchanged, only the name is.
 */
export type RouteHandler<TEnv = Env> = (context: {
  request: Request
  env: TEnv
  params: Record<string, string>
  waitUntil: (promise: Promise<unknown>) => void
}) => Promise<Response>

/**
 * Bindings the web Worker reads. Secrets come from `.dev.vars` locally and from
 * `cf workers secrets` in production; plain values are declared in
 * `cloudflare.config.ts`.
 */
export interface Env {
  /** Workers Static Assets binding; used for the SPA fallback. */
  ASSETS: Fetcher
  DEEPSEEK_API_KEY?: string
  TAVILY_API_KEY?: string

  // Supabase: resolves the caller's identity for /api/chat and /api/integrations.
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}
