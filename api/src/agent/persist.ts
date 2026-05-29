export interface PersistEnv {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

interface TextPart {
  type: "text"
  text: string
}

interface ToolCallPart {
  type: "tool-call"
  toolCallId: string
  toolName: string
  args: unknown
}

interface ToolResultPart {
  type: "tool-result"
  toolCallId: string
  toolName: string
  result: unknown
}

type UIMessagePart = TextPart | ToolCallPart | ToolResultPart | { type: string }

export interface ResponseMessage {
  role: "assistant" | "tool"
  content: UIMessagePart[]
  toolCallId?: string
  result?: unknown
}

export interface UserMessage {
  role: "user"
  content: string | UIMessagePart[]
}

export interface PersistTurnParams {
  env: PersistEnv
  userId: string
  conversationId?: string
  userMessage: UserMessage
  responseMessages: ResponseMessage[]
}

interface MessageRow {
  conversation_id: string
  role: string
  content: string
  tool_calls?: Array<{ id: string; name: string; arguments: unknown }> | null
  tool_call_id?: string | null
}

function supabaseHeaders(env: PersistEnv): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  }
}

function extractTextContent(parts: UIMessagePart[]): string {
  return parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function extractToolCalls(
  parts: UIMessagePart[]
): Array<{ id: string; name: string; arguments: unknown }> | null {
  const calls = parts
    .filter((p): p is ToolCallPart => p.type === "tool-call")
    .map((p) => ({
      id: p.toolCallId,
      name: p.toolName,
      arguments: p.args,
    }))
  return calls.length > 0 ? calls : null
}

function buildUserRow(conversationId: string, msg: UserMessage): MessageRow {
  const content =
    typeof msg.content === "string"
      ? msg.content
      : extractTextContent(msg.content)

  return { conversation_id: conversationId, role: "user", content }
}

function buildResponseRows(
  conversationId: string,
  messages: ResponseMessage[]
): MessageRow[] {
  const rows: MessageRow[] = []

  for (const msg of messages) {
    if (msg.role === "assistant") {
      rows.push({
        conversation_id: conversationId,
        role: "assistant",
        content: extractTextContent(msg.content),
        tool_calls: extractToolCalls(msg.content),
      })
    } else if (msg.role === "tool") {
      const resultParts = msg.content.filter(
        (p): p is ToolResultPart => p.type === "tool-result"
      )

      if (resultParts.length > 0) {
        for (const part of resultParts) {
          rows.push({
            conversation_id: conversationId,
            role: "tool",
            content:
              typeof part.result === "string"
                ? part.result
                : JSON.stringify(part.result),
            tool_call_id: part.toolCallId,
          })
        }
      } else {
        rows.push({
          conversation_id: conversationId,
          role: "tool",
          content:
            typeof msg.result === "string"
              ? msg.result
              : JSON.stringify(msg.result ?? null),
          tool_call_id: msg.toolCallId ?? null,
        })
      }
    }
  }

  return rows
}

export async function persistTurn(params: PersistTurnParams): Promise<void> {
  const { env, conversationId, userMessage, responseMessages } = params

  if (!conversationId) {
    console.warn("[persistTurn] No conversationId — skipping persistence")
    return
  }

  try {
    const allRows: MessageRow[] = [
      buildUserRow(conversationId, userMessage),
      ...buildResponseRows(conversationId, responseMessages),
    ]

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: supabaseHeaders(env),
      body: JSON.stringify(allRows),
    })

    if (!insertRes.ok) {
      const body = await insertRes.text()
      console.error(
        `[persistTurn] Message insert failed: ${insertRes.status} ${body}`
      )
    }

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/conversations?id=eq.${encodeURIComponent(conversationId)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(env),
        body: JSON.stringify({ updated_at: new Date().toISOString() }),
      }
    )

    if (!patchRes.ok) {
      const body = await patchRes.text()
      console.error(
        `[persistTurn] Conversation update failed: ${patchRes.status} ${body}`
      )
    }
  } catch (err) {
    console.error("[persistTurn] Unexpected error during persistence:", err)
  }
}
