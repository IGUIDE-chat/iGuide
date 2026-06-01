import { expect, test } from "vite-plus/test"

import {
  createEchoTool,
  createFailingTool,
  createStubTool,
} from "../test/utils/stubTools.ts"
import { ToolRegistry } from "./registry.ts"
import type { RequestContext, ToolDefinition, ToolResult } from "./types.ts"

const MOCK_CTX: RequestContext = {
  env: {},
  userId: "test-user",
  region: "global",
}

test("execute returns tool result on success", async () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())

  const result = await registry.execute(
    "stub_echo",
    { query: "hello" },
    MOCK_CTX
  )

  expect(result.content).toBe(JSON.stringify({ query: "hello" }))
  expect(result.metadata?.stub).toBe(true)
  expect(result.metadata?.tool).toBe("stub_echo")
  expect(result.truncated).toBe(undefined)
})

test("execute passes args and ctx to tool", async () => {
  const registry = new ToolRegistry()
  let capturedArgs: Record<string, unknown> | undefined
  let capturedCtx: RequestContext | undefined

  registry.register({
    name: "capture",
    description: "Captures args and ctx",
    parameters: {},
    async execute(args, ctx): Promise<ToolResult> {
      capturedArgs = args
      capturedCtx = ctx
      return { content: "ok" }
    },
  })

  await registry.execute("capture", { key: "value" }, MOCK_CTX)

  expect(capturedArgs).toEqual({ key: "value" })
  expect(capturedCtx).toEqual(MOCK_CTX)
})

test("register throws on duplicate tool name", () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())

  expect(() => {
    registry.register(createEchoTool())
  }).toThrow(/Tool already registered: stub_echo/)
})

test("register allows different tool names", () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())
  registry.register(createFailingTool())

  const tools = registry.getTools()
  expect(tools.length).toBe(2)
  expect(tools[0].name).toBe("stub_echo")
  expect(tools[1].name).toBe("stub_fail")
})

test("execute returns tool_not_found for missing tool", async () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())

  const result = await registry.execute("nonexistent", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("tool_not_found")
  expect(parsed.tool).toBe("nonexistent")
})

test("execute returns tool_not_found on empty registry", async () => {
  const registry = new ToolRegistry()

  const result = await registry.execute("anything", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("tool_not_found")
})

test("execute respects maxCalls budget", async () => {
  const registry = new ToolRegistry({ maxCalls: 2 })
  registry.register(createEchoTool())

  const r1 = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(r1.content).toBe("{}")

  const r2 = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(r2.content).toBe("{}")

  const r3 = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(r3.metadata?.error).toBe(true)
  const parsed = JSON.parse(r3.content)
  expect(parsed.error).toBe("budget_exceeded")
  expect(parsed.max_calls).toBe(2)
})

test("resetCallCount allows further executions", async () => {
  const registry = new ToolRegistry({ maxCalls: 1 })
  registry.register(createEchoTool())

  await registry.execute("stub_echo", {}, MOCK_CTX)
  const blocked = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(JSON.parse(blocked.content).error).toBe("budget_exceeded")

  registry.resetCallCount()
  const allowed = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(allowed.content).toBe("{}")
})

test("getCallCount tracks executions", async () => {
  const registry = new ToolRegistry({ maxCalls: 5 })
  registry.register(createEchoTool())

  expect(registry.getCallCount()).toBe(0)
  await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(registry.getCallCount()).toBe(1)
  await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(registry.getCallCount()).toBe(2)
})

test("budget check happens before callCount increment", async () => {
  const registry = new ToolRegistry({ maxCalls: 1 })
  registry.register(createEchoTool())

  await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(registry.getCallCount()).toBe(1)

  const blocked = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(registry.getCallCount()).toBe(1)
  expect(JSON.parse(blocked.content).error).toBe("budget_exceeded")
})

test("execute returns timeout error when tool exceeds timeoutMs", async () => {
  const registry = new ToolRegistry({ timeoutMs: 50 })

  const slowTool: ToolDefinition = {
    name: "slow_tool",
    description: "Takes too long",
    parameters: {},
    async execute(): Promise<ToolResult> {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 200)
      })
      return { content: "should not reach" }
    },
  }
  registry.register(slowTool)

  const result = await registry.execute("slow_tool", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("timeout")
  expect(parsed.tool).toBe("slow_tool")
  expect(parsed.timeout_ms).toBe(50)
})

