import type { ToolRegistry } from "./registry"
import type { RequestContext, ToolDefinition, ToolResult, ToolSource } from "./types"

interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results?: TavilyResult[]
}

/** Longest citation preview, in characters, including the trailing ellipsis. */
const SNIPPET_MAX_CHARS = 240

interface WebSearchArgs {
  query: string
  max_results?: number
}

function isUiucOfficialUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname === "illinois.edu" || hostname.endsWith(".illinois.edu")
  } catch {
    return false
  }
}

/**
 * Ranks `illinois.edu` results above everything else regardless of Tavily's
 * relevance score, so official university sources win even when a third-party
 * page scores higher. The offset is large enough to outrank any score Tavily
 * returns, not merely to nudge.
 */
function getResultPriority(url: string, score: number): number {
  let priority = score
  if (isUiucOfficialUrl(url)) {
    priority += 100
  }
  return priority
}

function formatResults(results: TavilyResult[]): string {
  if (results.length === 0) {
    return "No results found for the search query."
  }

  return results
    .map((result) => `## ${result.title}\nSource: ${result.url}\n\n${result.content}\n---`)
    .join("\n")
}

function toSnippet(content: unknown): string | undefined {
  if (typeof content !== "string") return undefined

  const collapsed = content.replace(/\s+/g, " ").trim()
  // Count code points, not UTF-16 units, so the cut never splits a surrogate pair.
  const chars = Array.from(collapsed)
  if (chars.length === 0) return undefined
  if (chars.length <= SNIPPET_MAX_CHARS) return collapsed

  return `${chars
    .slice(0, SNIPPET_MAX_CHARS - 1)
    .join("")
    .trimEnd()}…`
}

/**
 * Citation metadata for the results in `formatResults` order. The URL is kept
 * verbatim (not normalized) so it matches the `Source:` line the model reads.
 */
function buildSources(results: TavilyResult[]): ToolSource[] {
  const sources: ToolSource[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (typeof result.url !== "string" || seen.has(result.url)) continue

    let hostname: string
    try {
      const parsed = new URL(result.url)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue
      hostname = parsed.hostname
    } catch {
      continue
    }

    seen.add(result.url)
    const title = typeof result.title === "string" ? result.title.trim() : ""
    const snippet = toSnippet(result.content)
    sources.push({
      url: result.url,
      title: title || hostname,
      ...(snippet ? { snippet } : {}),
    })
  }

  return sources
}

export function createWebSearchTool(registry: ToolRegistry): ToolDefinition {
  const tool: ToolDefinition = {
    name: "web_search",
    description:
      "Search official UIUC websites for current, time-sensitive, or externally sourced information. Do not use for greetings, thanks, acknowledgements, or casual conversation.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        max_results: {
          type: "number",
          description: "Maximum number of results (default 5, max 10)",
          default: 5,
        },
      },
      required: ["query"],
    },
    execute: async (args: Record<string, unknown>, ctx: RequestContext): Promise<ToolResult> => {
      const { query, max_results = 5 } = args as unknown as WebSearchArgs

      if (!query || typeof query !== "string") {
        return {
          content: "Error: query parameter is required and must be a string",
        }
      }

      const limit = Math.min(Math.max(max_results || 5, 1), 10)
      const apiKey = ctx.env.TAVILY_API_KEY

      if (!apiKey) {
        return {
          content: "Error: TAVILY_API_KEY not configured",
        }
      }

      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: limit,
            include_domains: ["illinois.edu", "housing.illinois.edu"],
          }),
        })

        if (!response.ok) {
          return {
            content: `Error: Tavily API returned ${response.status}`,
          }
        }

        const data = (await response.json()) as TavilyResponse
        const results = data.results || []

        const sorted = results.sort(
          (a, b) => getResultPriority(b.url, b.score) - getResultPriority(a.url, a.score),
        )

        return {
          content: formatResults(sorted),
          metadata: { sources: buildSources(sorted) },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          content: `Error: Failed to search web: ${message}`,
        }
      }
    },
  }

  registry.register(tool)
  return tool
}
