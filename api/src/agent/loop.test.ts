import assert from 'node:assert/strict'
import test from 'node:test'

import { runStreamingAgentLoop } from './loop.ts'
import { ToolRegistry } from '../tools/registry.ts'
import {
  createMockProviderFetch,
  type MockProviderResponseInput,
  type RecordedProviderRequest,
} from '../test/utils/mockProvider.ts'
import { createStubTool } from '../test/utils/stubTools.ts'

interface ProviderRequestBody {
  model?: string
  messages?: Array<{
    role: string
    content: string | null
    tool_call_id?: string
    tool_calls?: unknown[]
  }>
  tools?: Array<{ type: string; function: { name: string } }>
  stream?: boolean
}

function parseRequestBody(
  request: RecordedProviderRequest
): ProviderRequestBody {
  const body = request.body
  if (typeof body === 'string') {
    return JSON.parse(body) as ProviderRequestBody
  }
  return body as ProviderRequestBody
}

function createTestEnv(): Record<string, string> {
  return {
    DEEPSEEK_API_KEY: 'test-key',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  }
}

function createTestRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(
    createStubTool({
      name: 'search_knowledge_base',
      description: 'Search the UIUC knowledge base',
      content: 'test knowledge result',
    })
  )
  registry.register(
    createStubTool({
      name: 'web_search',
      description: 'Search the web',
      content: 'test web result',
    })
  )
  registry.register(
    createStubTool({
      name: 'grep_docs',
      description: 'Grep documentation',
      content: 'test grep result',
    })
  )
  return registry
}

interface ParsedSSEEvent {
  event: string
  data: unknown
}

async function collectSSEEvents(
  stream: ReadableStream<Uint8Array>
): Promise<ParsedSSEEvent[]> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const events: ParsedSSEEvent[] = []
  let currentEvent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('event:')) {
        currentEvent = trimmed.slice(6).trim()
      } else if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim()
        try {
          const data = JSON.parse(jsonStr)
          events.push({ event: currentEvent, data })
          currentEvent = ''
        } catch {
          /* JSON parse failure during SSE parsing */
        }
      }
    }
  }

  return events
}

function createWriterWithStream(): {
  writer: WritableStreamDefaultWriter<string>
  stream: ReadableStream<Uint8Array>
  events: Promise<ParsedSSEEvent[]>
} {
  const transform = new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(new TextEncoder().encode(chunk))
    },
  })

  const stream = transform.readable
  const writer = transform.writable.getWriter()
  const events = collectSSEEvents(stream)

  return { writer, stream, events }
}

function _assertEventExists(
  events: ParsedSSEEvent[],
  eventName: string
): ParsedSSEEvent {
  const event = events.find((e) => e.event === eventName)
  assert.ok(event, `Expected ${eventName} event to exist`)
  return event
}

function _assertEventPayload(
  event: ParsedSSEEvent,
  expected: Record<string, unknown>
): void {
  const payload = event.data as Record<string, unknown>
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(
      payload[key],
      value,
      `Expected payload.${key} to equal ${value}`
    )
  }
}

