import { expect, test } from "vite-plus/test"

import { DEFAULT_MAX_ITERATIONS, evaluateStopCondition } from "./bounds.ts"
import type { ProviderToolCall } from "./messages.ts"
import type { Observation } from "./observation.ts"

function toolCall(name = "web_search"): ProviderToolCall {
  return {
    id: `call_${name}`,
    type: "function",
    function: {
      name,
      arguments: "{}",
    },
  }
}

function observation(options: {
  status?: Observation["status"]
  code?: string
  message?: string
}): Observation {
  const status = options.status ?? (options.code ? "error" : "success")
  return {
    toolCallId: "call_1",
    toolName: "web_search",
    input: {},
    output: "",
    status,
    summary: options.message ?? options.code ?? "ok",
    raw: options.code ? JSON.stringify({ error: options.code }) : "ok",
    truncated: false,
    error: options.code
      ? {
          code: options.code,
          message: options.message ?? options.code,
          type: options.code,
        }
      : null,
  }
}

test("evaluateStopCondition stops content-only model responses as final answers", () => {
  const decision = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [],
  })

  expect(decision.shouldStop).toBe(true)
  expect(decision.reason).toBe("final_answer")
  expect(decision.semanticLabel).toBe("final_answer_no_tool_calls")
  expect(decision.fallbackReason).toBe(null)
})

test("evaluateStopCondition stops continued tool use at the max iteration bound", () => {
  const decision = evaluateStopCondition({
    iterationCount: DEFAULT_MAX_ITERATIONS,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
  })

  expect(decision.shouldStop).toBe(true)
  expect(decision.reason).toBe("max_iterations")
  expect(decision.semanticLabel).toBe("max_iterations_reached")
  expect(decision.fallbackReason).toBe("max_iterations_exceeded")
})

test("evaluateStopCondition stops when the registry reports max tool-call budget exceeded", () => {
  const decision = evaluateStopCondition({
    iterationCount: 2,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    observations: [observation({ code: "budget_exceeded" })],
  })

  expect(decision.shouldStop).toBe(true)
  expect(decision.reason).toBe("max_tool_calls")
  expect(decision.semanticLabel).toBe("tool_call_budget_exceeded")
  expect(decision.fallbackReason).toBe("tool_failure")
})

test("evaluateStopCondition stops unrecoverable invalid tool calls", () => {
  const invalidArguments = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    observations: [observation({ code: "invalid_arguments" })],
  })

  expect(invalidArguments.shouldStop).toBe(true)
  expect(invalidArguments.reason).toBe("invalid_tool_call")
  expect(invalidArguments.semanticLabel).toBe("unrecoverable_invalid_tool_call")
  expect(invalidArguments.fallbackReason).toBe("tool_failure")

  const missingTool = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall("missing_tool")],
    observations: [observation({ code: "tool_not_found" })],
  })

  expect(missingTool.shouldStop).toBe(true)
  expect(missingTool.reason).toBe("invalid_tool_call")
})

test("evaluateStopCondition keeps recoverable tool errors in the loop with fallback context", () => {
  const failure = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    observations: [observation({ code: "execution_failed" })],
  })

  expect(failure.shouldStop).toBe(false)
  expect(failure.reason).toBe(null)
  expect(failure.semanticLabel).toBe("continue_after_recoverable_tool_error")
  expect(failure.fallbackReason).toBe("tool_failure")

  const timeout = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    observations: [observation({ code: "timeout" })],
  })

  expect(timeout.shouldStop).toBe(false)
  expect(timeout.fallbackReason).toBe("tool_timeout")
})

test("evaluateStopCondition exposes generic loop errors as machine-readable stops", () => {
  const decision = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    error: new Error("provider failed"),
  })

  expect(decision.shouldStop).toBe(true)
  expect(decision.reason).toBe("error")
  expect(decision.semanticLabel).toBe("loop_error")
  expect(decision.fallbackReason).toBe("tool_failure")
})

test("evaluateStopCondition continues when tools and observations are within bounds", () => {
  const decision = evaluateStopCondition({
    iterationCount: 1,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    toolCalls: [toolCall()],
    observations: [observation({ status: "success" })],
  })

  expect(decision.shouldStop).toBe(false)
  expect(decision.reason).toBe(null)
  expect(decision.semanticLabel).toBe("continue_within_bounds")
  expect(decision.fallbackReason).toBe(null)
})
