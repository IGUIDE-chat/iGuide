import { type ToolCallPart, type ToolResultPart } from "ai"

import {
  ToolCard,
  extractToolArgs,
  extractToolResult,
  getResultMetric,
  getStringArg,
} from "./toolUiHelpers"

interface SearchToolUIProps {
  toolCall: ToolCallPart
  toolResult?: ToolResultPart
}

export function SearchToolUI({ toolCall, toolResult }: SearchToolUIProps) {
  const isLoading = !toolResult
  const args = extractToolArgs(toolCall)
  const result = extractToolResult(toolResult)
  return (
    <ToolCard
      icon="🔎"
      title={isLoading ? "Searching knowledge base" : "Knowledge base search"}
      primaryLabel="Query:"
      primaryValue={getStringArg(args, ["query"], "Search query")}
      metricLabel="Results:"
      metricValue={getResultMetric(
        result,
        ["resultCount", "count", "results"],
        "Searching...",
        "Completed"
      )}
      isLoading={isLoading}
    />
  )
}
