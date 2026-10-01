import type { Env } from "./types"

export interface RequestIdentity {
  /** Supabase user id, or "anonymous" when no usable token was supplied. */
  userId: string
  isAuthenticated: boolean
}

export type IdentityResult =
  | { ok: true; identity: RequestIdentity }
  | { ok: false; response: Response }

/**
 * Resolves the caller from a Supabase bearer token. Absent token means an
 * anonymous caller, which every route accepts; a token that Supabase rejects
 * is a hard 401 so clients do not silently degrade to anonymous mid-session.
 */
export async function resolveIdentity(request: Request, env: Env): Promise<IdentityResult> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: true, identity: { userId: "anonymous", isAuthenticated: false } }
  }

  const token = authHeader.replace("Bearer ", "")

  try {
    const supabaseResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    })

    if (!supabaseResponse.ok) {
      return {
        ok: false,
        response: json({ error: "Invalid or expired token" }, 401),
      }
    }

    const userData = (await supabaseResponse.json()) as { id?: string }
    return {
      ok: true,
      identity: { userId: userData.id || "anonymous", isAuthenticated: true },
    }
  } catch (error) {
    console.error("Auth error:", error)
    return { ok: false, response: json({ error: "Authentication failed" }, 500) }
  }
}

export function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  })
}
