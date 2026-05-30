/* eslint-disable no-await-in-loop -- streaming reads require sequential consumption */
import { expect, test } from "vite-plus/test"

import type {
  MockProviderResponseInput,
  RecordedProviderRequest,
} from "../test/utils/mockProvider.ts"
import { createMockProviderFetch } from "../test/utils/mockProvider.ts"
import { createStubTool } from "../test/utils/stubTools.ts"
import { ToolRegistry } from "../tools/registry.ts"
import { runStreamingAgentLoop } from "./loop.ts"

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
  if (typeof body === "string") {
    return JSON.parse(body) as ProviderRequestBody
  }
  return body as ProviderRequestBody
}

function createTestEnv(): Record<string, string> {
  return {
    DEEPSEEK_API_KEY: "test-key",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  }
}

function createTestRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(
    createStubTool({
      name: "search_knowledge_base",
      description: "Search the UIUC knowledge base",
      content: "test knowledge result",
    })
  )
  registry.register(
    createStubTool({
      name: "web_search",
      description: "Search the web",
      content: "test web result",
    })
  )
  registry.register(
    createStubTool({
      name: "grep_docs",
      description: "Grep documentation",
      content: "test grep result",
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
  let buffer = ""
  const events: ParsedSSEEvent[] = []
  let currentEvent = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }

      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim()
      } else if (trimmed.startsWith("data:")) {
        const jsonStr = trimmed.slice(5).trim()
        try {
          const data = JSON.parse(jsonStr)
          events.push({ event: currentEvent, data })
          currentEvent = ""
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
  expect(event).toBeTruthy()
  return event!
}

function _assertEventPayload(
  event: ParsedSSEEvent,
  expected: Record<string, unknown>
): void {
  const payload = event.data as Record<string, unknown>
  for (const [key, value] of Object.entries(expected)) {
    expect(payload[key]).toEqual(value)
  }
}

test("streaming no-tool final answer emits content then done", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: "Hello! How can I help you today?", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: "hello",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const contentEvents = parsed.filter((e) => e.event === "content")
    const doneEvents = parsed.filter((e) => e.event === "done")

    expect(contentEvents.length > 0).toBe(true)
    expect(doneEvents.length).toBe(1)

    const contentPayload = contentEvents[0].data as {
      choices: Array<{ delta: { content: string } }>
    }
    expect(
      contentPayload.choices[0].delta.content.includes("Hello!")
    ).toBeTruthy()

    expect(result.toolCalls.length).toBe(0)
    expect(result.iterations).toBe(1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming one tool then final answer completes act-observe loop", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search for that...",
      toolCalls: [
        {
          name: "search_knowledge_base",
          arguments: { query: "PAR dorm dining" },
        },
      ],
      stream: true,
    },
    { content: "PAR has several dining options including...", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: "What are PAR dorm dining options?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Verify event sequence
    const eventNames = new Set(parsed.map((e) => e.event))
    expect(eventNames.has("tool_start")).toBeTruthy()
    expect(eventNames.has("tool_result")).toBeTruthy()
    expect(eventNames.has("content")).toBeTruthy()
    expect(eventNames.has("done")).toBeTruthy()

    // Verify tool_start payload
    const toolStartEvent = parsed.find((e) => e.event === "tool_start")
    expect(toolStartEvent).toBeTruthy()
    const toolStartPayload = toolStartEvent!.data as {
      name: string
      args: unknown
    }
    expect(toolStartPayload.name).toBe("search_knowledge_base")

    // Verify tool_result payload
    const toolResultEvent = parsed.find((e) => e.event === "tool_result")
    expect(toolResultEvent).toBeTruthy()
    const toolResultPayload = toolResultEvent!.data as {
      name: string
      status: string
    }
    expect(toolResultPayload.name).toBe("search_knowledge_base")
    expect(toolResultPayload.status).toBe("success")

    // Verify provider was called twice (initial + after observation)
    expect(mockFetch.requests.length).toBe(2)

    // Verify second request includes tool observation
    const secondRequest = parseRequestBody(mockFetch.requests[1])
    expect(secondRequest.messages).toBeTruthy()
    const toolMessages = secondRequest.messages?.filter(
      (m) => m.role === "tool"
    )
    expect(toolMessages?.length).toBe(1)

    // Verify result
    expect(result.toolCalls.length).toBe(1)
    expect(result.toolCalls[0].name).toBe("search_knowledge_base")
    expect(result.iterations).toBe(2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming multiple iterations with tool chaining", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching knowledge base...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "dorms" } },
      ],
      stream: true,
    },
    {
      content: "Let me search the web for more info...",
      toolCalls: [
        { name: "web_search", arguments: { query: "UIUC dorms 2024" } },
      ],
      stream: true,
    },
    { content: "Based on my searches, here is what I found...", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: "Tell me about UIUC dorms",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should have multiple tool events
    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")

    expect(toolStartEvents.length).toBe(2)
    expect(toolResultEvents.length).toBe(2)

    // Verify provider called 3 times
    expect(mockFetch.requests.length).toBe(3)

    // Verify result
    expect(result.toolCalls.length).toBe(2)
    expect(result.iterations).toBe(3)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming tool error is captured and handled gracefully", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [
        {
          name: "search_knowledge_base",
          arguments: { query: "test" },
        },
      ],
      stream: true,
    },
    { content: "The search failed, but I can still help.", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: "search_knowledge_base",
        description: "Search that fails",
        throws: "Database connection failed",
      })
    )

    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: "What are the dorm options?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const doneEvents = parsed.filter((e) => e.event === "done")
    expect(doneEvents.length).toBe(1)

    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")
    expect(toolResultEvents.length).toBe(1)
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    expect(toolResultPayload.status).toBe("error")

    expect(result.toolCalls.length >= 0).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming max iterations triggers fallback with bounded stop", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test1" } },
      ],
      stream: true,
    },
    {
      content: "Still searching...",
      toolCalls: [{ name: "web_search", arguments: { query: "test2" } }],
      stream: true,
    },
    {
      content: "More searching...",
      toolCalls: [{ name: "grep_docs", arguments: { query: "test3" } }],
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
      message: "Complex query requiring many searches",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
      maxIterations: 3,
    })

    const parsed = await events

    expect(result.iterations).toBe(3)

    const fallbackEvents = parsed.filter((e) => e.event === "fallback")
    expect(fallbackEvents.length > 0).toBeTruthy()

    const doneEvents = parsed.filter((e) => e.event === "done")
    expect(doneEvents.length).toBe(1)

    // eslint-disable-next-line vitest/no-conditional-in-test -- defensive assertion on optional result fields
    expect(
      result.content.includes("maximum") ||
        result.content.includes("incomplete") ||
        result.metadata?.stopReason === "max_iterations" ||
        result.metadata?.reason === "max_iterations_exceeded"
    ).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming fallback direct response when all tools fail", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me try...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test" } },
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
        name: "search_knowledge_base",
        description: "Search that fails",
        throws: "Connection error",
      })
    )

    const { writer, events } = createWriterWithStream()

    const result = await runStreamingAgentLoop({
      message: "What are the dorms?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    const doneEvents = parsed.filter((e) => e.event === "done")
    expect(doneEvents.length).toBe(1)

    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")
    expect(toolResultEvents.length).toBe(1)
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    expect(toolResultPayload.status).toBe("error")

    expect(result.iterations >= 1).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming trace events are emitted at key points", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test" } },
      ],
      stream: true,
    },
    { content: "Here is the answer.", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are the dorms?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Check for trace events
    const eventNames = new Set(parsed.map((e) => e.event))

    // Should have agent_step event
    expect(eventNames.has("agent_step")).toBeTruthy()

    // Should have observation event
    expect(eventNames.has("observation")).toBeTruthy()

    // Verify observation event structure
    const observationEvent = parsed.find((e) => e.event === "observation")
    // eslint-disable-next-line vitest/no-conditional-in-test -- defensive check on optional event
    if (observationEvent) {
      const payload = observationEvent.data as {
        name: string
        status: string
        summary: string
      }
      // eslint-disable-next-line vitest/no-conditional-expect -- guarded by if block
      expect(payload.name).toBe("search_knowledge_base")
      // eslint-disable-next-line vitest/no-conditional-expect -- guarded by if block
      expect(payload.status).toBe("success")
      // eslint-disable-next-line vitest/no-conditional-expect -- guarded by if block
      expect(payload.summary).toBeTruthy()
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming preserves SSE backward compatibility", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test" } },
      ],
      stream: true,
    },
    { content: "Here is the answer.", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are the dorms?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Verify all legacy events exist
    const eventNames = new Set(parsed.map((e) => e.event))

    // Core events must exist
    expect(eventNames.has("tool_start")).toBeTruthy()
    expect(eventNames.has("tool_result")).toBeTruthy()
    expect(eventNames.has("content")).toBeTruthy()
    expect(eventNames.has("done")).toBeTruthy()

    // Verify tool_start uses 'name' not 'tool'
    const toolStartEvent = parsed.find((e) => e.event === "tool_start")
    expect(toolStartEvent).toBeTruthy()
    const toolStartPayload = toolStartEvent!.data as Record<string, unknown>
    expect("name" in toolStartPayload).toBeTruthy()
    expect(!("tool" in toolStartPayload)).toBeTruthy()

    // Verify tool_result uses 'name' not 'tool'
    const toolResultEvent = parsed.find((e) => e.event === "tool_result")
    expect(toolResultEvent).toBeTruthy()
    const toolResultPayload = toolResultEvent!.data as Record<string, unknown>
    expect("name" in toolResultPayload).toBeTruthy()
    expect(!("tool" in toolResultPayload)).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming retrieval safety gate blocks tools for hello", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: "Hello! How can I help?", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "hello",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should NOT have tool events for hello
    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    expect(toolStartEvents.length).toBe(0)

    // Verify request had empty tools
    const requestBody = parseRequestBody(mockFetch.requests[0])
    expect(requestBody.tools).toEqual([])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming allows tools for substantive query", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "PAR dorm" } },
      ],
      stream: true,
    },
    { content: "PAR has...", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are PAR dorm dining options?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events

    // Should have tool events for substantive query
    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    expect(toolStartEvents.length).toBe(1)

    // Verify request had tools
    const requestBody = parseRequestBody(mockFetch.requests[0])
    // eslint-disable-next-line vitest/no-conditional-in-test -- checking optional field existence
    expect(requestBody.tools && requestBody.tools.length > 0).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})