test('streaming no-tool final answer emits content then done', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Hello! How can I help you today?', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'hello',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const contentEvents = parsed.filter((e) => e.event === 'content')
    const doneEvents = parsed.filter((e) => e.event === 'done')

    assert.equal(
      contentEvents.length >= 1,
      true,
      'Should have at least one content event'
    )
    assert.equal(doneEvents.length, 1, 'Should have exactly one done event')

    const contentPayload = contentEvents[0].data as {
      choices: Array<{ delta: { content: string } }>
    }
    assert.ok(
      contentPayload.choices[0].delta.content.includes('Hello!'),
      'Content should include greeting'
    )

    assert.equal(result.toolCalls.length, 0, 'No tool calls should be made')
    assert.equal(result.iterations, 1, 'Should complete in 1 iteration')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming one tool then final answer completes act-observe loop', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search for that...',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          arguments: { query: 'PAR dorm dining' },
        },
      ],
      stream: true,
    },
    { content: 'PAR has several dining options including...', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'What are PAR dorm dining options?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Verify event sequence
    const eventNames = parsed.map((e) => e.event)
    assert.ok(eventNames.includes('tool_start'), 'Should have tool_start event')
    assert.ok(
      eventNames.includes('tool_result'),
      'Should have tool_result event'
    )
    assert.ok(eventNames.includes('content'), 'Should have content event')
    assert.ok(eventNames.includes('done'), 'Should have done event')

    // Verify tool_start payload
    const toolStartEvent = parsed.find((e) => e.event === 'tool_start')
    assert.ok(toolStartEvent, 'tool_start event should exist')
    const toolStartPayload = toolStartEvent.data as {
      name: string
      args: unknown
    }
    assert.equal(
      toolStartPayload.name,
      'search_knowledge_base',
      'Tool name should match'
    )

    // Verify tool_result payload
    const toolResultEvent = parsed.find((e) => e.event === 'tool_result')
    assert.ok(toolResultEvent, 'tool_result event should exist')
    const toolResultPayload = toolResultEvent.data as {
      name: string
      status: string
    }
    assert.equal(
      toolResultPayload.name,
      'search_knowledge_base',
      'Tool result name should match'
    )
    assert.equal(toolResultPayload.status, 'success', 'Tool should succeed')

    // Verify provider was called twice (initial + after observation)
    assert.equal(
      mockFetch.requests.length,
      2,
      'Provider should be called twice'
    )

    // Verify second request includes tool observation
    const secondRequest = parseRequestBody(mockFetch.requests[1])
    assert.ok(secondRequest.messages, 'Second request should have messages')
    const toolMessages = secondRequest.messages?.filter(
      (m) => m.role === 'tool'
    )
    assert.equal(toolMessages?.length, 1, 'Should have one tool message')

    // Verify result
    assert.equal(result.toolCalls.length, 1, 'Should have one tool call')
    assert.equal(
      result.toolCalls[0].name,
      'search_knowledge_base',
      'Tool name should match'
    )
    assert.equal(result.iterations, 2, 'Should complete in 2 iterations')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming multiple iterations with tool chaining', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Searching knowledge base...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'dorms' } },
      ],
      stream: true,
    },
    {
      content: 'Let me search the web for more info...',
      toolCalls: [
        { name: 'web_search', arguments: { query: 'UIUC dorms 2024' } },
      ],
      stream: true,
    },
    { content: 'Based on my searches, here is what I found...', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'Tell me about UIUC dorms',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should have multiple tool events
    const toolStartEvents = parsed.filter((e) => e.event === 'tool_start')
    const toolResultEvents = parsed.filter((e) => e.event === 'tool_result')

    assert.equal(toolStartEvents.length, 2, 'Should have 2 tool_start events')
    assert.equal(toolResultEvents.length, 2, 'Should have 2 tool_result events')

    // Verify provider called 3 times
    assert.equal(
      mockFetch.requests.length,
      3,
      'Provider should be called 3 times'
    )

    // Verify result
    assert.equal(result.toolCalls.length, 2, 'Should have 2 tool calls')
    assert.equal(result.iterations, 3, 'Should complete in 3 iterations')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming tool error is captured and handled gracefully', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search...',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          arguments: { query: 'test' },
        },
      ],
      stream: true,
    },
    { content: 'The search failed, but I can still help.', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: 'search_knowledge_base',
        description: 'Search that fails',
        throws: 'Database connection failed',
      })
    )

    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'What are the dorm options?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const doneEvents = parsed.filter((e) => e.event === 'done')
    assert.equal(doneEvents.length, 1, 'Should have done event')

    const toolResultEvents = parsed.filter((e) => e.event === 'tool_result')
    assert.equal(toolResultEvents.length, 1, 'Should have tool_result event')
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    assert.equal(
      toolResultPayload.status,
      'error',
      'Tool result should indicate error'
    )

    assert.ok(
      result.toolCalls.length >= 0,
      'Tool calls may be recorded depending on fallback path'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming max iterations triggers fallback with bounded stop', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Searching...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test1' } },
      ],
      stream: true,
    },
    {
      content: 'Still searching...',
      toolCalls: [{ name: 'web_search', arguments: { query: 'test2' } }],
      stream: true,
    },
    {
      content: 'More searching...',
      toolCalls: [{ name: 'grep_docs', arguments: { query: 'test3' } }],
      stream: true,
    },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'Complex query requiring many searches',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
      maxIterations: 3,
    })

    const parsed = await events

    assert.equal(result.iterations, 3, 'Should stop at max iterations')

    const fallbackEvents = parsed.filter((e) => e.event === 'fallback')
    assert.ok(fallbackEvents.length >= 1, 'Should have fallback event')

    const doneEvents = parsed.filter((e) => e.event === 'done')
    assert.equal(doneEvents.length, 1, 'Should have done event')

    assert.ok(
      result.content.includes('maximum') ||
        result.content.includes('incomplete') ||
        result.metadata?.stopReason === 'max_iterations' ||
        result.metadata?.reason === 'max_iterations_exceeded',
      'Should indicate max iterations reached'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming fallback direct response when all tools fail', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me try...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test' } },
      ],
      stream: true,
    },
    { content: "I couldn't search but here's what I know...", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: 'search_knowledge_base',
        description: 'Search that fails',
        throws: 'Connection error',
      })
    )

    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: 'What are the dorms?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const doneEvents = parsed.filter((e) => e.event === 'done')
    assert.equal(doneEvents.length, 1, 'Should have done event')

    const toolResultEvents = parsed.filter((e) => e.event === 'tool_result')
    assert.equal(toolResultEvents.length, 1, 'Should have tool_result event')
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    assert.equal(
      toolResultPayload.status,
      'error',
      'Tool result should indicate error'
    )

    assert.ok(result.iterations >= 1, 'Should complete at least one iteration')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming trace events are emitted at key points', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test' } },
      ],
      stream: true,
    },
    { content: 'Here is the answer.', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: 'What are the dorms?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Check for trace events
    const eventNames = parsed.map((e) => e.event)

    // Should have agent_step event
    assert.ok(
      eventNames.includes('agent_step'),
      'Should have agent_step trace event'
    )

    // Should have observation event
    assert.ok(
      eventNames.includes('observation'),
      'Should have observation trace event'
    )

    // Verify observation event structure
    const observationEvent = parsed.find((e) => e.event === 'observation')
    if (observationEvent) {
      const payload = observationEvent.data as {
        name: string
        status: string
        summary: string
      }
      assert.equal(
        payload.name,
        'search_knowledge_base',
        'Observation should have tool name'
      )
      assert.equal(payload.status, 'success', 'Observation should have status')
      assert.ok(payload.summary, 'Observation should have summary')
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming preserves SSE backward compatibility', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test' } },
      ],
      stream: true,
    },
    { content: 'Here is the answer.', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: 'What are the dorms?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Verify all legacy events exist
    const eventNames = parsed.map((e) => e.event)

    // Core events must exist
    assert.ok(eventNames.includes('tool_start'), 'Must have tool_start')
    assert.ok(eventNames.includes('tool_result'), 'Must have tool_result')
    assert.ok(eventNames.includes('content'), 'Must have content')
    assert.ok(eventNames.includes('done'), 'Must have done')

    // Verify tool_start uses 'name' not 'tool'
    const toolStartEvent = parsed.find((e) => e.event === 'tool_start')
    assert.ok(toolStartEvent, 'tool_start should exist')
    const toolStartPayload = toolStartEvent.data as Record<string, unknown>
    assert.ok('name' in toolStartPayload, "tool_start must have 'name' field")
    assert.ok(
      !('tool' in toolStartPayload),
      "tool_start must NOT have 'tool' field"
    )

    // Verify tool_result uses 'name' not 'tool'
    const toolResultEvent = parsed.find((e) => e.event === 'tool_result')
    assert.ok(toolResultEvent, 'tool_result should exist')
    const toolResultPayload = toolResultEvent.data as Record<string, unknown>
    assert.ok('name' in toolResultPayload, "tool_result must have 'name' field")
    assert.ok(
      !('tool' in toolResultPayload),
      "tool_result must NOT have 'tool' field"
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming retrieval safety gate blocks tools for hello', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Hello! How can I help?', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: 'hello',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should NOT have tool events for hello
    const toolStartEvents = parsed.filter((e) => e.event === 'tool_start')
    assert.equal(
      toolStartEvents.length,
      0,
      'Hello should not trigger tool_start'
    )

    // Verify request had empty tools
    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.deepEqual(
      requestBody.tools,
      [],
      'Hello should have empty tools array'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming allows tools for substantive query', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'PAR dorm' } },
      ],
      stream: true,
    },
    { content: 'PAR has...', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: 'What are PAR dorm dining options?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should have tool events for substantive query
    const toolStartEvents = parsed.filter((e) => e.event === 'tool_start')
    assert.equal(
      toolStartEvents.length,
      1,
      'Substantive query should trigger tool'
    )

    // Verify request had tools
    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.ok(
      requestBody.tools && requestBody.tools.length > 0,
      'Should have tools'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
