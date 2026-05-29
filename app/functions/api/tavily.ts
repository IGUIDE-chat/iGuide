// [FUNCTION] Tavily Web Search API proxy — keeps API key server-side.
// [函数] Tavily 网络搜索 API 代理 — 密钥保存在服务端，不暴露给前端。
type PagesFunction<T = unknown> = (context: {
  request: Request
  env: T
  params: Record<string, string>
  waitUntil: (promise: Promise<unknown>) => void
  next: () => Promise<Response>
  data: Record<string, unknown>
}) => Promise<Response>

interface Env {
  TAVILY_API_KEY?: string
}

interface TavilyRequestBody {
  query?: string
  search_depth?: "basic" | "advanced"
  max_results?: number
  include_domains?: string[]
  [key: string]: unknown
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    const apiKey = (env.TAVILY_API_KEY ?? "").trim()
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing TAVILY_API_KEY in server environment.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const body = await request.json()

    if (!body.query || typeof body.query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        api_key: apiKey,
      }),
    })

    if (!tavilyRes.ok) {
      const errText = await tavilyRes.text().catch(() => "")
      return new Response(
        JSON.stringify({
          error: "Tavily API request failed.",
          status: tavilyRes.status,
          details: errText,
        }),
        {
          status: tavilyRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const data = await tavilyRes.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error."
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}
