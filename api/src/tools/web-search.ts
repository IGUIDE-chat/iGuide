import  { type ToolRegistry } from './registry'
import { type RequestContext, type ToolDefinition, type ToolResult } from './types'

interface TavilyResponse {
  results?: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
}

interface WebSearchArgs {
  query: string
  max_results?: number
}

function isUiucOfficialUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname === 'illinois.edu' || hostname.endsWith('.illinois.edu')
  } catch {
    return false
  }
}

function getResultPriority(url: string, score: number): number {
  let priority = score
  if (isUiucOfficialUrl(url)) {
    priority += 100
  }
  return priority
}

function formatResults(
  results: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
): string {
  if (results.length === 0) {
    return 'No results found for the search query.'
  }

  return results
    .map(
      (result) =>
        `## ${result.title}\nSource: ${result.url}\n\n${result.content}\n---`
    )
    .join('\n')
}

export function createWebSearchTool(registry: ToolRegistry): ToolDefinition {
  const tool: ToolDefinition = {
    name: 'web_search',
    description:
      'Search the web for current, time-sensitive, or externally sourced UIUC information when the knowledge base does not have answers. Do not use for greetings, thanks, acknowledgements, or casual conversation.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results (default 5, max 10)',
          default: 5,
        },
      },
      required: ['query'],
    },
    execute: async (
      args: Record<string, unknown>,
      ctx: RequestContext
    ): Promise<ToolResult> => {
      const { query, max_results = 5 } = args as unknown as WebSearchArgs

      if (!query || typeof query !== 'string') {
        return {
          content: 'Error: query parameter is required and must be a string',
        }
      }

      const limit = Math.min(Math.max(max_results || 5, 1), 10)
      const apiKey = ctx.env.TAVILY_API_KEY

      if (!apiKey) {
        return {
          content: 'Error: TAVILY_API_KEY not configured',
        }
      }

      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: limit,
            include_domains: ['illinois.edu', 'housing.illinois.edu'],
          }),
        })

        if (!response.ok) {
          return {
            content: `Error: Tavily API returned ${response.status}`,
          }
        }

        const data = (await response.json()) as TavilyResponse
        const results = data.results || []

        // Sort by priority (UIUC official first)
        const sorted = results.toSorted(
          (a, b) =>
            getResultPriority(b.url, b.score) -
            getResultPriority(a.url, a.score)
        )

        return {
          content: formatResults(sorted),
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