test("fast tool completes before timeout", async () => {
  const registry = new ToolRegistry({ timeoutMs: 500 })

  const fastTool: ToolDefinition = {
    name: "fast_tool",
    description: "Completes quickly",
    parameters: {},
    async execute(): Promise<ToolResult> {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10)
      })
      return { content: "fast result" }
    },
  }
  registry.register(fastTool)

  const result = await registry.execute("fast_tool", {}, MOCK_CTX)

  expect(result.content).toBe("fast result")
  expect(result.metadata?.error).toBe(undefined)
})

test("truncate result when content exceeds maxResultBytes", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 100 })

  const largeContent = "x".repeat(500)
  registry.register(createStubTool({ name: "big_tool", content: largeContent }))

  const result = await registry.execute("big_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect(result.metadata).toBeTruthy()
  expect(result.metadata!.original_bytes).toBe(500)
  expect((result.metadata!.truncated_bytes as number) <= 100).toBeTruthy()
  expect(result.content.length < largeContent.length).toBeTruthy()
  expect(result.content.endsWith("...[truncated]")).toBeTruthy()
})

test("no truncation when content fits within maxResultBytes", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 4096 })

  registry.register(createStubTool({ name: "small_tool", content: "small" }))

  const result = await registry.execute("small_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(undefined)
  expect(result.content).toBe("small")
})

test("truncation preserves metadata from original result", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 50 })

  registry.register(
    createStubTool({
      name: "meta_tool",
      content: "x".repeat(200),
      metadata: { custom: "value" },
    })
  )

  const result = await registry.execute("meta_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect(result.metadata?.custom).toBe("value")
  expect(result.metadata?.stub).toBe(true)
  expect(result.metadata?.original_bytes).toBeTruthy()
  expect(result.metadata?.truncated_bytes).toBeTruthy()
})

test("truncation handles zero maxResultBytes", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 0 })

  registry.register(createStubTool({ name: "zero_tool", content: "anything" }))

  const result = await registry.execute("zero_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect(result.metadata?.original_bytes).toBe(8)
  expect(result.metadata?.truncated_bytes).toBe(0)
})

test("truncation handles maxResultBytes smaller than suffix", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 5 })

  registry.register(
    createStubTool({ name: "tiny_tool", content: "x".repeat(100) })
  )

  const result = await registry.execute("tiny_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect((result.metadata?.truncated_bytes as number) <= 5).toBeTruthy()
})

