import { type MiddlewareHandler } from "hono"

/**
 * Cloudflare Rate Limiting binding interface.
 *
 * The Workers runtime provides RateLimit bindings configured in wrangler.jsonc:
 * ```json
 * { "name": "MY_LIMITER", "namespace_id": "1001", "simple": { "limit": 30, "period": 60 } }
 * ```
 *
 * At runtime the binding exposes `limit({ key })` returning `{ success }`.
 */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/**
 * Middleware that rate-limits by client IP address (`cf-connecting-ip`).
 *
 * Usage (resolve binding from Hono context at request time):
 * ```ts
 * app.post('/chat',
 *   async (c, next) => ipRateLimit(c.env.CHAT_IP_LIMITER)(c, next),
 *   handler,
 * )
 * ```
 *
 * Returns 429 `{"error":"rate_limited"}` with `Retry-After: 30` when exceeded.
 */
export function ipRateLimit(binding: RateLimitBinding): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown"
    const { success } = await binding.limit({ key: `chat:ip:${ip}` })
    if (!success) {
      return c.json({ error: "rate_limited" }, 429 as const, {
        "Retry-After": "30",
      })
    }
    await next()
  }
}

/**
 * Middleware that rate-limits by authenticated user ID.
 *
 * Reads `userId` from Hono context (set by JWT auth middleware).
 * Skips if no userId (anonymous traffic governed by IP limit only).
 *
 * Returns 429 `{"error":"rate_limited"}` with `Retry-After: 30` when exceeded.
 */
export function userRateLimit(binding: RateLimitBinding): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get("userId") as string | undefined
    if (!userId) {
      await next()
      return
    }
    const { success } = await binding.limit({ key: `chat:user:${userId}` })
    if (!success) {
      return c.json({ error: "rate_limited" }, 429 as const, {
        "Retry-After": "30",
      })
    }
    await next()
  }
}
