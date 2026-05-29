import { type ToolCallPart, type ToolResultPart } from "ai"

import {
  ToolCard,
  extractToolArgs,
  extractToolResult,
  getResultMetric,
  getStringArg,
} from "./toolUiHelpers"

interface GrepDocsToolUIProps {
  toolCall: ToolCallPart
  toolResult?: ToolResultPart
}

export function GrepDocsToolUI({ toolCall, toolResult }: GrepDocsToolUIProps) {
  const isLoading = !toolResult
  const args = extractToolArgs(toolCall)
  const result = extractToolResult(toolResult)
  return (
    <ToolCard
      icon="📄"
      title={isLoading ? "Searching documents" : "Document grep"}
      primaryLabel="Pattern:"
      primaryValue={getStringArg(args, ["pattern", "query"], "Search pattern")}
      metricLabel="Matched files:"
      metricValue={getResultMetric(
        result,
        ["fileCount", "count", "files", "matches"],
        "Searching...",
        "Completed"
      )}
      isLoading={isLoading}
    />
  )
}
