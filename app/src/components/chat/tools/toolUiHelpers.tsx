import { type ReactNode } from "react"
import { type ToolCallPart, type ToolResultPart } from "ai"

export type SearchToolArgs = {
  query?: string
  pattern?: string
  [key: string]: unknown
}

export function extractToolArgs(toolCall: ToolCallPart): SearchToolArgs {
  const input = toolCall.input
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as SearchToolArgs
  }
  return {}
}

export function extractToolResult(
  toolResult: ToolResultPart | undefined
): ToolSummaryResult | undefined {
  if (!toolResult) {
    return undefined
  }
  const output = toolResult.output
  if (!output) {
    return undefined
  }
  if (output.type === "text" || output.type === "error-text") {
    return output.value
  }
  if (output.type === "json" || output.type === "error-json") {
    const value = output.value
    if (typeof value === "string") {
      return value
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as ToolSummaryResult
    }
    return undefined
  }
  return undefined
}

export type ToolSummaryResult =
  | string
  | {
      status?: string
      summary?: string
      count?: number
      resultCount?: number
      sourceCount?: number
      fileCount?: number
      results?: unknown[]
      sources?: unknown[]
      files?: unknown[]
      matches?: unknown[]
      [key: string]: unknown
    }

interface ToolCardProps {
  icon: ReactNode
  title: string
  primaryLabel: string
  primaryValue: string
  metricLabel: string
  metricValue: string
  isLoading: boolean
}

export function getStringArg(
  args: SearchToolArgs,
  keys: Array<keyof SearchToolArgs>,
  fallback: string
) {
  for (const key of keys) {
    const value = args[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  return fallback
}

export function getResultSummary(result: ToolSummaryResult | undefined) {
  if (!result) {
    return ""
  }
  if (typeof result === "string") {
    return result
  }
  return result.summary ?? ""
}

export function getResultMetric(
  result: ToolSummaryResult | undefined,
  keys: string[],
  fallbackWhenLoading: string,
  fallbackWhenComplete: string
) {
  if (!result) {
    return fallbackWhenLoading
  }
  if (typeof result === "string") {
    return getFirstCount(result)?.toString() ?? fallbackWhenComplete
  }

  for (const key of keys) {
    const value = result[key]
    if (typeof value === "number") {
      return value.toString()
    }
    if (Array.isArray(value)) {
      return value.length.toString()
    }
  }

  return getFirstCount(result.summary)?.toString() ?? fallbackWhenComplete
}

export function ToolCard({
  icon,
  title,
  primaryLabel,
  primaryValue,
  metricLabel,
  metricValue,
  isLoading,
}: ToolCardProps) {
  return (
    <div
      className="my-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm shadow-sm"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-slate-700">
        <span className="text-illini-orange flex size-6 items-center justify-center rounded-full bg-white shadow-xs">
          {isLoading ? <Spinner /> : icon}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <span className="font-medium text-slate-600">{primaryLabel}</span>{" "}
          <span className="wrap-break-word">{primaryValue}</span>
        </div>
        <div>
          <span className="font-medium text-slate-600">{metricLabel}</span>{" "}
          <span>{metricValue}</span>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <output
      className="border-illini-orange size-3.5 animate-spin rounded-full border-2 border-t-transparent"
      aria-label="Loading"
    />
  )
}

function getFirstCount(value: string | undefined) {
  const match = value?.match(/\b(\d+)\b/)
  return match ? Number.parseInt(match[1], 10) : undefined
}
