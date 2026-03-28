/**
 * @file ./src/services/webSearchService.ts
 * @description Tavily Web Search service for RAG pipeline.
 * @description_zh Tavily 网络搜索服务，为 RAG 管道提供实时网页检索。
 */

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY as string | undefined;
const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/**
 * Search the web via Tavily API.
 * Scoped to UIUC-related queries by default.
 */
export async function webSearch(
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeDomains?: string[];
  } = {},
): Promise<WebSearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.warn('[WebSearch] VITE_TAVILY_API_KEY not set, skipping web search');
    return [];
  }

  const {
    maxResults = 5,
    searchDepth = 'basic',
    includeDomains,
  } = options;

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `UIUC ${query}`,
        search_depth: searchDepth,
        max_results: maxResults,
        include_domains: includeDomains,
      }),
    });

    if (!response.ok) {
      console.warn('[WebSearch] Tavily API error:', response.status);
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
      }>;
    };

    return (data.results ?? []).map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  } catch (err) {
    console.warn('[WebSearch] Tavily search failed:', err);
    return [];
  }
}
