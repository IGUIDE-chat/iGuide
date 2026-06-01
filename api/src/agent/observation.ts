import type { ToolResult } from "../tools/types.ts"
import { buildToolResultContent } from "./messages.ts"
import type { ProviderMessage } from "./messages.ts"

export interface ObservationError {
  code: string
  message: string
  type?: string
}

export const Observation = Symbol("Observation")

export interface Observation {
  toolCallId: string
  toolName: string
  input: Record<string, unknown>
  output: unknown
  status: "success" | "error"
  summary: string
  raw: string
  truncated: boolean
  error: ObservationError | null
  stepIndex?: number
  byteCount?: number
  originalByteCount?: number
  truncatedByteCount?: number | null
  providerMessage?: ProviderMessage
}

interface BuildObservationOptions {
  toolCallId: string
  toolName: string
  input: Record<string, unknown>
  result: ToolResult
  stepIndex: number
}

const textEncoder = new TextEncoder()

export function buildObservation(
  options: BuildObservationOptions
): Observation {
  const parsedContent = parseJsonObject(options.result.content)
  const hasError = options.result.metadata?.error === true
  const status = hasError ? "error" : "success"
  const truncated = options.result.truncated === true
  const byteCount = byteLength(options.result.content)
  const originalByteCount = numberMetadata(
    options.result.metadata?.original_bytes,
    byteCount
  )
  const truncatedByteCount = truncated
    ? numberMetadata(options.result.metadata?.truncated_bytes, byteCount)
    : null
  const summary = buildSummary(options.result.content, parsedContent, hasError)
  const error = hasError ? buildObservationError(parsedContent, summary) : null

  return createObservation({
    toolCallId: options.toolCallId,
    toolName: options.toolName,
    input: options.input,
    output: options.result.content,
    status,
    summary,
    raw: options.result.content,
    truncated,
    error,
    stepIndex: options.stepIndex,
    byteCount,
    originalByteCount,
    truncatedByteCount,
    providerMessage: {
      role: "tool",
      tool_call_id: options.toolCallId,
      content: buildToolResultContent(options.result),
    },
  })
}

function byteLength(value: string): number {
  return textEncoder.encode(value).length
}

function numberMetadata(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function buildSummary(
  content: string,
  parsedContent: Record<string, unknown> | null,
  hasError: boolean
): string {
  if (hasError && typeof parsedContent?.message === "string") {
    return parsedContent.message
  }

  if (hasError && typeof parsedContent?.error === "string") {
    return parsedContent.error
  }

  return content.split(/\r?\n/, 1)[0] ?? ""
}

function buildObservationError(
  parsedContent: Record<string, unknown> | null,
  summary: string
): ObservationError {
  const code =
    typeof parsedContent?.error === "string"
      ? parsedContent.error
      : "tool_error"

  return {
    code,
    message: summary,
    type: code,
  }
}

export function createObservation(observation: Observation): Observation {
  return observation
}
