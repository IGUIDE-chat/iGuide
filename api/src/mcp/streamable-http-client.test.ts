import { expect, test } from "vite-plus/test"

import { createMCPToolWrapper } from "./adapter.ts"
import { StreamableHttpMCPClient } from "./streamable-http-client.ts"

type TestCase = {
  name: string
  run: () => Promise<void> | void
}

type FetchStub = typeof fetch

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
    name: "test() sends initialize request and returns latency on success",
    async run() {
      await withMockFetch(
        async (input, init) => {
          expect(input === "https://example.com/mcp").toBeTruthy()
          expect(init?.method === "POST").toBeTruthy()
          expect(
            init?.headers &&
              typeof init.headers === "object" &&
              "Content-Type" in init.headers
          ).toBeTruthy()

          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- body may be URL or Request
          const body = JSON.parse(String(init?.body))
          expect(body.method === "initialize").toBeTruthy()
          expect(body.params?.protocolVersion === "2024-11-05").toBeTruthy()

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              result: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                serverInfo: { name: "demo", version: "1.0.0" },
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const result = await client.test("https://example.com/mcp")

          expect(result.success).toBeTruthy()
          expect(result.failure_reason === null).toBeTruthy()
          expect(result.latency_ms !== null).toBeTruthy()
        }
      )
    },
  },
  {
    name: "test() maps auth responses to auth_required",
    async run() {
      await withMockFetch(
        async () => new Response("denied", { status: 401 }),
        async () => {
          const client = new StreamableHttpMCPClient()
          const result = await client.test("https://example.com/mcp")
          expect(!result.success).toBeTruthy()
          expect(result.failure_reason === "auth_required").toBeTruthy()
        }
      )
    },
  },
  {
    name: "discover() maps tool schemas and rejects empty discovery",
    async run() {
      await withMockFetch(
        async (_input, init) => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- body may be URL or Request
          const body = JSON.parse(String(init?.body))
          if (body.method === "tools/list") {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                result: {
                  tools: [
                    {
                      name: "lookup_housing",
                      description: "Lookup housing data",
                      inputSchema: {
                        type: "object",
                        properties: { dorm: { type: "string" } },
                      },
                    },
                  ],
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          }

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              result: { capabilities: {} },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const discovery = await client.discover("https://example.com/mcp")

          expect(discovery.success).toBeTruthy()
          expect(discovery.tools.length === 1).toBeTruthy()
          expect(
            discovery.tools[0]?.parameters &&
              typeof discovery.tools[0].parameters === "object"
          ).toBeTruthy()
        }
      )

      await withMockFetch(
        async (_input, init) => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- body may be URL or Request
          const body = JSON.parse(String(init?.body))
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: body.id,
              result:
                body.method === "tools/list"
                  ? { tools: [] }
                  : { capabilities: {} },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const discovery = await client.discover("https://example.com/mcp")
          expect(!discovery.success).toBeTruthy()
          expect(
            discovery.failure_reason === "no_tools_discovered"
          ).toBeTruthy()
        }
      )
    },
  },
  {
    name: "call() maps content blocks to ToolResult and wrapper surfaces failures",
    async run() {
      await withMockFetch(
        async (_input, init) => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string -- body may be URL or Request
          const body = JSON.parse(String(init?.body))
          if (body.method === "tools/call") {
            expect(body.params?.name === "lookup_housing").toBeTruthy()

            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 3,
                result: {
                  content: [
                    { type: "text", text: "Allen Hall" },
                    { type: "image", url: "https://example.com/a.png" },
                  ],
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          }

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              result: { capabilities: {} },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        },
        async () => {
          const client = new StreamableHttpMCPClient()
          const callResult = await client.call(
            "https://example.com/mcp",
            "lookup_housing",
            { dorm: "Allen Hall" }
          )

          expect(callResult.success).toBeTruthy()
          expect(
            callResult.tool_result?.content ===
              'Allen Hall\n{"type":"image","url":"https://example.com/a.png"}'
          ).toBeTruthy()

          const wrapped = createMCPToolWrapper(
            {
              url: "https://example.com/mcp",
              name: "lookup_housing",
              description: "Lookup housing",
              parameters: { type: "object" },
            },
            {
              async test() {
                throw new Error("not used")
              },
              async discover() {
                throw new Error("not used")
              },
              async call() {
                return {
                  success: false,
                  failure_reason: "timeout",
                  error_message: "MCP timed out",
                  latency_ms: 10_000,
                  tool_result: null,
                }
              },
            }
          )

          const wrappedResult = await wrapped.execute({}, { env: {} })
          expect(
            wrappedResult.content.includes('"failure_reason":"timeout"')
          ).toBeTruthy()
        }
      )
    },
  },
  {
    name: "test() maps aborted requests to timeout",
    async run() {
      await withMockFetch(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("aborted")
              error.name = "AbortError"
              reject(error)
            })
          }),
        async () => {
          const client = new StreamableHttpMCPClient({ timeoutMs: 1 })
          const result = await client.test("https://example.com/mcp")
          expect(!result.success).toBeTruthy()
          expect(result.failure_reason === "timeout").toBeTruthy()
        }
      )
    },
  },
]

for (const testCase of tests) {
  // eslint-disable-next-line vitest/expect-expect, vitest/valid-title -- dynamic test case with assertions
  test(testCase.name, testCase.run)
}
