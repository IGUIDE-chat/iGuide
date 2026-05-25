import { tool } from 'ai'
import { z } from 'zod'
import type { RequestContext } from './types.ts'

interface TavilyResponse {
  results?: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
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
  return isUiucOfficialUrl(url) ? score + 100 : score
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

const webSearchSchema = z.object({
  query: z.string().describe('Search query'),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe('Maximum number of results (default 5, max 10)'),
})

export function createWebSearchTool(ctx: RequestContext) {
  return tool({
    description:
      'Search the web for current, time-sensitive, or externally sourced UIUC information when the knowledge base does not have answers. Do not use for greetings, thanks, acknowledgements, or casual conversation.',
    inputSchema: webSearchSchema,
    execute: async (args: any, options: any) => {
      const { query, max_results: rawMaxResults } = args as z.infer<typeof webSearchSchema>
      const { abortSignal } = options as { abortSignal?: AbortSignal }
      const max_results = rawMaxResults ?? 5
      const apiKey = ctx.env.TAVILY_API_KEY

      if (!apiKey) {
        throw new Error('TAVILY_API_KEY not configured')
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results,
          include_domains: ['illinois.edu', 'housing.illinois.edu'],
        }),
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(`Tavily API returned ${response.status}`)
      }

      const data = (await response.json()) as TavilyResponse
      const results = data.results || []

      const sorted = results.sort(
        (a, b) =>
          getResultPriority(b.url, b.score) - getResultPriority(a.url, a.score)
      )

      return formatResults(sorted)
    },
  })
}
