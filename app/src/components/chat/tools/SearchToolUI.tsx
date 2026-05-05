import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  ToolCard,
  getResultMetric,
  getStringArg,
  type SearchToolArgs,
  type ToolSummaryResult,
} from "./toolUiHelpers";

export const SearchToolUI = makeAssistantToolUI<
  SearchToolArgs,
  ToolSummaryResult
>({
  toolName: "search_knowledge_base",
  render: ({ args, result, status }) => (
    <ToolCard
      icon="🔎"
      title={
        status.type === "running"
          ? "Searching knowledge base"
          : "Knowledge base search"
      }
      primaryLabel="Query:"
      primaryValue={getStringArg(args, ["query"], "Search query")}
      metricLabel="Results:"
      metricValue={getResultMetric(
        result,
        ["resultCount", "count", "results"],
        "Searching...",
        "Completed"
      )}
      isLoading={status.type === "running"}
    />
  ),
});
