import assert from 'node:assert/strict'
import test from 'node:test'

import { runAgentLoop, runStreamingAgentLoop } from './loop.ts'
import { ToolRegistry } from '../tools/registry.ts'
import {
  type MockProviderResponseInput,
  type RecordedProviderRequest,
  createMockProviderFetch,
} from '../test/utils/mockProvider.ts'
import { createStubTool } from '../test/utils/stubTools.ts'

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

function createWriter(): WritableStreamDefaultWriter<string> {
  const stream = new WritableStream<string>()
  return stream.getWriter()
}

test('hello message blocks retrieval tools - no tools in provider request', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Hello! How can I help you today?' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: 'hello',
      history: [],
      registry,
      env: createTestEnv(),
    })

    assert.equal(mockFetch.requests.length, 1, 'Provider should be called once')

    const requestBody = parseRequestBody(mockFetch.requests[0])

    // Conversational gate: tools must be empty array to block retrieval
    assert.deepEqual(
      requestBody.tools,
      [],
      'Hello message should have empty tools array'
    )

    assert.equal(result.content, 'Hello! How can I help you today?')
    assert.equal(result.toolCalls.length, 0, 'No tool calls should be made')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('hi message blocks retrieval tools', async () => {
  const mockResponses: MockProviderResponseInput[] = [{ content: 'Hi there!' }]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    await runAgentLoop({
      message: 'hi',
      history: [],
      registry,
      env: createTestEnv(),
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.deepEqual(
      requestBody.tools,
      [],
      'Hi message should have empty tools array'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('good morning message blocks retrieval tools', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Good morning!' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    await runAgentLoop({
      message: 'good morning',
      history: [],
      registry,
      env: createTestEnv(),
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.deepEqual(
      requestBody.tools,
      [],
      'Good morning should have empty tools array'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('substantive UIUC query exposes all registered tools', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'PAR dorm has several dining options...',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          arguments: { query: 'PAR dorm dining options' },
        },
      ],
    },
    { content: 'Based on the search, PAR offers...' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: 'What are PAR dorm dining options?',
      history: [],
      registry,
      env: createTestEnv(),
    })

    assert.equal(
      mockFetch.requests.length,
      2,
      'Provider should be called twice'
    )

    const firstRequest = parseRequestBody(mockFetch.requests[0])
    assert.ok(firstRequest.tools, 'First request should have tools defined')
    assert.ok(
      firstRequest.tools!.length > 0,
      'First request should have non-empty tools array'
    )

    const toolNames = new Set(firstRequest.tools!.map((t) => t.function.name))
    assert.ok(
      toolNames.has('search_knowledge_base'),
      'Should include search_knowledge_base tool'
    )
    assert.ok(
      toolNames.has('web_search'),
      'Should include web_search tool'
    )
    assert.ok(toolNames.has('grep_docs'), 'Should include grep_docs tool')

    assert.equal(result.toolCalls.length, 1, 'One tool call should be made')
    assert.equal(result.toolCalls[0].name, 'search_knowledge_base')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('housing query exposes tools and can trigger search', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search for ISR dorm information...',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          arguments: { query: 'ISR dorm amenities' },
        },
      ],
    },
    { content: 'ISR dorm features include...' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: 'Tell me about ISR dorm amenities',
      history: [],
      registry,
      env: createTestEnv(),
    })

    const firstRequest = parseRequestBody(mockFetch.requests[0])
    assert.ok(
      firstRequest.tools && firstRequest.tools.length > 0,
      'Substantive query should expose tools'
    )

    assert.equal(result.toolCalls.length, 1)
    assert.equal(result.toolCalls[0].name, 'search_knowledge_base')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('content-only response stops without tool calls', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Here is a direct answer without needing tools.' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: 'What is the capital of Illinois?',
      history: [],
      registry,
      env: createTestEnv(),
    })

    assert.equal(
      mockFetch.requests.length,
      1,
      'Provider should be called once for content-only response'
    )

    assert.equal(result.toolCalls.length, 0, 'No tool calls should be made')
    assert.equal(
      result.content,
      'Here is a direct answer without needing tools.'
    )
    assert.equal(result.iterations, 1, 'Should stop after 1 iteration')
    assert.equal(result.metadata?.stopReason, 'final_answer')
    assert.equal(
      result.metadata?.stopSemanticLabel,
      'final_answer_no_tool_calls'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('max iterations triggers fallback behavior', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Searching...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test' } },
      ],
    },
    {
      content: 'Still searching...',
      toolCalls: [{ name: 'web_search', arguments: { query: 'test' } }],
    },
    {
      content: 'One more search...',
      toolCalls: [{ name: 'grep_docs', arguments: { query: 'test' } }],
    },
    {
      content: 'Final search...',
      toolCalls: [
        { name: 'search_knowledge_base', arguments: { query: 'test' } },
      ],
    },
    { content: 'I reached the maximum tool-call iterations.' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const result = await runAgentLoop({
      message: 'Complex query requiring many searches',
      history: [],
      registry,
      env: createTestEnv(),
      maxIterations: 3,
    })

    assert.equal(result.iterations, 3, 'Should stop at max iterations')

    assert.ok(
      result.content.includes('maximum tool-call iterations'),
      'Should include max iterations disclaimer'
    )
    assert.equal(result.metadata?.stopReason, 'max_iterations')
    assert.equal(result.metadata?.stopSemanticLabel, 'max_iterations_reached')
    assert.equal(result.metadata?.fallbackReason, 'max_iterations_exceeded')

    assert.ok(result.toolCalls.length > 0, 'Should have made some tool calls')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('provider error triggers fallback', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { error: 'Internal server error', status: 500 },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()

    await assert.rejects(
      async () => {
        await runAgentLoop({
          message: 'Test query',
          history: [],
          registry,
          env: createTestEnv(),
        })
      },
      (error: Error) => {
        assert.ok(
          error.message.includes('500') || error.message.includes('error')
        )
        return true
      },
      'Provider error should propagate'
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('tool execution error is captured in result', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Let me search...',
      toolCalls: [
        {
          name: 'search_knowledge_base',
          arguments: { query: 'test' },
        },
      ],
    },
    { content: 'The search failed, but I can still help.' },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = new ToolRegistry()
    registry.register(
      createStubTool({
        name: 'search_knowledge_base',
        description: 'Search the UIUC knowledge base',
        throws: 'Database connection failed',
      })
    )

    const result = await runAgentLoop({
      message: 'What are the dorm options?',
      history: [],
      registry,
      env: createTestEnv(),
    })

    assert.equal(result.toolCalls.length, 1, 'One tool call should be recorded')
    assert.equal(result.toolCalls[0].result.metadata?.error, true)
    assert.equal(result.content, 'The search failed, but I can still help.')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming hello blocks retrieval tools', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    { content: 'Hello! How can I help?', stream: true },
  ]
  const mockFetch = createMockProviderFetch(mockResponses)

  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    const registry = createTestRegistry()
    const writer = createWriter()

    const result = await runStreamingAgentLoop({
      message: 'hello',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.deepEqual(
      requestBody.tools,
      [],
      'Streaming hello should have empty tools array'
    )

    assert.equal(result.toolCalls.length, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('streaming substantive query exposes tools', async () => {
  const mockResponses: MockProviderResponseInput[] = [
    {
      content: 'Searching for info...',
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
    const writer = createWriter()

    const result = await runStreamingAgentLoop({
      message: 'What are the dining options at PAR?',
      history: [],
      registry,
      env: createTestEnv(),
      writer,
    })

    const requestBody = parseRequestBody(mockFetch.requests[0])
    assert.ok(
      requestBody.tools && requestBody.tools.length > 0,
      'Streaming substantive query should expose tools'
    )

    assert.equal(result.toolCalls.length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
