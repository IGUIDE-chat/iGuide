import assert from 'node:assert/strict'
import test from 'node:test'

import { persistTurn } from './persist.ts'
import  { type PersistEnv, type ResponseMessage, type UserMessage } from './persist.ts'

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
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const [k, v] of Object.entries(h)) {
        headers[k] = v
      }
    }

    let parsedBody: unknown = init?.body
    if (typeof init?.body === 'string') {
      try {
        parsedBody = JSON.parse(init.body)
      } catch {
        parsedBody = init.body
      }
    }

    captured.push({
      url,
      method: init?.method ?? 'GET',
      headers,
      body: parsedBody,
    })

    const resp = responses[callIndex] ?? { ok: true, status: 200 }
    callIndex++

    const responseBody = resp.body ?? ''
    return {
      ok: resp.ok,
      status: resp.status,
      text: async () => responseBody,
    } as unknown as Response
  }

  return { mockFetch, captured }
}

const testEnv: PersistEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
}

test('persistTurn: bails early when conversationId is absent', async () => {
  const { mockFetch, captured } = makeMockFetch([])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  try {
    await persistTurn({
      env: testEnv,
      userId: 'user-1',
      conversationId: undefined,
      userMessage: { role: 'user', content: 'hello' },
      responseMessages: [],
    })
    assert.equal(captured.length, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('persistTurn: inserts correct rows for assistant text + tool-call + tool result', async () => {
  const { mockFetch, captured } = makeMockFetch([
    { ok: true, status: 201 },
    { ok: true, status: 204 },
  ])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  const userMessage: UserMessage = { role: 'user', content: 'What is UIUC?' }

  const responseMessages: ResponseMessage[] = [
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Let me search for that.' },
        {
          type: 'tool-call',
          toolCallId: 'call_abc123',
          toolName: 'search_knowledge_base',
          args: { query: 'UIUC' },
        },
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call_abc123',
          toolName: 'search_knowledge_base',
          result: { text: 'University of Illinois Urbana-Champaign' },
        },
      ],
    },
  ]

  try {
    await persistTurn({
      env: testEnv,
      userId: 'user-1',
      conversationId: 'conv-xyz',
      userMessage,
      responseMessages,
    })

    assert.equal(captured.length, 2)

    const insertReq = captured[0]
    assert.equal(insertReq.url, 'https://test.supabase.co/rest/v1/messages')
    assert.equal(insertReq.method, 'POST')
    assert.equal(insertReq.headers['apikey'], 'service-role-key')
    assert.equal(insertReq.headers['Prefer'], 'return=minimal')

    const rows = insertReq.body as Array<Record<string, unknown>>
    assert.equal(rows.length, 3)

    const [userRow, assistantRow, toolRow] = rows

    assert.equal(userRow.role, 'user')
    assert.equal(userRow.content, 'What is UIUC?')
    assert.equal(userRow.conversation_id, 'conv-xyz')

    assert.equal(assistantRow.role, 'assistant')
    assert.equal(assistantRow.content, 'Let me search for that.')
    assert.equal(assistantRow.conversation_id, 'conv-xyz')
    const toolCalls = assistantRow.tool_calls as Array<Record<string, unknown>>
    assert.equal(toolCalls.length, 1)
    assert.equal(toolCalls[0].id, 'call_abc123')
    assert.equal(toolCalls[0].name, 'search_knowledge_base')
    assert.deepEqual(toolCalls[0].arguments, { query: 'UIUC' })

    assert.equal(toolRow.role, 'tool')
    assert.equal(toolRow.tool_call_id, 'call_abc123')
    assert.equal(
      toolRow.content,
      JSON.stringify({ text: 'University of Illinois Urbana-Champaign' })
    )

    const patchReq = captured[1]
    assert.ok(
      patchReq.url.startsWith(
        'https://test.supabase.co/rest/v1/conversations?id=eq.'
      )
    )
    assert.equal(patchReq.method, 'PATCH')
    const patchBody = patchReq.body as Record<string, unknown>
    assert.ok(typeof patchBody.updated_at === 'string')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('persistTurn: tool message with string result uses content directly', async () => {
  const { mockFetch, captured } = makeMockFetch([
    { ok: true, status: 201 },
    { ok: true, status: 204 },
  ])
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch as typeof fetch

  const responseMessages: ResponseMessage[] = [
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call_str',
          toolName: 'grep_docs',
          result: 'plain string result',
        },
      ],
    },
  ]

  try {
    await persistTurn({
      env: testEnv,
      userId: 'user-1',
      conversationId: 'conv-abc',
      userMessage: { role: 'user', content: 'grep something' },
      responseMessages,
    })

    const rows = captured[0].body as Array<Record<string, unknown>>
    const toolRow = rows[1]
    assert.equal(toolRow.content, 'plain string result')
    assert.equal(toolRow.tool_call_id, 'call_str')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('persistTurn: swallows errors and does not throw', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('network failure')
  }

  try {
    await assert.doesNotReject(
      persistTurn({
        env: testEnv,
        userId: 'user-1',
        conversationId: 'conv-err',
        userMessage: { role: 'user', content: 'test' },
        responseMessages: [],
      })
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
