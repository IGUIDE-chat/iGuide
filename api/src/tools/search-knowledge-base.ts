import { getEmbeddingConfig } from "../lib/embedding-config";
import { EmbeddingClient } from "../lib/embeddings";
import { callSupabaseRpc } from "../lib/supabase-rpc";
import { ToolRegistry } from "./registry";
import type { RequestContext, ToolDefinition, ToolResult } from "./types";

const KNOWLEDGE_BASE_CATEGORIES = [
	"housing",
	"academics",
	"visa",
	"campus_life",
	"financial",
	"general",
] as const;

type KnowledgeBaseCategory = (typeof KNOWLEDGE_BASE_CATEGORIES)[number];

interface SearchKnowledgeBaseArgs {
	query: string;
	category?: KnowledgeBaseCategory;
	limit?: number;
}

interface HybridSearchResult {
	id: string;
	title: string;
	content: string;
	url: string;
	category: string;
	similarity: number | null;
	fts_rank: number | null;
	rrf_score: number;
}

interface KeywordSearchResult {
	id: string;
	title: string;
	content: string;
	url: string;
	category: string;
	fts_rank: number;
}

function isKnowledgeBaseCategory(
	value: unknown,
): value is KnowledgeBaseCategory {
	return (
		typeof value === "string" &&
		KNOWLEDGE_BASE_CATEGORIES.includes(value as KnowledgeBaseCategory)
	);
}

function normalizeLimit(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return 5;
	}

	return Math.min(Math.max(Math.floor(value), 1), 10);
}

function filterByCategory<T extends { category: string }>(
	results: T[],
	category?: KnowledgeBaseCategory,
): T[] {
	if (!category) {
		return results;
	}

	return results.filter((result) => result.category === category);
}

function buildSnippet(content: string): string {
	return content.slice(0, 300);
}

function formatHybridResults(results: HybridSearchResult[]): string {
	if (results.length === 0) {
		return "No knowledge base results found.";
	}

	return results
		.map(
			(result) =>
				`## ${result.title}\nScore: ${result.rrf_score.toFixed(4)}\nURL: ${result.url}\n\n${buildSnippet(result.content)}\n---`,
		)
		.join("\n");
}

function formatKeywordResults(results: KeywordSearchResult[]): string {
	if (results.length === 0) {
		return "No knowledge base results found.";
	}

	return results
		.map(
			(result) =>
				`## ${result.title}\nScore: ${result.fts_rank.toFixed(4)}\nURL: ${result.url}\n\n${buildSnippet(result.content)}\n---`,
		)
		.join("\n");
 }

function parseArgs(
	args: Record<string, unknown>,
): SearchKnowledgeBaseArgs | ToolResult {
	const { query, category, limit } = args;

	if (typeof query !== "string" || query.trim().length === 0) {
		return {
			content:
				"Error: query parameter is required and must be a non-empty string",
		};
	}

	if (category !== undefined && !isKnowledgeBaseCategory(category)) {
		return {
			content:
				"Error: category must be one of housing, academics, visa, campus_life, financial, general",
		};
	}

	return {
		query: query.trim(),
		category,
		limit: normalizeLimit(limit),
	};
}

export function createSearchKnowledgeBaseTool(
	registry: ToolRegistry,
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
				category: {
					type: "string",
					description: "Optional category filter",
					enum: KNOWLEDGE_BASE_CATEGORIES,
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
			ctx: RequestContext,
		): Promise<ToolResult> => {
			const parsedArgs = parseArgs(args);
			if ("content" in parsedArgs) {
				return parsedArgs;
			}

			const { query, category, limit } = parsedArgs;
			let queryEmbedding: number[];

			try {
				const embeddingClient = new EmbeddingClient(
					getEmbeddingConfig(ctx.env),
				);
				queryEmbedding = await embeddingClient.embedQuery(query);
			} catch (embeddingError) {
				try {
					const fallbackResults = await callSupabaseRpc<KeywordSearchResult[]>(
						ctx,
						"keyword_search",
						{
							query_text: query,
							match_count: limit,
						},
					);

					return {
						content: formatKeywordResults(
							filterByCategory(fallbackResults, category).slice(0, limit),
						),
						metadata: {
							degraded: true,
							reason: "embedding_unavailable",
							embedding_error:
								embeddingError instanceof Error
									? embeddingError.message
									: String(embeddingError),
						},
					};
				} catch (rpcError) {
					const message =
						rpcError instanceof Error ? rpcError.message : String(rpcError);
					return {
						content: `Error: ${message}`,
						metadata: {
							degraded: true,
							reason: "embedding_unavailable",
						},
					};
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
					},
				);

				return {
					content: formatHybridResults(
						filterByCategory(results, category).slice(0, limit),
					),
				};
			} catch (rpcError) {
				const message =
					rpcError instanceof Error ? rpcError.message : String(rpcError);
				return {
					content: `Error: ${message}`,
				};
			}
		},
	};

	registry.register(tool);
	return tool;
}
