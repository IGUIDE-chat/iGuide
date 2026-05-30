import type { RequestContext } from "../tools/types"

export async function callSupabaseRpc<T>(
  ctx: RequestContext,
  rpcName: string,
  body: Record<string, unknown>
): Promise<T> {
  const supabaseUrl = ctx.env.SUPABASE_URL
  const anonKey = ctx.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase credentials not configured")
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Supabase RPC ${rpcName} returned ${response.status}: ${errorText}`
    )
  }

  return (await response.json()) as T
}
