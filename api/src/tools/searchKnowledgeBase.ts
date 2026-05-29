import { tool } from "ai"
import { z } from "zod"

import { getEmbeddingConfig } from "../lib/embedding-config.ts"
import { EmbeddingClient } from "../lib/embeddings.ts"
import { callSupabaseRpc } from "../lib/supabase-rpc.ts"
import { type RequestContext } from "./types.ts"

interface HybridSearchResult {
  chunk_id: string
  title: string
  chunk_text: string
  url: string
  semantic_rank: number | null
  fts_rank: number | null
  rrf_score: number
}

interface KeywordSearchResult {
  chunk_id: string
  title: string
  chunk_text: string
  url: string
  fts_score: number
}

function formatHybridResults(results: HybridSearchResult[]): string {
  if (results.length === 0) {
    return "No knowledge base results found."
  }

  return results
    .map(
      (result) =>
        `## ${result.title}\nScore: ${result.rrf_score.toFixed(4)}\nURL: ${result.url}\n\n${result.chunk_text.slice(0, 300)}\n---`
    )
    .join("\n")
}

function formatKeywordResults(results: KeywordSearchResult[]): string {
  if (results.length === 0) {
    return "No knowledge base results found."
  }

  return results
    .map(
      (result) =>
        `## ${result.title}\nScore: ${result.fts_score.toFixed(4)}\nURL: ${result.url}\n\n${result.chunk_text.slice(0, 300)}\n---`
    )
    .join("\n")
}

const searchKnowledgeBaseSchema = z.object({
  query: z.string().describe("Search query"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Max results (default 5)"),
})

export function createSearchKnowledgeBaseTool(ctx: RequestContext) {
  return tool({
    description:
      "Search the UIUC knowledge base using hybrid semantic + keyword search. Use for questions about housing, courses, campus life, policies.",
    inputSchema: searchKnowledgeBaseSchema,
    execute: async (args) => {
      const { query, limit: rawLimit } = args
      const limit = rawLimit ?? 5
      let queryEmbedding: number[]

      try {
        const embeddingClient = new EmbeddingClient(getEmbeddingConfig(ctx.env))
        queryEmbedding = await embeddingClient.embedQuery(query)
      } catch {
        try {
          const fallbackResults = await callSupabaseRpc<KeywordSearchResult[]>(
            ctx,
            "keyword_search",
            {
              query_text: query,
              match_count: limit,
            }
          )

          return formatKeywordResults(fallbackResults.slice(0, limit))
        } catch (rpcError) {
          const message =
            rpcError instanceof Error ? rpcError.message : String(rpcError)
          throw new Error(`Search failed: ${message}`, { cause: rpcError })
        }
      }

      try {
        const results = await callSupabaseRpc<HybridSearchResult[]>(
          ctx,
          "hybrid_search",
          {
            query_text: query,
            query_embedding: `[${queryEmbedding.join(",")}]`,
            match_count: limit,
          }
        )

        return formatHybridResults(results.slice(0, limit))
      } catch (rpcError) {
        const message =
          rpcError instanceof Error ? rpcError.message : String(rpcError)
        throw new Error(`Search failed: ${message}`, { cause: rpcError })
      }
    },
  })
}
