import type { ToolResult, ToolSource } from "../tools/types.ts"
import { buildToolResultContent, type ProviderMessage } from "./messages.ts"

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
  /**
   * Pages the model actually read: the tool's `metadata.sources` minus any whose
   * URL was cut from `raw` by the registry's byte limit. Absent on errors.
   */
  sources?: ToolSource[]
}

interface BuildObservationOptions {
  toolCallId: string
  toolName: string
  input: Record<string, unknown>
  result: ToolResult
  stepIndex: number
}

const textEncoder = new TextEncoder()

export function buildObservation(options: BuildObservationOptions): Observation {
  const parsedContent = parseJsonObject(options.result.content)
  const hasError = options.result.metadata?.error === true
  const status = hasError ? "error" : "success"
  const truncated = options.result.truncated === true
  const byteCount = byteLength(options.result.content)
  const originalByteCount = numberMetadata(options.result.metadata?.original_bytes, byteCount)
  const truncatedByteCount = truncated
    ? numberMetadata(options.result.metadata?.truncated_bytes, byteCount)
    : null
  const summary = buildSummary(options.result.content, parsedContent, hasError)
  const error = hasError ? buildObservationError(parsedContent, summary) : null
  const sources = hasError
    ? []
    : readVisibleSources(options.result.metadata?.sources, options.result.content)

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
      content: buildToolResultContent(withoutSourcesMetadata(options.result)),
    },
    ...(sources.length > 0 ? { sources } : {}),
  })
}

function byteLength(value: string): number {
  return textEncoder.encode(value).length
}

/**
 * Sources are UI-only: `buildToolResultContent` would otherwise serialize them
 * into the tool message, re-sending every snippet (including pages the byte
 * limit cut) to the model.
 */
function withoutSourcesMetadata(result: ToolResult): ToolResult {
  if (!result.metadata || !("sources" in result.metadata)) {
    return result
  }

  const metadata = { ...result.metadata }
  delete metadata.sources

  return {
    ...result,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  }
}

function readVisibleSources(value: unknown, content: string): ToolSource[] {
  if (!Array.isArray(value)) return []

  const sources: ToolSource[] = []
  const seen = new Set<string>()

  for (const entry of value) {
    const source = toToolSource(entry)
    if (!source || seen.has(source.url) || !mentionsUrl(content, source.url)) continue

    seen.add(source.url)
    sources.push(source)
  }

  return sources
}

function toToolSource(value: unknown): ToolSource | null {
  if (value === null || typeof value !== "object") return null

  const { url, title, snippet } = value as Record<string, unknown>
  if (typeof url !== "string" || typeof title !== "string" || !isHttpUrl(url)) return null
  if (snippet !== undefined && typeof snippet !== "string") return null

  return {
    url,
    title,
    ...(snippet ? { snippet } : {}),
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Characters after a URL that end it. Anything else (`/`, `-`, letters, ...)
 * means the match is a prefix of a longer URL, which is a different page.
 */
const URL_TERMINATORS = /[\s)\]}>"'<,;]/

/** True when `content` contains `url` as a whole URL, not only as a prefix. */
function mentionsUrl(content: string, url: string): boolean {
  let index = content.indexOf(url)

  while (index !== -1) {
    const next = content[index + url.length]
    if (next === undefined || URL_TERMINATORS.test(next)) return true
    index = content.indexOf(url, index + 1)
  }

  return false
}

function numberMetadata(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function buildSummary(
  content: string,
  parsedContent: Record<string, unknown> | null,
  hasError: boolean,
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
  summary: string,
): ObservationError {
  const code = typeof parsedContent?.error === "string" ? parsedContent.error : "tool_error"

  return {
    code,
    message: summary,
    type: code,
  }
}

export function createObservation(observation: Observation): Observation {
  return observation
}

export function observationToolCallId(observation: Observation): string {
  return observation.toolCallId
}

export function observationToolName(observation: Observation): string {
  return observation.toolName
}

export function observationInput(observation: Observation): Record<string, unknown> {
  return observation.input
}

export function observationOutput(observation: Observation): unknown {
  return observation.output
}

export function observationStatus(observation: Observation): Observation["status"] {
  return observation.status
}

export function observationSummary(observation: Observation): string {
  return observation.summary
}

export function observationRaw(observation: Observation): string {
  return observation.raw
}

export function observationTruncated(observation: Observation): boolean {
  return observation.truncated
}

export function observationError(observation: Observation): ObservationError | null {
  return observation.error
}
