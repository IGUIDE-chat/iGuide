import { callSupabaseRpc } from '../lib/supabase-rpc'
import  { type ToolRegistry } from './registry'
import { type RequestContext, type ToolDefinition, type ToolResult } from './types'

interface KeywordSearchArgs {
  pattern: string
  category?: string
  limit?: number
}

interface KeywordSearchResult {
  id: string
  title: string
  content: string
  url: string
  category: string
  fts_rank: number
}

function formatResults(results: KeywordSearchResult[]): string {
  if (results.length === 0) {
    return 'No documents matched the pattern.'
  }

  return results
    .map((result) => {
      const snippet = result.content.slice(0, 300)
      return `## ${result.title}\nURL: ${result.url}\nRelevance: ${result.fts_rank.toFixed(2)}\n\n${snippet}\n---`
    })
    .join('\n')
}

export function createGrepDocsTool(registry: ToolRegistry): ToolDefinition {
  const tool: ToolDefinition = {
    name: 'grep_docs',
    description:
      'Search documents for exact keyword or phrase matches. Use when looking for specific terms, policy numbers, dates, or exact phrases.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Keyword or phrase to search for',
        },
        category: {
          type: 'string',
          description: 'Optional document category to filter by',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 5)',
          default: 5,
        },
      },
      required: ['pattern'],
    },
    execute: async (
      args: Record<string, unknown>,
      ctx: RequestContext
    ): Promise<ToolResult> => {
      const { pattern, limit = 5 } = args as unknown as KeywordSearchArgs

      if (!pattern || typeof pattern !== 'string') {
        return {
          content: 'Error: pattern parameter is required and must be a string',
        }
      }

      const matchCount = Math.min(Math.max(limit || 5, 1), 50)

      try {
        const results = await callSupabaseRpc<KeywordSearchResult[]>(
          ctx,
          'keyword_search',
          {
            query_text: pattern,
            match_count: matchCount,
          }
        )

        if (results.length === 0) {
          return {
            content: `No documents matched the pattern: ${pattern}`,
          }
        }

        return {
          content: formatResults(results),
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          content: `Error: Failed to search documents: ${message}`,
        }
      }
    },
  }

  registry.register(tool)
  return tool
}
