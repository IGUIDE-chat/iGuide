import { type ToolCallPart, type ToolResultPart } from "ai"
import { CustomSkillsToolUI } from "./CustomSkillsToolUI"
import { GrepDocsToolUI } from "./GrepDocsToolUI"
import { MCPToolUI } from "./MCPToolUI"
import { SearchToolUI } from "./SearchToolUI"
import { ToolCard } from "./toolUiHelpers"
import { WebSearchToolUI } from "./WebSearchToolUI"

interface ToolPartProps {
  part: ToolCallPart
  resultParts: ToolResultPart[]
}

function stringifyArgs(input: unknown): string {
  if (input === null || input === undefined) {
    return ""
  }
  if (typeof input === "string") {
    return input
  }
  try {
    const json = JSON.stringify(input)
    return json.length > 80 ? `${json.slice(0, 77)}...` : json
  } catch {
    return ""
  }
}

export function ToolPart({ part, resultParts }: ToolPartProps) {
  const matchingResult = resultParts.find(
    (r) => r.toolCallId === part.toolCallId
  )

  switch (part.toolName) {
    case "search_knowledge_base":
      return <SearchToolUI toolCall={part} toolResult={matchingResult} />
    case "web_search":
      return <WebSearchToolUI toolCall={part} toolResult={matchingResult} />
    case "grep_docs":
      return <GrepDocsToolUI toolCall={part} toolResult={matchingResult} />
    case "custom_skills":
      return <CustomSkillsToolUI toolCall={part} toolResult={matchingResult} />
  }

  if (part.toolName.startsWith("mcp_")) {
    return <MCPToolUI toolCall={part} toolResult={matchingResult} />
  }

  const isLoading = !matchingResult
  return (
    <ToolCard
      icon="🛠️"
      title={isLoading ? `Running ${part.toolName}` : part.toolName}
      primaryLabel="Args:"
      primaryValue={stringifyArgs(part.input) || "(none)"}
      metricLabel="Status:"
      metricValue={isLoading ? "Running..." : "Completed"}
      isLoading={isLoading}
    />
  )
}
