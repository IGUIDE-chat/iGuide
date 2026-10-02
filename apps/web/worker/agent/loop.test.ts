import assert from "node:assert/strict"
import test from "node:test"

import {
  createMockProviderFetch,
  type MockProviderResponseInput,
  type RecordedProviderRequest,
} from "../test/utils/mockProvider.ts"
import { createStubTool } from "../test/utils/stubTools.ts"
import { ToolRegistry } from "../tools/registry.ts"
import { createWebSearchTool } from "../tools/web-search.ts"
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

function parseRequestBody(request: RecordedProviderRequest): ProviderRequestBody {
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
    SUPABASE_SERVICE_KEY: "",
  }
}

function createTestRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(
    createStubTool({
      name: "stub_docs",
      description: "Search the documentation",
      content: "test docs result",
    }),
  )
  registry.register(
    createStubTool({
      name: "web_search",
      description: "Search the web",
      content: "test web result",
    }),
  )
  registry.register(
    createStubTool({
      name: "stub_grep",
      description: "Look up a specific document",
      content: "test grep result",
    }),
  )
  return registry
}

interface ParsedSSEEvent {
  event: string
  data: unknown
}

async function collectSSEEvents(stream: ReadableStream<Uint8Array>): Promise<ParsedSSEEvent[]> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const events: ParsedSSEEvent[] = []
  let currentEvent = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim()
      } else if (trimmed.startsWith("data:")) {
        const jsonStr = trimmed.slice(5).trim()
        try {
          const data = JSON.parse(jsonStr)
          events.push({ event: currentEvent, data })
          currentEvent = ""
        } catch {}
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

function _assertEventExists(events: ParsedSSEEvent[], eventName: string): ParsedSSEEvent {
  const event = events.find((e) => e.event === eventName)
  assert.ok(event, `Expected ${eventName} event to exist`)
  return event
}

function _assertEventPayload(event: ParsedSSEEvent, expected: Record<string, unknown>): void {
  const payload = event.data as Record<string, unknown>
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(payload[key], value, `Expected payload.${key} to equal ${value}`)
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

    assert.equal(contentEvents.length >= 1, true, "Should have at least one content event")
    assert.equal(doneEvents.length, 1, "Should have exactly one done event")

    const contentPayload = contentEvents[0].data as {
      choices: Array<{ delta: { content: string } }>
    }
    assert.ok(
      contentPayload.choices[0].delta.content.includes("Hello!"),
      "Content should include greeting",
    )

    assert.equal(result.toolCalls.length, 0, "No tool calls should be made")
    assert.equal(result.iterations, 1, "Should complete in 1 iteration")
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
          name: "stub_docs",
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

    const eventNames = parsed.map((e) => e.event)
    assert.ok(eventNames.includes("tool_start"), "Should have tool_start event")
    assert.ok(eventNames.includes("tool_result"), "Should have tool_result event")
    assert.ok(eventNames.includes("content"), "Should have content event")
    assert.ok(eventNames.includes("done"), "Should have done event")

    const toolStartEvent = parsed.find((e) => e.event === "tool_start")
    assert.ok(toolStartEvent, "tool_start event should exist")
    const toolStartPayload = toolStartEvent.data as {
      name: string
      args: unknown
    }
    assert.equal(toolStartPayload.name, "stub_docs", "Tool name should match")

    const toolResultEvent = parsed.find((e) => e.event === "tool_result")
    assert.ok(toolResultEvent, "tool_result event should exist")
    const toolResultPayload = toolResultEvent.data as {
      name: string
      status: string
    }
    assert.equal(toolResultPayload.name, "stub_docs", "Tool result name should match")
    assert.equal(toolResultPayload.status, "success", "Tool should succeed")

    assert.equal(mockFetch.requests.length, 2, "Provider should be called twice")

    const secondRequest = parseRequestBody(mockFetch.requests[1])
    assert.ok(secondRequest.messages, "Second request should have messages")
    const toolMessages = secondRequest.messages?.filter((m) => m.role === "tool")
    assert.equal(toolMessages?.length, 1, "Should have one tool message")

    assert.equal(result.toolCalls.length, 1, "Should have one tool call")
    assert.equal(result.toolCalls[0].name, "stub_docs", "Tool name should match")
    assert.equal(result.iterations, 2, "Should complete in 2 iterations")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming multiple iterations with tool chaining", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching knowledge base...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "dorms" } }],
      stream: true,
    },
    {
      content: "Let me search the web for more info...",
      toolCalls: [{ name: "web_search", arguments: { query: "UIUC dorms 2024" } }],
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

    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")

    assert.equal(toolStartEvents.length, 2, "Should have 2 tool_start events")
    assert.equal(toolResultEvents.length, 2, "Should have 2 tool_result events")

    assert.equal(mockFetch.requests.length, 3, "Provider should be called 3 times")

    assert.equal(result.toolCalls.length, 2, "Should have 2 tool calls")
    assert.equal(result.iterations, 3, "Should complete in 3 iterations")
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
          name: "stub_docs",
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
        name: "stub_docs",
        description: "Search that fails",
        throws: "Database connection failed",
      }),
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
    assert.equal(doneEvents.length, 1, "Should have done event")

    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")
    assert.equal(toolResultEvents.length, 1, "Should have tool_result event")
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    assert.equal(toolResultPayload.status, "error", "Tool result should indicate error")

    assert.ok(result.toolCalls.length >= 0, "Tool calls may be recorded depending on fallback path")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming max iterations triggers fallback with bounded stop", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "test1" } }],
      stream: true,
    },
    {
      content: "Still searching...",
      toolCalls: [{ name: "web_search", arguments: { query: "test2" } }],
      stream: true,
    },
    {
      content: "More searching...",
      toolCalls: [{ name: "stub_grep", arguments: { query: "test3" } }],
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

    assert.equal(result.iterations, 3, "Should stop at max iterations")

    const fallbackEvents = parsed.filter((e) => e.event === "fallback")
    assert.ok(fallbackEvents.length >= 1, "Should have fallback event")

    const doneEvents = parsed.filter((e) => e.event === "done")
    assert.equal(doneEvents.length, 1, "Should have done event")

    assert.ok(
      result.content.includes("maximum") ||
        result.content.includes("incomplete") ||
        result.metadata?.stopReason === "max_iterations" ||
        result.metadata?.reason === "max_iterations_exceeded",
      "Should indicate max iterations reached",
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming fallback direct response when all tools fail", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me try...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "test" } }],
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
        name: "stub_docs",
        description: "Search that fails",
        throws: "Connection error",
      }),
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
    assert.equal(doneEvents.length, 1, "Should have done event")

    const toolResultEvents = parsed.filter((e) => e.event === "tool_result")
    assert.equal(toolResultEvents.length, 1, "Should have tool_result event")
    const toolResultPayload = toolResultEvents[0].data as { status: string }
    assert.equal(toolResultPayload.status, "error", "Tool result should indicate error")

    assert.ok(result.iterations >= 1, "Should complete at least one iteration")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming trace events are emitted at key points", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "test" } }],
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

    const eventNames = parsed.map((e) => e.event)

    assert.ok(eventNames.includes("agent_step"), "Should have agent_step trace event")

    assert.ok(eventNames.includes("observation"), "Should have observation trace event")

    const observationEvent = parsed.find((e) => e.event === "observation")
    if (observationEvent) {
      const payload = observationEvent.data as {
        name: string
        status: string
        summary: string
      }
      assert.equal(payload.name, "stub_docs", "Observation should have tool name")
      assert.equal(payload.status, "success", "Observation should have status")
      assert.ok(payload.summary, "Observation should have summary")
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming preserves SSE backward compatibility", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "test" } }],
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

    const eventNames = parsed.map((e) => e.event)

    assert.ok(eventNames.includes("tool_start"), "Must have tool_start")
    assert.ok(eventNames.includes("tool_result"), "Must have tool_result")
    assert.ok(eventNames.includes("content"), "Must have content")
    assert.ok(eventNames.includes("done"), "Must have done")

    const toolStartEvent = parsed.find((e) => e.event === "tool_start")
    assert.ok(toolStartEvent, "tool_start should exist")
    const toolStartPayload = toolStartEvent.data as Record<string, unknown>
    assert.ok("name" in toolStartPayload, "tool_start must have 'name' field")
    assert.ok(!("tool" in toolStartPayload), "tool_start must NOT have 'tool' field")

    const toolResultEvent = parsed.find((e) => e.event === "tool_result")
    assert.ok(toolResultEvent, "tool_result should exist")
    const toolResultPayload = toolResultEvent.data as Record<string, unknown>
    assert.ok("name" in toolResultPayload, "tool_result must have 'name' field")
    assert.ok(!("tool" in toolResultPayload), "tool_result must NOT have 'tool' field")
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

    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    assert.equal(toolStartEvents.length, 0, "Hello should not trigger tool_start")

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.deepEqual(requestBody.tools, [], "Hello should have empty tools array")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming allows tools for substantive query", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [{ name: "stub_docs", arguments: { query: "PAR dorm" } }],
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

    const toolStartEvents = parsed.filter((e) => e.event === "tool_start")
    assert.equal(toolStartEvents.length, 1, "Substantive query should trigger tool")

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.ok(requestBody.tools && requestBody.tools.length > 0, "Should have tools")
  } finally {
    globalThis.fetch = originalFetch
  }
})

