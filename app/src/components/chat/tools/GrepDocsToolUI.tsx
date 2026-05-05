import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  ToolCard,
  getResultMetric,
  getStringArg,
  type SearchToolArgs,
  type ToolSummaryResult,
} from "./toolUiHelpers";

export const GrepDocsToolUI = makeAssistantToolUI<
  SearchToolArgs,
  ToolSummaryResult
>({
  toolName: "grep_docs",
  render: ({ args, result, status }) => (
    <ToolCard
      icon="📄"
      title={
        status.type === "running" ? "Searching documents" : "Document grep"
      }
      primaryLabel="Pattern:"
      primaryValue={getStringArg(args, ["pattern", "query"], "Search pattern")}
      metricLabel="Matched files:"
      metricValue={getResultMetric(
        result,
        ["fileCount", "count", "files", "matches"],
        "Searching...",
        "Completed"
      )}
      isLoading={status.type === "running"}
    />
  ),
});
