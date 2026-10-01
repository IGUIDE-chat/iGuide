import { json } from "../auth"
import type { RouteHandler } from "../types"

/** Per-IP ceiling for knowledge-base search, enforced through the edge cache. */
const RATE_LIMIT = 20
const QMD_TIMEOUT_MS = 15_000

async function fetchQmd(baseUrl: string, body: string, apiKey: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), QMD_TIMEOUT_MS)
  try {
    return await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Records one search against the caller's per-minute budget and returns a 429
 * once that budget is spent. The counter lives in `caches.default` rather than
 * the isolate's memory so the limit holds across concurrent requests.
 */
async function consumeRateLimit(
  request: Request,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response | null> {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown"
  const minute = Math.floor(Date.now() / 60000)
  const key = new Request(`https://rate-limit/${ip}:${minute}`)

  // The DOM lib types `caches` as plain CacheStorage, hiding the Workers-only
  // `default` cache that `caches.default` refers to at runtime.
  const cacheStore = (caches as CacheStorage & { default: Cache }).default
  const cachedCount = await cacheStore.match(key)
  const count = cachedCount ? parseInt(await cachedCount.text()) : 0

  if (count >= RATE_LIMIT) {
    return json({ error: "Rate limited, try again later" }, 429, { "Retry-After": "30" })
  }

  waitUntil(
    cacheStore.put(
      key,
      new Response(String(count + 1), { headers: { "Cache-Control": "max-age=60" } }),
    ),
  )

  return null
}

/**
 * POST /api/search. Queries the QMD knowledge base, preferring the node nearest
 * the caller and failing over to the other region. `X-QMD-Region` reports which
 * node answered so the UI can show the source.
 */
export const onRequestPost: RouteHandler = async ({ request, env, waitUntil }) => {
  const limited = await consumeRateLimit(request, waitUntil)
  if (limited) return limited

  // `cf` is a Workers-only field that the DOM lib types loosely, so narrow it.
  const cfCountry = request.cf?.country
  const isCN = cfCountry === "CN"
  const body = await request.text()
  const [primaryUrl, fallbackUrl] = isCN
    ? [env.QMD_CN_URL, env.QMD_US_URL]
    : [env.QMD_US_URL, env.QMD_CN_URL]

  let qmdRegion = isCN ? "cn" : "us"
  let res: Response | null = null

  if (primaryUrl) {
    try {
      res = await fetchQmd(primaryUrl, body, env.QMD_API_KEY)
      if (!res.ok) res = null
    } catch {
      console.warn(`[QMD] Primary node (${qmdRegion}) failed, trying fallback`)
      res = null
    }
  }

  if (!res && fallbackUrl) {
    try {
      qmdRegion = isCN ? "us" : "cn"
      res = await fetchQmd(fallbackUrl, body, env.QMD_API_KEY)
    } catch (error) {
      const fallbackMsg = error instanceof Error ? error.message : String(error)
      console.error(`[QMD] Fallback node also failed:`, fallbackMsg)
    }
  }

  if (res?.ok) {
    return new Response(await res.text(), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-QMD-Region": qmdRegion },
    })
  }

  return json({ error: "QMD search unavailable on all nodes" }, 503)
}
