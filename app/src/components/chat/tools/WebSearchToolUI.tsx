import  { type ToolCallPart, type ToolResultPart } from "ai";
import {
  ToolCard,
  extractToolArgs,
  extractToolResult,
  getResultMetric,
  getStringArg,
} from "./toolUiHelpers";

interface WebSearchToolUIProps {
  toolCall: ToolCallPart;
  toolResult?: ToolResultPart;
}

export function WebSearchToolUI({
  toolCall,
  toolResult,
}: WebSearchToolUIProps) {
  const isLoading = !toolResult;
  const args = extractToolArgs(toolCall);
  const result = extractToolResult(toolResult);
  return (
    <ToolCard
      icon="🌐"
      title={isLoading ? "Searching the web" : "Web search"}
      primaryLabel="Query:"
      primaryValue={getStringArg(args, ["query"], "Search query")}
      metricLabel="Sources:"
      metricValue={getResultMetric(
        result,
        ["sourceCount", "count", "sources", "results"],
        "Searching...",
        "Completed"
      )}
      isLoading={isLoading}
    />
  );
}
