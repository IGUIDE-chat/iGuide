import { tool } from 'ai'
import { z } from 'zod'
import { callSupabaseRpc } from '../lib/supabase-rpc.ts'
import type { RequestContext } from './types.ts'

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
      const snippet = result.content.substring(0, 300)
      return `## ${result.title}\nURL: ${result.url}\nRelevance: ${result.fts_rank.toFixed(2)}\n\n${snippet}\n---`
    })
    .join('\n')
}

const grepDocsSchema = z.object({
  pattern: z.string().describe('Keyword or phrase to search for'),
  category: z
    .string()
    .optional()
    .describe('Optional document category to filter by'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(5)
    .describe('Maximum number of results (default 5)'),
})

export function createGrepDocsTool(ctx: RequestContext) {
  return tool({
    description:
      'Search documents for exact keyword or phrase matches. Use when looking for specific terms, policy numbers, dates, or exact phrases.',
    parameters: grepDocsSchema,
    // @ts-expect-error - AI SDK tool() execute signature inference issue
    execute: async (args: any, options: any) => {
      const { pattern, limit } = args as z.infer<typeof grepDocsSchema>
      const { abortSignal } = options as { abortSignal?: AbortSignal }
      const matchCount = Math.min(Math.max(limit, 1), 50)

      const results = await callSupabaseRpc<KeywordSearchResult[]>(
        ctx,
        'keyword_search',
        {
          query_text: pattern,
          match_count: matchCount,
        }
      )

      if (results.length === 0) {
        return `No documents matched the pattern: ${pattern}`
      }

      return formatResults(results)
    },
  })
}
