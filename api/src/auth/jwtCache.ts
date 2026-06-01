/**
 * JWT Cache Utility
 *
 * Caches Supabase JWT verification results using the Cloudflare Cache API.
 * Reduces Auth API calls by serving verified payloads from cache for 300 seconds.
 */

export interface JwtPayload {
  sub: string
  role?: string
  email?: string
  exp?: number
}

interface SupabaseUserResponse {
  id?: string
  aud?: string
  role?: string
  email?: string
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Verify a Supabase JWT token, caching the result via the Cloudflare Cache API.
 *
 * 1. Computes a cache key from SHA-256(token)
 * 2. Returns cached payload on HIT
 * 3. Calls Supabase Auth REST API on MISS
 * 4. Stores successful result in cache with 300s TTL
 * 5. Returns `JwtPayload` or `null` on verification failure
 *
 * @param token - The raw JWT string (without "Bearer " prefix)
 * @param cache  - A Cloudflare Cache instance (typically `caches.default`)
 * @param env    - Object with SUPABASE_URL and SUPABASE_ANON_KEY
 * @returns The decoded payload or null
 */
export async function verifyAndCacheJwt(
  token: string,
  cache: Cache,
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }
): Promise<JwtPayload | null> {
  const tokenHash = await sha256Hex(token)
  const cacheUrl = `https://iguide/jwt-cache/${tokenHash}`
  const cacheKey = new Request(cacheUrl)

  const cached = await cache.match(cacheKey)
  if (cached) {
    return (await cached.json()) as JwtPayload
  }

  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    })

    if (!response.ok) {
      return null
    }

    const userData: SupabaseUserResponse = await response.json()
    if (!userData.id) {
      return null
    }

    const payload: JwtPayload = {
      sub: userData.id,
      role: userData.role,
      email: userData.email,
    }

    const cacheResponse = new Response(JSON.stringify(payload), {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/json",
      },
    })

    await cache.put(cacheKey, cacheResponse)

    return payload
  } catch {
    return null
  }
}
