import { expect, test } from "vite-plus/test"

import type {
  MockProviderResponseInput,
  RecordedProviderRequest,
} from "../test/utils/mockProvider.ts"
import { createMockProviderFetch } from "../test/utils/mockProvider.ts"
import { createStubTool } from "../test/utils/stubTools.ts"
import { ToolRegistry } from "../tools/registry.ts"
import { runAgentLoop, runStreamingAgentLoop } from "./loop.ts"

interface ProviderRequestBody {
  model?: string
  messages?: Array<{ role: string; content: string | null }>
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

function createWriter(): WritableStreamDefaultWriter<string> {
  const stream = new WritableStream<string>()
  return stream.getWriter()
}

test("hello message blocks retrieval tools - no tools in provider request", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: "Hello! How can I help you today?" },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: "hello",
      history: [],
      registry,
      env: createTestEnv(),
    })

    expect(mockFetch.requests.length).toBe(1)

    const requestBody = parseRequestBody(mockFetch.requests[0])

    // Conversational gate: tools must be empty array to block retrieval
    expect(requestBody.tools).toEqual([])

    expect(result.content).toBe("Hello! How can I help you today?")
    expect(result.toolCalls.length).toBe(0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("substantive UIUC query exposes all registered tools", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "PAR dorm has several dining options...",
      toolCalls: [
        {
          name: "search_knowledge_base",
          arguments: { query: "PAR dorm dining options" },
        },
      ],
    },
    { content: "Based on the search, PAR offers..." },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: "What are PAR dorm dining options?",
      history: [],
      registry,
      env: createTestEnv(),
    })

    expect(mockFetch.requests.length).toBe(2)

    const firstRequest = parseRequestBody(mockFetch.requests[0])
    expect(firstRequest.tools).toBeTruthy()
    expect(firstRequest.tools!.length > 0).toBeTruthy()

    const toolNames = new Set(firstRequest.tools!.map((t) => t.function.name))
    expect(toolNames.has("search_knowledge_base")).toBeTruthy()
    expect(toolNames.has("web_search")).toBeTruthy()
    expect(toolNames.has("grep_docs")).toBeTruthy()

    expect(result.toolCalls.length).toBe(1)
    expect(result.toolCalls[0].name).toBe("search_knowledge_base")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("housing query exposes tools and can trigger search", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search for ISR dorm information...",
      toolCalls: [
        {
          name: "search_knowledge_base",
          arguments: { query: "ISR dorm amenities" },
        },
      ],
    },
    { content: "ISR dorm features include..." },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: "Tell me about ISR dorm amenities",
      history: [],
      registry,
      env: createTestEnv(),
    })

    const firstRequest = parseRequestBody(mockFetch.requests[0])
    // eslint-disable-next-line vitest/no-conditional-in-test -- checking optional field existence
    expect(firstRequest.tools && firstRequest.tools.length > 0).toBeTruthy()

    expect(result.toolCalls.length).toBe(1)
    expect(result.toolCalls[0].name).toBe("search_knowledge_base")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("content-only response stops without tool calls", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: "Here is a direct answer without needing tools." },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: "What is the capital of Illinois?",
      history: [],
      registry,
      env: createTestEnv(),
    })

    expect(mockFetch.requests.length).toBe(1)

    expect(result.toolCalls.length).toBe(0)
    expect(result.content).toBe(
      "Here is a direct answer without needing tools."
    )
    expect(result.iterations).toBe(1)
    expect(result.metadata?.stopReason).toBe("final_answer")
    expect(result.metadata?.stopSemanticLabel).toBe(
      "final_answer_no_tool_calls"
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("max iterations triggers fallback behavior", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test" } },
      ],
    },
    {
      content: "Still searching...",
      toolCalls: [{ name: "web_search", arguments: { query: "test" } }],
    },
    {
      content: "One more search...",
      toolCalls: [{ name: "grep_docs", arguments: { query: "test" } }],
    },
    {
      content: "Final search...",
      toolCalls: [
        { name: "search_knowledge_base", arguments: { query: "test" } },
      ],
    },
    { content: "I reached the maximum tool-call iterations." },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: "Complex query requiring many searches",
      history: [],
      registry,
      env: createTestEnv(),
      maxIterations: 3,
    })

    expect(result.iterations).toBe(3)

    expect(result.content.includes("maximum tool-call iterations")).toBeTruthy()
    expect(result.metadata?.stopReason).toBe("max_iterations")
    expect(result.metadata?.stopSemanticLabel).toBe("max_iterations_reached")
    expect(result.metadata?.fallbackReason).toBe("max_iterations_exceeded")

    expect(result.toolCalls.length > 0).toBeTruthy()
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("provider error triggers fallback", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { error: "Internal server error", status: 500 },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()

    await expect(
      runAgentLoop({
        message: "Test query",
        history: [],
        registry,
        env: createTestEnv(),
      })
    ).rejects.toThrow(/DeepSeek API returned 500/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("tool execution error is captured in result", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Let me search...",
      toolCalls: [
        {
          name: "search_knowledge_base",
          arguments: { query: "test" },
        },
      ],
    },
    { content: "The search failed, but I can still help." },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: "search_knowledge_base",
        description: "Search the UIUC knowledge base",
        throws: "Database connection failed",
      })
    )

    const result = await runAgentLoop({
      message: "What are the dorm options?",
      history: [],
      registry,
      env: createTestEnv(),
    })

    expect(result.toolCalls.length).toBe(1)
    expect(result.toolCalls[0].result.metadata?.error).toBe(true)
    expect(result.content).toBe("The search failed, but I can still help.")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming hello blocks retrieval tools", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: "Hello! How can I help?", stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const writer = createWriter()

    const result = await runStreamingAgentLoop({
      message: "hello",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    expect(requestBody.tools).toEqual([])

    expect(result.toolCalls.length).toBe(0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("streaming substantive query exposes tools", async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: "Searching for info...",
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
    const writer = createWriter()

    const result = await runStreamingAgentLoop({
      message: "What are the dining options at PAR?",
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    // eslint-disable-next-line vitest/no-conditional-in-test -- checking optional field existence
    expect(requestBody.tools && requestBody.tools.length > 0).toBeTruthy()

    expect(result.toolCalls.length).toBe(1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
