import { expect, test } from "vite-plus/test"

import { createEchoTool, createFailingTool } from "../test/utils/stubTools.ts"
import { ToolRegistry } from "../tools/registry.ts"
import type {
  RequestContext,
  ToolDefinition,
  ToolResult,
} from "../tools/types.ts"
import { executeToolAction } from "./actions.ts"

const MOCK_CTX: RequestContext = {
  env: {},
  userId: "test-user",
  region: "global",
}

function createToolCall(options: {
  id?: string
  name?: string
  arguments?: string
}) {
  return {
    id: options.id ?? "call_1",
    type: "function" as const,
    function: {
      name: options.name ?? "web_search",
      arguments: options.arguments ?? "{}",
    },
  }
}

test("executeToolAction executes a valid tool call through the registry", async () => {
  const registry = new ToolRegistry()
  let capturedArgs: Record<string, unknown> | undefined
  let capturedCtx: RequestContext | undefined

  const tool: ToolDefinition = {
    name: "web_search",
    description: "Searches the web",
    parameters: {},
    async execute(args, ctx): Promise<ToolResult> {
      capturedArgs = args
      capturedCtx = ctx
      return { content: "UIUC housing search result" }
    },
  }
  registry.register(tool)

  const observation = await executeToolAction({
    toolCall: createToolCall({
      id: "call_1",
      name: "web_search",
      arguments: JSON.stringify({ query: "UIUC housing" }),
    }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 2,
  })

  expect(capturedArgs).toEqual({ query: "UIUC housing" })
  expect(capturedCtx).toBe(MOCK_CTX)
  expect(observation.toolCallId).toBe("call_1")
  expect(observation.toolName).toBe("web_search")
  expect(observation.input).toEqual({ query: "UIUC housing" })
  expect(observation.status).toBe("success")
  expect(observation.summary).toBe("UIUC housing search result")
  expect(observation.stepIndex).toBe(2)
  expect(observation.providerMessage?.tool_call_id).toBe("call_1")
})

test("executeToolAction returns an error observation for invalid JSON arguments", async () => {
  const registry = new ToolRegistry()
  registry.register(createEchoTool("web_search"))

  const observation = await executeToolAction({
    toolCall: createToolCall({
      id: "call_bad_args",
      name: "web_search",
      arguments: '{"query":',
    }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 0,
  })

  expect(observation.toolCallId).toBe("call_bad_args")
  expect(observation.toolName).toBe("web_search")
  expect(observation.input).toEqual({})
  expect(observation.status).toBe("error")
  expect(observation.error?.code).toBe("invalid_arguments")
  expect(observation.summary).toMatch(/JSON|Unexpected|Expected/i)
  expect(JSON.parse(observation.raw)).toEqual({
    error: "invalid_arguments",
    tool: "web_search",
    message: observation.summary,
    raw_arguments: '{"query":',
  })
  expect(registry.getCallCount()).toBe(0)
})

test("executeToolAction returns an error observation for missing tools", async () => {
  const registry = new ToolRegistry()

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: "call_missing", name: "missing_tool" }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  expect(observation.toolCallId).toBe("call_missing")
  expect(observation.toolName).toBe("missing_tool")
  expect(observation.status).toBe("error")
  expect(observation.error?.code).toBe("tool_not_found")
  expect(JSON.parse(observation.raw)).toEqual({
    error: "tool_not_found",
    tool: "missing_tool",
  })
})

test("executeToolAction returns an error observation when a tool throws", async () => {
  const registry = new ToolRegistry()
  registry.register(createFailingTool("web_search"))

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: "call_throw", name: "web_search" }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  expect(observation.toolCallId).toBe("call_throw")
  expect(observation.status).toBe("error")
  expect(observation.error?.code).toBe("execution_failed")
  expect(observation.summary).toBe("stub tool failure")
})

test("executeToolAction returns an error observation when registry budget is exceeded", async () => {
  const registry = new ToolRegistry({ maxCalls: 1 })
  registry.register(createEchoTool("web_search"))

  await executeToolAction({
    toolCall: createToolCall({ id: "call_allowed", name: "web_search" }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 0,
  })

  const observation = await executeToolAction({
    toolCall: createToolCall({ id: "call_budget", name: "web_search" }),
    registry,
    requestContext: MOCK_CTX,
    stepIndex: 1,
  })

  expect(observation.toolCallId).toBe("call_budget")
  expect(observation.status).toBe("error")
  expect(observation.error?.code).toBe("budget_exceeded")
  expect(JSON.parse(observation.raw)).toEqual({
    error: "budget_exceeded",
    max_calls: 1,
  })
})
