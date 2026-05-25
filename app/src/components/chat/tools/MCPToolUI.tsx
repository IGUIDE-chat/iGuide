import type { ToolCallPart, ToolResultPart } from "ai";
import {
  ToolCard,
  extractToolArgs,
  extractToolResult,
  getResultMetric,
  getStringArg,
} from "./toolUiHelpers";

interface MCPToolUIProps {
  toolCall: ToolCallPart;
  toolResult?: ToolResultPart;
}

function humanizeMCPName(toolName: string): string {
  const stripped = toolName.startsWith("mcp_")
    ? toolName.slice("mcp_".length)
    : toolName;
  return stripped.replace(/[_-]+/g, " ").trim() || toolName;
}

export function MCPToolUI({ toolCall, toolResult }: MCPToolUIProps) {
  const isLoading = !toolResult;
  const args = extractToolArgs(toolCall);
  const result = extractToolResult(toolResult);
  const label = humanizeMCPName(toolCall.toolName);
  return (
    <ToolCard
      icon="🔧"
      title={isLoading ? `Running ${label}` : label}
      primaryLabel="Tool:"
      primaryValue={getStringArg(
        args,
        ["query", "name", "input", "command"],
        toolCall.toolName
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
  );
}
