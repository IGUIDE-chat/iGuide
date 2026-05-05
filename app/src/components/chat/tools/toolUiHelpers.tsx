import type { ReactNode } from "react";

export type SearchToolArgs = {
  query?: string;
  pattern?: string;
  [key: string]: unknown;
};

export type ToolSummaryResult =
  | string
  | {
      status?: string;
      summary?: string;
      count?: number;
      resultCount?: number;
      sourceCount?: number;
      fileCount?: number;
      results?: unknown[];
      sources?: unknown[];
      files?: unknown[];
      matches?: unknown[];
      [key: string]: unknown;
    };

interface ToolCardProps {
  icon: ReactNode;
  title: string;
  primaryLabel: string;
  primaryValue: string;
  metricLabel: string;
  metricValue: string;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getStringArg(
  args: SearchToolArgs,
  keys: Array<keyof SearchToolArgs>,
  fallback: string
) {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return fallback;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getResultSummary(result: ToolSummaryResult | undefined) {
  if (!result) return "";
  if (typeof result === "string") return result;
  return result.summary ?? "";
}

// eslint-disable-next-line react-refresh/only-export-components
export function getResultMetric(
  result: ToolSummaryResult | undefined,
  keys: string[],
  fallbackWhenLoading: string,
  fallbackWhenComplete: string
) {
  if (!result) return fallbackWhenLoading;
  if (typeof result === "string") {
    return getFirstCount(result)?.toString() ?? fallbackWhenComplete;
  }

  for (const key of keys) {
    const value = result[key];
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) return value.length.toString();
  }

  return getFirstCount(result.summary)?.toString() ?? fallbackWhenComplete;
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
      className="
        my-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5
        text-sm shadow-sm
      "
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-slate-700">
        <span
          className="
            flex size-6 items-center justify-center rounded-full bg-white
            text-illini-orange shadow-xs
          "
        >
          {isLoading ? <Spinner /> : icon}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <div
        className="
          mt-2 grid gap-1 text-xs text-slate-500
          sm:grid-cols-2
        "
      >
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
  );
}

function Spinner() {
  return (
    <span
      className="
        size-3.5 animate-spin rounded-full border-2 border-illini-orange
        border-t-transparent
      "
      aria-label="Loading"
      role="img"
    />
  );
}

function getFirstCount(value: string | undefined) {
  const match = value?.match(/\b(\d+)\b/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}
