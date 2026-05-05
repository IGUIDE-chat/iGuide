import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  ToolCard,
  getResultMetric,
  getStringArg,
  type SearchToolArgs,
  type ToolSummaryResult,
} from "./toolUiHelpers";

export const WebSearchToolUI = makeAssistantToolUI<
  SearchToolArgs,
  ToolSummaryResult
>({
  toolName: "web_search",
  render: ({ args, result, status }) => (
    <ToolCard
      icon="🌐"
      title={status.type === "running" ? "Searching the web" : "Web search"}
      primaryLabel="Query:"
      primaryValue={getStringArg(args, ["query"], "Search query")}
      metricLabel="Sources:"
      metricValue={getResultMetric(
        result,
        ["sourceCount", "count", "sources", "results"],
        "Searching...",
        "Completed"
      )}
      isLoading={status.type === "running"}
    />
  ),
});
