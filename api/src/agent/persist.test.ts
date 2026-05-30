import { expect, test } from "vite-plus/test"

import { persistTurn } from "./persist.ts"
import type { PersistEnv, ResponseMessage, UserMessage } from "./persist.ts"

interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

function makeMockFetch(
  responses: Array<{ ok: boolean; status: number; body?: string }>
) {
  const captured: CapturedRequest[] = []
  let callIndex = 0

  const mockFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Request types may not have toString
    const url = typeof input === "string" ? input : input.toString()
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const [k, v] of Object.entries(h)) {
        headers[k] = v
      }
    }

    let parsedBody: unknown = init?.body
    if (typeof init?.body === "string") {
      try {
        parsedBody = JSON.parse(init.body)
      } catch {
        parsedBody = init.body
      }
    }

    captured.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: parsedBody,
    })

    const resp = responses[callIndex] ?? { ok: true, status: 200 }
    callIndex++

    const responseBody = resp.body ?? ""
    return {
      ok: resp.ok,
      status: resp.status,
      text: async () => responseBody,
    } as unknown as Response
  }

  return { mockFetch, captured }
}

const testEnv: PersistEnv = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
}

test("persistTurn: bails early when conversationId is absent", async () => {
  const { mockFetch, captured } = makeMockFetch([])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  try {
    await persistTurn({
      env: testEnv,
      userId: "user-1",
      conversationId: undefined,
      userMessage: { role: "user", content: "hello" },
      responseMessages: [],
    })
    expect(captured.length).toBe(0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("persistTurn: inserts correct rows for assistant text + tool-call + tool result", async () => {
  const { mockFetch, captured } = makeMockFetch([
    { ok: true, status: 201 },
    { ok: true, status: 204 },
  ])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  const userMessage: UserMessage = { role: "user", content: "What is UIUC?" }

  const responseMessages: ResponseMessage[] = [
    {
      role: "assistant",
      content: [
        { type: "text", text: "Let me search for that." },
        {
          type: "tool-call",
          toolCallId: "call_abc123",
          toolName: "search_knowledge_base",
          args: { query: "UIUC" },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call_abc123",
          toolName: "search_knowledge_base",
          result: { text: "University of Illinois Urbana-Champaign" },
        },
      ],
    },
  ]

  try {
    await persistTurn({
      env: testEnv,
      userId: "user-1",
      conversationId: "conv-xyz",
      userMessage,
      responseMessages,
    })

    expect(captured.length).toBe(2)

    const insertReq = captured[0]
    expect(insertReq.url).toBe("https://test.supabase.co/rest/v1/messages")
    expect(insertReq.method).toBe("POST")
    expect(insertReq.headers.apikey).toBe("service-role-key")
    expect(insertReq.headers.Prefer).toBe("return=minimal")

    const rows = insertReq.body as Array<Record<string, unknown>>
    expect(rows.length).toBe(3)

    const [userRow, assistantRow, toolRow] = rows

    expect(userRow.role).toBe("user")
    expect(userRow.content).toBe("What is UIUC?")
    expect(userRow.conversation_id).toBe("conv-xyz")

    expect(assistantRow.role).toBe("assistant")
    expect(assistantRow.content).toBe("Let me search for that.")
    expect(assistantRow.conversation_id).toBe("conv-xyz")
    const toolCalls = assistantRow.tool_calls as Array<Record<string, unknown>>
    expect(toolCalls.length).toBe(1)
    expect(toolCalls[0].id).toBe("call_abc123")
    expect(toolCalls[0].name).toBe("search_knowledge_base")
    expect(toolCalls[0].arguments).toEqual({ query: "UIUC" })

    expect(toolRow.role).toBe("tool")
    expect(toolRow.tool_call_id).toBe("call_abc123")
    expect(toolRow.content).toBe(
      JSON.stringify({ text: "University of Illinois Urbana-Champaign" })
    )

    const patchReq = captured[1]
    expect(
      patchReq.url.startsWith(
        "https://test.supabase.co/rest/v1/conversations?id=eq."
      )
    ).toBeTruthy()
    expect(patchReq.method).toBe("PATCH")
    const patchBody = patchReq.body as Record<string, unknown>
    expect(typeof patchBody.updated_at === "string").toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("persistTurn: tool message with string result uses content directly", async () => {
  const { mockFetch, captured } = makeMockFetch([
    { ok: true, status: 201 },
    { ok: true, status: 204 },
  ])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  const responseMessages: ResponseMessage[] = [
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call_str",
          toolName: "grep_docs",
          result: "plain string result",
        },
      ],
    },
  ]

  try {
    await persistTurn({
      env: testEnv,
      userId: "user-1",
      conversationId: "conv-abc",
      userMessage: { role: "user", content: "grep something" },
      responseMessages,
    })

    const rows = captured[0].body as Array<Record<string, unknown>>
    const toolRow = rows[1]
    expect(toolRow.content).toBe("plain string result")
    expect(toolRow.tool_call_id).toBe("call_str")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("persistTurn: swallows errors and does not throw", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error("network failure")
  }

  try {
    await expect(
      persistTurn({
        env: testEnv,
        userId: "user-1",
        conversationId: "conv-err",
        userMessage: { role: "user", content: "test" },
        responseMessages: [],
      })
    ).resolves.toBeUndefined()
  } finally {
    globalThis.fetch = originalFetch
  }
})
