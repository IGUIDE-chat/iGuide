import { type ToolCallPart, type ToolResultPart } from "ai"

import {
  ToolCard,
  extractToolArgs,
  extractToolResult,
  getResultMetric,
  getStringArg,
} from "./toolUiHelpers"

interface CustomSkillsToolUIProps {
  toolCall: ToolCallPart
  toolResult?: ToolResultPart
}

export function CustomSkillsToolUI({
  toolCall,
  toolResult,
}: CustomSkillsToolUIProps) {
  const isLoading = !toolResult
  const args = extractToolArgs(toolCall)
  const result = extractToolResult(toolResult)
  return (
    <ToolCard
      icon="⚡"
      title={isLoading ? "Running custom skill" : "Custom skill"}
      primaryLabel="Skill:"
      primaryValue={getStringArg(
        args,
        ["skill", "name", "skillName", "query"],
        "Skill"
      )}
      metricLabel="Status:"
      metricValue={getResultMetric(
        result,
        ["resultCount", "count", "results"],
        "Running...",
        "Completed"
      )}
      isLoading={isLoading}
    />
  )
}
