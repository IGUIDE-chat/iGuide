import { getEmbeddingConfig } from "../lib/embedding-config"
import { EmbeddingClient } from "../lib/embeddings"
import { callSupabaseRpc } from "../lib/supabase-rpc"
import type { ToolRegistry } from "./registry"
import type { RequestContext, ToolDefinition, ToolResult } from "./types"

interface SearchKnowledgeBaseArgs {
  query: string
  limit?: number
}

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

function normalizeLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 5
  }

  return Math.min(Math.max(Math.floor(value), 1), 10)
}

function buildSnippet(content: string): string {
  return content.slice(0, 300)
}

function formatHybridResults(results: HybridSearchResult[]): string {
  if (results.length === 0) {
    return "No knowledge base results found."
  }

  return results
    .map(
      (result) =>
        `## ${result.title}\nScore: ${result.rrf_score.toFixed(4)}\nURL: ${result.url}\n\n${buildSnippet(result.chunk_text)}\n---`
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
        `## ${result.title}\nScore: ${result.fts_score.toFixed(4)}\nURL: ${result.url}\n\n${buildSnippet(result.chunk_text)}\n---`
    )
    .join("\n")
}

function parseArgs(
  args: Record<string, unknown>
): SearchKnowledgeBaseArgs | ToolResult {
  const { query, limit } = args

  if (typeof query !== "string" || query.trim().length === 0) {
    return {
      content:
        "Error: query parameter is required and must be a non-empty string",
    }
  }

  return {
    query: query.trim(),
    limit: normalizeLimit(limit),
  }
}

export function createSearchKnowledgeBaseTool(
  registry: ToolRegistry
): ToolDefinition {
  const tool: ToolDefinition = {
    name: "search_knowledge_base",
    description:
      "Search the UIUC knowledge base using hybrid semantic + keyword search. Use for questions about housing, courses, campus life, policies.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        limit: {
          type: "integer",
          description: "Max results",
          default: 5,
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
    },
    execute: async (
      args: Record<string, unknown>,
      ctx: RequestContext
    ): Promise<ToolResult> => {
      const parsedArgs = parseArgs(args)
      if ("content" in parsedArgs) {
        return parsedArgs
      }

      const { query, limit } = parsedArgs
      let queryEmbedding: number[]

      try {
        const embeddingClient = new EmbeddingClient(getEmbeddingConfig(ctx.env))
        queryEmbedding = await embeddingClient.embedQuery(query)
      } catch (embeddingError) {
        try {
          const fallbackResults = await callSupabaseRpc<KeywordSearchResult[]>(
            ctx,
            "keyword_search",
            {
              query_text: query,
              match_count: limit,
            }
          )

          return {
            content: formatKeywordResults(fallbackResults.slice(0, limit)),
            metadata: {
              degraded: true,
              reason: "embedding_unavailable",
              embedding_error:
                embeddingError instanceof Error
                  ? embeddingError.message
                  : String(embeddingError),
            },
          }
        } catch (rpcError) {
          const message =
            rpcError instanceof Error ? rpcError.message : String(rpcError)
          return {
            content: `Error: ${message}`,
            metadata: {
              degraded: true,
              reason: "embedding_unavailable",
            },
          }
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

        return {
          content: formatHybridResults(results.slice(0, limit)),
        }
      } catch (rpcError) {
        const message =
          rpcError instanceof Error ? rpcError.message : String(rpcError)
        return {
          content: `Error: ${message}`,
        }
      }
    },
  }

  registry.register(tool)
  return tool
}
