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
  VITE_DEEPSEEK_API_KEY?: string
  TAVILY_API_KEY?: string
  GOOGLE_API_KEY?: string

  // Supabase: resolves the caller's identity for /api/chat and /api/integrations.
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string

  // Embeddings backing the knowledge-base tool.
  SILICONFLOW_API_KEY: string
  EMBEDDING_API_BASE_URL: string
  EMBEDDING_API_KEY: string
  EMBEDDING_MODEL: string
  EMBEDDING_DIMENSIONS: string
  EMBEDDING_FALLBACK_URL?: string

  // QMD search nodes. The nearest node is primary; the other is the failover.
  QMD_CN_URL: string
  QMD_US_URL: string
  QMD_API_KEY: string
}
