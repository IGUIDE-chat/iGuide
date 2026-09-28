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

/** Bindings the web Worker reads. Secrets are supplied by `.dev.vars` locally and by `cf workers secrets` in production. */
export interface Env {
  /** Workers Static Assets binding; used for the SPA fallback. */
  ASSETS: Fetcher
  COZE_CLIENT_ID?: string
  COZE_PRIVATE_KEY?: string
  COZE_BOT_ID?: string
  COZE_API_TOKEN?: string
  VITE_COZE_API_KEY?: string
  VITE_COZE_BOT_ID?: string
  DEEPSEEK_API_KEY?: string
  VITE_DEEPSEEK_API_KEY?: string
  TAVILY_API_KEY?: string
  GOOGLE_API_KEY?: string
  API_GATEWAY_URL?: string
  /** Optional service binding to the geo-routed search Worker. */
  QMD_WORKER?: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>
  }
}
