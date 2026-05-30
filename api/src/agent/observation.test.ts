import { expect, test } from "vite-plus/test"

import { buildObservation } from "./observation.ts"

test("buildObservation converts successful tool results into canonical observations", () => {
  const observation = buildObservation({
    toolCallId: "call_123",
    toolName: "search_knowledge_base",
    input: { query: "PAR" },
    result: {
      content: "PAR has multiple dining options.\nSource: housing guide",
    },
    stepIndex: 2,
  })

  expect(observation.toolCallId).toBe("call_123")
  expect(observation.toolName).toBe("search_knowledge_base")
  expect(observation.input).toEqual({ query: "PAR" })
  expect(observation.status).toBe("success")
  expect(observation.summary).toBe("PAR has multiple dining options.")
  expect(observation.output).toBe(
    "PAR has multiple dining options.\nSource: housing guide"
  )
  expect(observation.raw).toBe(
    "PAR has multiple dining options.\nSource: housing guide"
  )
  expect(observation.truncated).toBe(false)
  expect(observation.error).toBe(null)
  expect(observation.stepIndex).toBe(2)
  expect(observation.byteCount).toBe(54)
  expect(observation.originalByteCount).toBe(54)
  expect(observation.truncatedByteCount).toBe(null)
  expect(observation.providerMessage!.role).toBe("tool")
  expect(observation.providerMessage!.tool_call_id).toBe("call_123")
  expect(observation.providerMessage!.content).toBe(
    "PAR has multiple dining options.\nSource: housing guide"
  )
})

test("buildObservation preserves error result diagnostics", () => {
  const observation = buildObservation({
    toolCallId: "call_error",
    toolName: "grep_docs",
    input: { pattern: "housing" },
    result: {
      content: JSON.stringify({
        error: "execution_failed",
        tool: "grep_docs",
        message: "permission denied",
      }),
      metadata: { error: true },
    },
    stepIndex: 0,
  })

  expect(observation.status).toBe("error")
  expect(observation.summary).toBe("permission denied")
  expect(observation.error).toEqual({
    code: "execution_failed",
    message: "permission denied",
    type: "execution_failed",
  })
  expect(observation.raw).toBe(
    '{"error":"execution_failed","tool":"grep_docs","message":"permission denied"}'
  )
  expect(observation.providerMessage!.tool_call_id).toBe("call_error")
  // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe JSON parse
  expect(JSON.parse(observation.providerMessage!.content ?? "")).toEqual({
    content: observation.raw,
    metadata: { error: true },
  })
})

test("buildObservation classifies timeout errors", () => {
  const observation = buildObservation({
    toolCallId: "call_timeout",
    toolName: "slow_tool",
    input: {},
    result: {
      content: JSON.stringify({
        error: "timeout",
        tool: "slow_tool",
        timeout_ms: 50,
      }),
      metadata: { error: true },
    },
    stepIndex: 1,
  })

  expect(observation.status).toBe("error")
  expect(observation.summary).toBe("timeout")
  expect(observation.error).toEqual({
    code: "timeout",
    message: "timeout",
    type: "timeout",
  })
})

test("buildObservation records truncation byte counts and keeps provider content compatible", () => {
  const observation = buildObservation({
    toolCallId: "call_truncated",
    toolName: "web_search",
    input: { query: "UIUC housing" },
    result: {
      content: `${"x".repeat(20)}\n...[truncated]`,
      metadata: {
        error: true,
        original_bytes: 500,
        truncated_bytes: 35,
      },
      truncated: true,
    },
    stepIndex: 3,
  })

  expect(observation.status).toBe("error")
  expect(observation.truncated).toBe(true)
  expect(observation.byteCount).toBe(35)
  expect(observation.originalByteCount).toBe(500)
  expect(observation.truncatedByteCount).toBe(35)
  expect(observation.error).toEqual({
    code: "tool_error",
    message: "xxxxxxxxxxxxxxxxxxxx",
    type: "tool_error",
  })

  // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe JSON parse
  const content = observation.providerMessage!.content ?? ""
  expect(JSON.parse(content)).toEqual({
    content: `${"x".repeat(20)}\n...[truncated]`,
    metadata: {
      error: true,
      original_bytes: 500,
      truncated_bytes: 35,
    },
    truncated: true,
  })
})

test("buildObservation handles empty successful output", () => {
  const observation = buildObservation({
    toolCallId: "call_empty",
    toolName: "empty_tool",
    input: {},
    result: { content: "" },
    stepIndex: 4,
  })

  expect(observation.status).toBe("success")
  expect(observation.summary).toBe("")
  expect(observation.output).toBe("")
  expect(observation.raw).toBe("")
  expect(observation.byteCount).toBe(0)
  expect(observation.originalByteCount).toBe(0)
  expect(observation.truncatedByteCount).toBe(null)
  expect(observation.providerMessage!.content).toBe("")
})
