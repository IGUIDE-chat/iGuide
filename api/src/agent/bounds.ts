import type { FallbackReason } from "./fallback.ts"
import type { ProviderToolCall } from "./messages.ts"
import type { Observation } from "./observation.ts"

export const DEFAULT_MAX_ITERATIONS = 3

export type StopReason =
  | "final_answer"
  | "max_iterations"
  | "max_tool_calls"
  | "invalid_tool_call"
  | "error"

export type StopSemanticLabel =
  | "final_answer_no_tool_calls"
  | "max_iterations_reached"
  | "tool_call_budget_exceeded"
  | "unrecoverable_invalid_tool_call"
  | "loop_error"
  | "continue_after_recoverable_tool_error"
  | "continue_within_bounds"

export interface StopConditionInput {
  iterationCount: number
  maxIterations?: number
  toolCalls?: ProviderToolCall[] | null
  observations?: Observation[]
  error?: unknown
}

export interface StopConditionDecision {
  shouldStop: boolean
  reason: StopReason | null
  semanticLabel: StopSemanticLabel
  fallbackReason: FallbackReason | null
}

const INVALID_TOOL_CALL_ERROR_CODES = new Set([
  "invalid_arguments",
  "tool_not_found",
])

export function evaluateStopCondition(
  input: StopConditionInput
): StopConditionDecision {
  if (input.error !== undefined) {
    return stop("error", "loop_error", "tool_failure")
  }

  const toolCalls = input.toolCalls ?? []
  if (toolCalls.length === 0) {
    return stop("final_answer", "final_answer_no_tool_calls", null)
  }

  const toolErrorCodes = extractToolErrorCodes(input.observations ?? [])
  if (toolErrorCodes.includes("budget_exceeded")) {
    return stop("max_tool_calls", "tool_call_budget_exceeded", "tool_failure")
  }

  if (toolErrorCodes.some((code) => INVALID_TOOL_CALL_ERROR_CODES.has(code))) {
    return stop(
      "invalid_tool_call",
      "unrecoverable_invalid_tool_call",
      "tool_failure"
    )
  }

  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS
  if (input.iterationCount >= maxIterations) {
    return stop(
      "max_iterations",
      "max_iterations_reached",
      "max_iterations_exceeded"
    )
  }

  const fallbackReason = resolveToolFallbackReason(toolErrorCodes)
  return {
    shouldStop: false,
    reason: null,
    semanticLabel: fallbackReason
      ? "continue_after_recoverable_tool_error"
      : "continue_within_bounds",
    fallbackReason,
  }
}

function stop(
  reason: StopReason,
  semanticLabel: StopSemanticLabel,
  fallbackReason: FallbackReason | null
): StopConditionDecision {
  return {
    shouldStop: true,
    reason,
    semanticLabel,
    fallbackReason,
  }
}

function extractToolErrorCodes(observations: Observation[]): string[] {
  return observations.flatMap((observation) =>
    observation.error?.code ? [observation.error.code] : []
  )
}

function resolveToolFallbackReason(
  toolErrorCodes: string[]
): FallbackReason | null {
  if (toolErrorCodes.length === 0) {
    return null
  }

  return toolErrorCodes.every((code) => code === "timeout")
    ? "tool_timeout"
    : "tool_failure"
}