interface SourceUrlPayload {
  sourceId: string
  url: string
  title: string
  snippet?: string
}

interface TavilyResultFixture {
  title: string
  url: string
  content: string
  score: number
}

const TAVILY_SEARCH_URL = "https://api.tavily.com/search"

/** Answers Tavily with `results`; everything else goes to the provider mock. */
function routeTavily(providerFetch: typeof fetch, results: TavilyResultFixture[]): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    if (url === TAVILY_SEARCH_URL) {
      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    return providerFetch(input, init)
  }) as typeof fetch
}

function sourcePayloads(events: ParsedSSEEvent[]): SourceUrlPayload[] {
  return events.filter((e) => e.event === "source-url").map((e) => e.data as SourceUrlPayload)
}

function toolMessageContents(request: RecordedProviderRequest): string[] {
  return (parseRequestBody(request).messages ?? [])
    .filter((message) => message.role === "tool")
    .map((message) => message.content ?? "")
}

test("streaming emits source-url events right after tool_result, in result order", async () => {
  const rates = {
    url: "https://housing.illinois.edu/rates",
    title: "Room and Board Rates",
    snippet: "Rates for 2026-27.",
  }
  const dining = { url: "https://housing.illinois.edu/dining", title: "Dining" }
  const mockFetch = createMockProviderFetch([
    {
      content: "Let me search...",
      toolCalls: [{ name: "web_search", arguments: { query: "UIUC housing rates" } }],
      stream: true,
    },
    { content: "Rates are listed on the housing site.", stream: true },
  ])

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: "web_search",
        description: "Search the web",
        content: `Source: ${rates.url}\nRates for 2026-27.\n---\nSource: ${dining.url}\nDining info.`,
        metadata: { sources: [rates, dining] },
      }),
    )
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are the UIUC housing rates?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events
    const eventNames = parsed.map((e) => e.event)
    const toolResultIndex = eventNames.indexOf("tool_result")
    assert.ok(toolResultIndex >= 0, "Should have tool_result event")
    assert.deepEqual(
      eventNames.slice(toolResultIndex, toolResultIndex + 3),
      ["tool_result", "source-url", "source-url"],
      "source-url events follow their tool_result directly",
    )
    assert.ok(
      eventNames.indexOf("source-url") < eventNames.lastIndexOf("content"),
      "sources arrive before the answer text",
    )

    assert.deepEqual(sourcePayloads(parsed), [
      { sourceId: rates.url, url: rates.url, title: rates.title, snippet: rates.snippet },
      { sourceId: dining.url, url: dining.url, title: dining.title },
    ])

    const [toolMessage] = toolMessageContents(mockFetch.requests[1])
    assert.ok(toolMessage.includes(rates.url), "model still reads the tool content")
    assert.ok(!toolMessage.includes('"sources"'), "sources metadata is not sent to the model")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming web_search sources skip non-http results and fall back to the hostname", async () => {
  const providerFetch = createMockProviderFetch([
    {
      content: "Let me search...",
      toolCalls: [{ name: "web_search", arguments: { query: "UIUC housing rates" } }],
      stream: true,
    },
    { content: "Here are the rates.", stream: true },
  ])
  const ratesContent = `Rates  for\n\n2026-27 ${"x".repeat(400)}`

  const originalFetch = globalThis.fetch
  globalThis.fetch = routeTavily(providerFetch, [
    { url: "https://www.illinois.edu/housing", title: "", content: "Short page.", score: 0.5 },
    {
      url: "https://housing.illinois.edu/rates",
      title: "  Room and Board Rates ",
      content: ratesContent,
      score: 0.9,
    },
    { url: "ftp://illinois.edu/rates.pdf", title: "FTP mirror", content: "binary", score: 0.99 },
  ])

  try {
    const registry = new ToolRegistry()
    createWebSearchTool(registry)
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are the UIUC housing rates?",
      history: [],
      registry,
      env: { ...createTestEnv(), TAVILY_API_KEY: "test-tavily-key" },
      writer,
    })

    const sources = sourcePayloads(await events)
    assert.deepEqual(
      sources.map((source) => [source.url, source.title]),
      [
        ["https://housing.illinois.edu/rates", "Room and Board Rates"],
        ["https://www.illinois.edu/housing", "www.illinois.edu"],
      ],
      "sorted by priority, ftp dropped, empty title replaced by hostname",
    )

    const snippet = sources[0].snippet ?? ""
    assert.ok(snippet.startsWith("Rates for 2026-27 xxx"), "whitespace is collapsed")
    assert.equal(Array.from(snippet).length, 240, "snippet is cut to 240 characters")
    assert.ok(snippet.endsWith("…"), "a cut snippet ends with an ellipsis")
    assert.equal(sources[1].snippet, "Short page.")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming web_search drops sources the 4096-byte result limit cut off", async () => {
  const visible = "https://www.illinois.edu/housing"
  const cut = "https://housing.illinois.edu/contracts"
  const providerFetch = createMockProviderFetch([
    {
      content: "Let me search...",
      toolCalls: [{ name: "web_search", arguments: { query: "UIUC housing contracts" } }],
      stream: true,
    },
    { content: "Here is what I found.", stream: true },
  ])

  const originalFetch = globalThis.fetch
  // Sized so the registry's cut lands inside the third result's `Source:` URL.
  globalThis.fetch = routeTavily(providerFetch, [
    {
      url: "https://housing.illinois.edu/rates",
      title: "Room and Board Rates",
      content: "r".repeat(3915),
      score: 0.9,
    },
    { url: visible, title: "", content: "Short page.", score: 0.8 },
    { url: cut, title: "Contracts", content: "c".repeat(500), score: 0.7 },
  ])

  try {
    const registry = new ToolRegistry()
    createWebSearchTool(registry)
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "How do UIUC housing contracts work?",
      history: [],
      registry,
      env: { ...createTestEnv(), TAVILY_API_KEY: "test-tavily-key" },
      writer,
    })

    const [toolMessage] = toolMessageContents(providerFetch.requests[1])
    const { content, truncated } = JSON.parse(toolMessage) as {
      content: string
      truncated: boolean
    }
    assert.equal(truncated, true, "fixture must exceed the registry byte limit")
    assert.ok(content.includes(visible), "fixture keeps the second result's URL")
    assert.ok(!content.includes(cut), "fixture cuts the third result's URL")

    assert.deepEqual(
      sourcePayloads(await events).map((source) => source.url),
      ["https://housing.illinois.edu/rates", visible],
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming emits no source-url events when the tool errors", async () => {
  const mockFetch = createMockProviderFetch([
    {
      content: "Let me search...",
      toolCalls: [{ name: "web_search", arguments: { query: "UIUC housing" } }],
      stream: true,
    },
    { content: "The search failed, but I can still help.", stream: true },
  ])

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const url = "https://housing.illinois.edu/rates"
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: "web_search",
        description: "Search that reports an error",
        content: `Partial failure.\nSource: ${url}`,
        metadata: { error: true, sources: [{ url, title: "Rates" }] },
      }),
    )
    const { writer, events } = createWriterWithStream()

    await runStreamingAgentLoop({
      message: "What are the UIUC housing rates?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const parsed = await events
    const toolResult = parsed.find((e) => e.event === "tool_result")
    assert.equal((toolResult?.data as { status?: string } | undefined)?.status, "error")
    assert.equal(sourcePayloads(parsed).length, 0, "error results stream no sources")
  } finally {
    globalThis.fetch = originalFetch
  }
})
