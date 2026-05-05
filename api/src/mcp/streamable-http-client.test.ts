import test from 'node:test'

import { createMCPToolWrapper } from './adapter.ts'
import { StreamableHttpMCPClient } from './streamable-http-client.ts'

type TestCase = {
  name: string
  run: () => Promise<void> | void
}

type FetchStub = typeof fetch

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function withMockFetch(
  stub: FetchStub,
  run: () => Promise<void>
): Promise<void> {
  const originalFetch = globalThis.fetch
  globalThis.fetch = stub

  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

const tests: TestCase[] = [
  {
    name: 'test() sends initialize request and returns latency on success',
    async run() {
      await withMockFetch(
        async (input, init) => {
          assert(input === 'https://example.com/mcp', 'unexpected test URL')
          assert(init?.method === 'POST', 'expected POST request')
          assert(
            init?.headers &&
              typeof init.headers === 'object' &&
              'Content-Type' in init.headers,
            'expected content-type header'
          )

          const body = JSON.parse(String(init?.body))
          assert(body.method === 'initialize', 'expected initialize method')
          assert(
            body.params?.protocolVersion === '2024-11-05',
            'expected protocol version'
          )

          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                serverInfo: { name: 'demo', version: '1.0.0' },
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const result = await client.test('https://example.com/mcp')

          assert(result.success, 'expected initialize success')
          assert(result.failure_reason === null, 'unexpected failure reason')
          assert(result.latency_ms !== null, 'expected latency')
        }
      )
    },
  },
  {
    name: 'test() maps auth responses to auth_required',
    async run() {
      await withMockFetch(
        async () => new Response('denied', { status: 401 }),
        async () => {
          const client = new StreamableHttpMCPClient()
          const result = await client.test('https://example.com/mcp')
          assert(!result.success, 'expected initialize failure')
          assert(
            result.failure_reason === 'auth_required',
            'expected auth_required failure reason'
          )
        }
      )
    },
  },
  {
    name: 'discover() maps tool schemas and rejects empty discovery',
    async run() {
      await withMockFetch(
        async (_input, init) => {
          const body = JSON.parse(String(init?.body))
          if (body.method === 'tools/list') {
            return new Response(
              JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                result: {
                  tools: [
                    {
                      name: 'lookup_housing',
                      description: 'Lookup housing data',
                      inputSchema: {
                        type: 'object',
                        properties: { dorm: { type: 'string' } },
                      },
                    },
                  ],
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: { capabilities: {} },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const discovery = await client.discover('https://example.com/mcp')

          assert(discovery.success, 'expected discovery success')
          assert(discovery.tools.length === 1, 'expected one discovered tool')
          assert(
            discovery.tools[0]?.parameters &&
              typeof discovery.tools[0].parameters === 'object',
            'expected mapped parameters'
          )
        }
      )

      await withMockFetch(
        async (_input, init) => {
          const body = JSON.parse(String(init?.body))
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result:
                body.method === 'tools/list'
                  ? { tools: [] }
                  : { capabilities: {} },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const discovery = await client.discover('https://example.com/mcp')
          assert(!discovery.success, 'expected discovery failure')
          assert(
            discovery.failure_reason === 'no_tools_discovered',
            'expected empty discovery failure reason'
          )
        }
      )
    },
  },
  {
    name: 'call() maps content blocks to ToolResult and wrapper surfaces failures',
    async run() {
      await withMockFetch(
        async (_input, init) => {
          const body = JSON.parse(String(init?.body))
          if (body.method === 'tools/call') {
            assert(
              body.params?.name === 'lookup_housing',
              'expected tool name in call payload'
            )

            return new Response(
              JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                result: {
                  content: [
                    { type: 'text', text: 'Allen Hall' },
                    { type: 'image', url: 'https://example.com/a.png' },
                  ],
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: { capabilities: {} },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const callResult = await client.call(
            'https://example.com/mcp',
            'lookup_housing',
            { dorm: 'Allen Hall' }
          )

          assert(callResult.success, 'expected successful tool call')
          assert(
            callResult.tool_result?.content ===
              'Allen Hall\n{"type":"image","url":"https://example.com/a.png"}',
            'expected mapped tool content'
          )

          const wrapped = createMCPToolWrapper(
            {
              url: 'https://example.com/mcp',
              name: 'lookup_housing',
              description: 'Lookup housing',
              parameters: { type: 'object' },
            },
            {
              async test() {
                throw new Error('not used')
              },
              async discover() {
                throw new Error('not used')
              },
              async call() {
                return {
                  success: false,
                  failure_reason: 'timeout',
                  error_message: 'MCP timed out',
                  latency_ms: 10000,
                  tool_result: null,
                }
              },
            }
          )

          const wrappedResult = await wrapped.execute({}, { env: {} })
          assert(
            wrappedResult.content.includes('"failure_reason":"timeout"'),
            'expected wrapper to surface adapter failure'
          )
        }
      )
    },
  },
  {
    name: 'test() maps aborted requests to timeout',
    async run() {
      await withMockFetch(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const error = new Error('aborted')
              error.name = 'AbortError'
              reject(error)
            })
          }),
        async () => {
          const client = new StreamableHttpMCPClient({ timeoutMs: 1 })
          const result = await client.test('https://example.com/mcp')
          assert(!result.success, 'expected timeout failure')
          assert(
            result.failure_reason === 'timeout',
            'expected timeout failure reason'
          )
        }
      )
    },
  },
]

for (const testCase of tests) {
  test(testCase.name, testCase.run)
}
