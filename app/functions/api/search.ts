// [FUNCTION] QMD search proxy — routes through api-gateway Worker via Service Binding.
type PagesFunction<T = unknown> = (context: {
  request: Request
  env: T
  params: Record<string, string>
  waitUntil: (promise: Promise<any>) => void
  next: () => Promise<Response>
  data: Record<string, unknown>
}) => Promise<Response>

interface Env {
  QMD_WORKER?: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>
  }
  API_GATEWAY_URL?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    let res: Response

    if (env.QMD_WORKER) {
      // Service Binding: direct Worker-to-Worker call (no network hop)
      res = await env.QMD_WORKER.fetch(
        new Request('https://api-gateway/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: request.body,
        })
      )
    } else if (env.API_GATEWAY_URL) {
      // Fallback: fetch via URL
      res = await fetch(`${env.API_GATEWAY_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: request.body,
      })
    } else {
      return new Response(
        JSON.stringify({ error: 'No search backend configured' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await res.text()
    return new Response(data, {
      status: res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-QMD-Region': res.headers.get('X-QMD-Region') || 'unknown',
      },
    })
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'QMD search unavailable', detail: e?.message }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}
