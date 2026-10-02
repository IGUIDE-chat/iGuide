import type { StreamChunk, ChatHistoryItem } from "./ai/types"
import { parseDeepSeekSSEStream } from "./deepseekSse"

// The Worker serves the SPA and the chat API from one origin, so the endpoint
// is the same relative path in dev and in production.
const CHAT_ENDPOINT = "/api/chat"

/** Reads a JSON error body without trusting its shape. */
async function readErrorMessage(response: Response): Promise<string | null> {
  const body: unknown = await response.json().catch(() => null)
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error
  }
  return null
}

/** Reads a JSON success body without trusting its shape. */
function readReplyText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>
  for (const key of ["reply", "text"]) {
    const value = record[key]
    if (typeof value === "string" && value) return value
  }
  return null
}

/**
 * Streams a chat turn from the Worker's tool-use agent. The agent owns prompt
 * assembly, retrieval, and language selection; this only relays the request and
 * re-emits the SSE stream as `StreamChunk`s.
 */
export const streamDeepSeekChat = async function* (
  history: ChatHistoryItem[],
  newMessage: string,
  lang: string = "en",
  conversationId?: string,
  userId?: string,
): AsyncGenerator<StreamChunk> {
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: newMessage,
        history,
        conversationId,
        userId,
        lang,
      }),
    })

    if (!response.ok) {
      const message = await readErrorMessage(response)
      throw new Error(message || `Chat API returned ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("text/event-stream") && response.body) {
      const reader = response.body.getReader()
      yield* parseDeepSeekSSEStream(reader, lang as "en" | "zh")
      return
    }

    const reply = readReplyText(await response.json().catch(() => null))
    if (reply) {
      yield { text: reply }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[DeepSeek] Stream error:", msg)
    yield { text: `\n(Error: ${msg})` }
  }
}