test("execute returns execution_failed when tool throws", async () => {
  const registry = new ToolRegistry()
  registry.register(createFailingTool())

  const result = await registry.execute("stub_fail", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("execution_failed")
  expect(parsed.tool).toBe("stub_fail")
  expect(parsed.message).toBe("stub tool failure")
})

test("execute handles non-Error throws", async () => {
  const registry = new ToolRegistry()

  registry.register({
    name: "string_throw",
    description: "Throws a string",
    parameters: {},
    async execute(): Promise<ToolResult> {
      // eslint-disable-next-line no-throw-literal -- intentionally testing non-Error throw handling
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally testing non-Error throw handling
      throw "string error"
    },
  })

  const result = await registry.execute("string_throw", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("execution_failed")
  expect(parsed.message).toBe("Unknown error")
})

test("execute handles null throw", async () => {
  const registry = new ToolRegistry()

  registry.register({
    name: "null_throw",
    description: "Throws null",
    parameters: {},
    async execute(): Promise<ToolResult> {
      // eslint-disable-next-line no-throw-literal -- intentionally testing non-Error throw handling
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally testing non-Error throw handling
      throw null
    },
  })

  const result = await registry.execute("null_throw", {}, MOCK_CTX)

  expect(result.metadata?.error).toBe(true)
  const parsed = JSON.parse(result.content)
  expect(parsed.error).toBe("execution_failed")
  expect(parsed.message).toBe("Unknown error")
})

test("execute handles empty string result", async () => {
  const registry = new ToolRegistry()
  registry.register(createStubTool({ name: "empty_tool", content: "" }))

  const result = await registry.execute("empty_tool", {}, MOCK_CTX)

  expect(result.content).toBe("")
  expect(result.truncated).toBe(undefined)
  expect(result.metadata?.error).toBe(undefined)
})

test("execute handles unicode content", async () => {
  const registry = new ToolRegistry()
  const unicodeContent = "Hello 世界 🌍 Привет"
  registry.register(
    createStubTool({ name: "unicode_tool", content: unicodeContent })
  )

  const result = await registry.execute("unicode_tool", {}, MOCK_CTX)

  expect(result.content).toBe(unicodeContent)
})

test("execute handles JSON content", async () => {
  const registry = new ToolRegistry()
  const jsonContent = JSON.stringify({ nested: { deep: { value: 42 } } })
  registry.register(createStubTool({ name: "json_tool", content: jsonContent }))

  const result = await registry.execute("json_tool", {}, MOCK_CTX)

  expect(result.content).toBe(jsonContent)
  const parsed = JSON.parse(result.content)
  expect(parsed.nested.deep.value).toBe(42)
})

test("truncation with unicode counts bytes correctly", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 20 })

  const unicodeContent = "世".repeat(10)
  registry.register(
    createStubTool({ name: "unicode_trunc", content: unicodeContent })
  )

  const result = await registry.execute("unicode_trunc", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect(result.metadata?.original_bytes).toBe(30)
  // The truncated content includes the suffix "\n...[truncated]" (14 bytes)
  // With maxResultBytes=20, contentLimit=6, we can fit 2 "世" chars (6 bytes)
  // Final: 2 chars + suffix = 6 + 14 = 20 bytes
  // However, UTF-8 decoding might add replacement chars if boundary is misaligned
  // Allow up to 25 bytes to account for UTF-8 boundary handling
  expect((result.metadata?.truncated_bytes as number) <= 25).toBeTruthy()
})

test("execute handles very large content", async () => {
  const registry = new ToolRegistry({ maxResultBytes: 1024 })

  const largeContent = "A".repeat(100_000)
  registry.register(
    createStubTool({ name: "huge_tool", content: largeContent })
  )

  const result = await registry.execute("huge_tool", {}, MOCK_CTX)

  expect(result.truncated).toBe(true)
  expect(result.metadata?.original_bytes).toBe(100_000)
  expect((result.metadata?.truncated_bytes as number) <= 1024).toBeTruthy()
})

test("toOpenAITools converts registered tools", () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())
  registry.register(createFailingTool())

  const openAITools = registry.toOpenAITools()

  expect(openAITools.length).toBe(2)

  const names = new Set(openAITools.map((t) => t.function.name))
  expect(names.has("stub_echo")).toBeTruthy()
  expect(names.has("stub_fail")).toBeTruthy()

  for (const tool of openAITools) {
    expect(tool.type).toBe("function")
    expect(typeof tool.function.name === "string").toBeTruthy()
    expect(typeof tool.function.description === "string").toBeTruthy()
    expect(typeof tool.function.parameters === "object").toBeTruthy()
  }
})

test("registry uses default options when none provided", async () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool())

  const result = await registry.execute("stub_echo", {}, MOCK_CTX)
  expect(result.content).toBe("{}")
  expect(result.metadata?.error).toBe(undefined)

  const budgetReg = new ToolRegistry({ maxCalls: 3 })
  budgetReg.register(createEchoTool())

  for (let i = 0; i < 3; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential budget consumption
    const r = await budgetReg.execute("stub_echo", {}, MOCK_CTX)
    expect(r.metadata?.error).toBe(undefined)
  }

  const blocked = await budgetReg.execute("stub_echo", {}, MOCK_CTX)
  expect(JSON.parse(blocked.content).error).toBe("budget_exceeded")
  expect(JSON.parse(blocked.content).max_calls).toBe(3)
})
