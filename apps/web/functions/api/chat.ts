// Pages Functions ships no ambient type for the handler signature, so each
// function file declares its own.
type PagesFunction<T = unknown> = (context: {
  request: Request
  env: T
  params: Record<string, string>
  waitUntil: (promise: Promise<any>) => void
  next: () => Promise<Response>
  data: Record<string, unknown>
}) => Promise<Response>

interface Env {
  COZE_CLIENT_ID: string
  COZE_PRIVATE_KEY: string // PEM body, not a filesystem path
  COZE_BOT_ID: string
  COZE_API_TOKEN?: string
  VITE_COZE_API_KEY?: string
  VITE_COZE_BOT_ID?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    const body = (await request.json()) as any
    const { message, conversationId, history, userId, lang = "en" } = body

    // Prefer server-only secrets first to avoid accidentally using stale public vars.
    const API_TOKEN = (env.COZE_API_TOKEN || env.VITE_COZE_API_KEY || "").trim()
    const BOT_ID = (env.COZE_BOT_ID || env.VITE_COZE_BOT_ID || "").trim()

    if (!API_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing Coze API token in environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!BOT_ID) {
      return new Response(JSON.stringify({ error: "Missing Coze bot id in environment." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const cozeRes = await fetch("https://api.coze.com/v3/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user_id: userId || "user_123",
        stream: true,
        auto_save_history: true,
        additional_messages: [
          ...(history || []).map((h: any) => ({
            role: h.role === "model" ? "assistant" : "user",
            content: h.text,
            content_type: "text",
          })),
          { role: "user", content: message, content_type: "text" },
        ],
        custom_variables: {
          language: lang === "zh" ? "Chinese" : "English",
          response_detail_level: "comprehensive",
        },
        ...(conversationId && { conversation_id: conversationId }),
      }),
    })

    const { readable, writable } = new TransformStream()
    cozeRes.body?.pipeTo(writable)

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
