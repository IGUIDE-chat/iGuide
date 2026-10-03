import type { Env } from "./types"

export interface RequestIdentity {
  /** Supabase user id, or "anonymous" when no usable token was supplied. */
  userId: string
  isAuthenticated: boolean
  /**
   * Whether the caller is a dorm admin. It comes from the caller's own
   * Supabase user document, never from a secret or a request header:
   * `user_metadata.is_admin` or `user_metadata.isAdmin` being exactly `true`,
   * the predicate the client used before the dorm API moved into this Worker.
   * Only the dorm admin routes read it; `health`, `chat` and `integrations`
   * use `userId`. Always false for the anonymous path.
   */
  isAdmin: boolean
}

/** The GoTrue user document, as far as this resolver reads it. */
interface SupabaseUserDocument {
  id?: string
  user_metadata?: { is_admin?: unknown; isAdmin?: unknown } | null
}

export type IdentityResult =
  | { ok: true; identity: RequestIdentity }
  | { ok: false; response: Response }

/**
 * Resolves the caller from a Supabase bearer token. Absent token means an
 * anonymous caller, which every route accepts; a token that Supabase rejects
 * is a hard 401 so clients do not silently degrade to anonymous mid-session.
 *
 * The authenticated branch also reads the caller's admin claim: the returned
 * `isAdmin` comes from `user_metadata.is_admin` / `user_metadata.isAdmin` on
 * the user document `${SUPABASE_URL}/auth/v1/user` returns, which is where the
 * dorm admin routes get it. The claim is the caller's own metadata, so it is
 * covered by the same token check as `userId`.
 */
export async function resolveIdentity(request: Request, env: Env): Promise<IdentityResult> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: true, identity: { userId: "anonymous", isAuthenticated: false, isAdmin: false } }
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

    const userData = (await supabaseResponse.json()) as SupabaseUserDocument
    const metadata = userData.user_metadata
    return {
      ok: true,
      identity: {
        userId: userData.id || "anonymous",
        isAuthenticated: true,
        isAdmin: metadata?.is_admin === true || metadata?.isAdmin === true,
      },
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
