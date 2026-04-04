// [FUNCTION] Gemini API proxy — keeps GOOGLE_API_KEY server-side.
// [函数] Gemini API 代理 — 密钥保存在服务端，不暴露给前端。
type PagesFunction<T = unknown> = (context: {
  request: Request
  env: T
  params: Record<string, string>
  waitUntil: (promise: Promise<any>) => void
  next: () => Promise<Response>
  data: Record<string, unknown>
}) => Promise<Response>

interface Env {
  GOOGLE_API_KEY?: string
}

interface GeminiRequestBody {
  model?: string
  contents?: unknown
  generationConfig?: unknown
  [key: string]: unknown
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    const apiKey = (env.GOOGLE_API_KEY || '').trim()
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing GOOGLE_API_KEY in server environment.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = (await request.json()) as GeminiRequestBody
    const model =
      typeof body.model === 'string' && body.model
        ? body.model
        : 'gemini-1.5-flash'

    // Remove model from body before forwarding
    const { model: _model, ...forwardBody } = body

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forwardBody),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '')
      return new Response(
        JSON.stringify({
          error: 'Gemini API request failed.',
          status: geminiRes.status,
          details: errText,
        }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await geminiRes.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected server error.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}
