import assert from "node:assert/strict"
import test from "node:test"

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

  assert.equal(observation.toolCallId, "call_123")
  assert.equal(observation.toolName, "search_knowledge_base")
  assert.deepEqual(observation.input, { query: "PAR" })
  assert.equal(observation.status, "success")
  assert.equal(observation.summary, "PAR has multiple dining options.")
  assert.equal(
    observation.output,
    "PAR has multiple dining options.\nSource: housing guide"
  )
  assert.equal(
    observation.raw,
    "PAR has multiple dining options.\nSource: housing guide"
  )
  assert.equal(observation.truncated, false)
  assert.equal(observation.error, null)
  assert.equal(observation.stepIndex, 2)
  assert.equal(observation.byteCount, 54)
  assert.equal(observation.originalByteCount, 54)
  assert.equal(observation.truncatedByteCount, null)
  assert.equal(observation.providerMessage.role, "tool")
  assert.equal(observation.providerMessage.tool_call_id, "call_123")
  assert.equal(
    observation.providerMessage.content,
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

  assert.equal(observation.status, "error")
  assert.equal(observation.summary, "permission denied")
  assert.deepEqual(observation.error, {
    code: "execution_failed",
    message: "permission denied",
    type: "execution_failed",
  })
  assert.equal(
    observation.raw,
    '{"error":"execution_failed","tool":"grep_docs","message":"permission denied"}'
  )
  assert.equal(observation.providerMessage.tool_call_id, "call_error")
  // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe JSON parse
  assert.deepEqual(JSON.parse(observation.providerMessage.content ?? ""), {
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

  assert.equal(observation.status, "error")
  assert.equal(observation.summary, "timeout")
  assert.deepEqual(observation.error, {
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
      content: "x".repeat(20) + "\n...[truncated]",
      metadata: {
        error: true,
        original_bytes: 500,
        truncated_bytes: 35,
      },
      truncated: true,
    },
    stepIndex: 3,
  })

  assert.equal(observation.status, "error")
  assert.equal(observation.truncated, true)
  assert.equal(observation.byteCount, 35)
  assert.equal(observation.originalByteCount, 500)
  assert.equal(observation.truncatedByteCount, 35)
  assert.deepEqual(observation.error, {
    code: "tool_error",
    message: "xxxxxxxxxxxxxxxxxxxx",
    type: "tool_error",
  })

  // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe JSON parse
  const content = observation.providerMessage.content ?? ""
  assert.deepEqual(JSON.parse(content), {
    content: "x".repeat(20) + "\n...[truncated]",
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

  assert.equal(observation.status, "success")
  assert.equal(observation.summary, "")
  assert.equal(observation.output, "")
  assert.equal(observation.raw, "")
  assert.equal(observation.byteCount, 0)
  assert.equal(observation.originalByteCount, 0)
  assert.equal(observation.truncatedByteCount, null)
  assert.equal(observation.providerMessage.content, "")
})
