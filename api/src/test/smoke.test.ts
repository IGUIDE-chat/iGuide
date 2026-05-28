import assert from "node:assert/strict"
import test from "node:test"

import { ToolRegistry } from "../tools/registry.ts"
import { createMockProviderFetch } from "./utils/mockProvider.ts"
import { createEchoTool, createFailingTool } from "./utils/stubTools.ts"

interface MockProviderJSON {
  choices: Array<{
    message: {
      tool_calls: Array<{
        function: {
          name: string
        }
      }>
    }
  }>
}

test("test utilities provide provider responses and executable stub tools", async () => {
  const fetch = createMockProviderFetch([
    {
      content: "lookup needed",
      toolCalls: [
        {
          name: "stub_echo",
          arguments: { query: "Allen Hall" },
        },
      ],
    },
    {
      content: "done",
      stream: true,
    },
  ])

  const jsonResponse = await fetch("https://provider.example/chat", {
    method: "POST",
  })
  assert.equal(jsonResponse.status, 200)
  const json = (await jsonResponse.json()) as MockProviderJSON
  assert.equal(json.choices[0].message.tool_calls[0].function.name, "stub_echo")

  const streamResponse = await fetch("https://provider.example/chat", {
    method: "POST",
    body: JSON.stringify({ stream: true }),
  })
  assert.equal(streamResponse.headers.get("Content-Type"), "text/event-stream")
  assert.ok(streamResponse.body)
  const streamed = await new Response(streamResponse.body).text()
  assert.match(streamed, /data:/)
  assert.match(streamed, /done/)
  assert.match(streamed, /\[DONE\]/)

  const registry = new ToolRegistry()
  registry.register(createEchoTool())
  registry.register(createFailingTool())

  const success = await registry.execute(
    "stub_echo",
    { query: "Allen Hall" },
    { env: {}, userId: "user-1", region: "global" }
  )
  assert.equal(success.content, JSON.stringify({ query: "Allen Hall" }))
  assert.equal(success.metadata?.stub, true)

  const failure = await registry.execute("stub_fail", {}, { env: {} })
  assert.equal(failure.metadata?.error, true)
  assert.match(failure.content, /execution_failed/)
})
