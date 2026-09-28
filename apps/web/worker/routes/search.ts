import type { RouteHandler } from "../types"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export const onRequestPost: RouteHandler = async (context) => {
  const { request, env } = context

  try {
    let res: Response

    if (env.QMD_WORKER) {
      // Service Binding: direct Worker-to-Worker call (no network hop)
      res = await env.QMD_WORKER.fetch(
        new Request("https://api-gateway/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: request.body,
        }),
      )
    } else if (env.API_GATEWAY_URL) {
      res = await fetch(`${env.API_GATEWAY_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: request.body,
      })
    } else {
      return new Response(JSON.stringify({ error: "No search backend configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const data = await res.text()
    return new Response(data, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-QMD-Region": res.headers.get("X-QMD-Region") || "unknown",
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "QMD search unavailable", detail: e?.message }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}

export const onRequestOptions: RouteHandler = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}
