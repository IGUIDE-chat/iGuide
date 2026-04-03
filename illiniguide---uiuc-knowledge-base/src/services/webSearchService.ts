/**
 * @file ./src/services/webSearchService.ts
 * @description Tavily Web Search service for RAG pipeline.
 * @description_zh Tavily 网络搜索服务，为 RAG 管道提供实时网页检索。
 */

// Security: API key is NEVER exposed to frontend.
// DEV:  Vite proxy /api/tavily → https://api.tavily.com (key injected by vite.config.ts server proxy)
// PROD: Cloudflare Pages Function /api/tavily injects TAVILY_API_KEY from CF env vars
const IS_DEV = import.meta.env.DEV;
const TAVILY_API_KEY = import.meta.env.TAVILY_API_KEY as string | undefined; // only available in dev via vite proxy
const TAVILY_PROXY_URL = '/api/tavily'; // CF Pages Function (prod) or Vite proxy (dev)
const UIUC_OFFICIAL_HOST = 'illinois.edu';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function isUiucOfficialUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === UIUC_OFFICIAL_HOST || hostname.endsWith(`.${UIUC_OFFICIAL_HOST}`);
  } catch {
    return false;
  }
}

function isUiucRelatedResult(result: WebSearchResult): boolean {
  const combined = `${result.title} ${result.url} ${result.content}`.toLowerCase();
  return /uiuc|illinois|illini/.test(combined);
}

function mergeWebResults(results: WebSearchResult[]): WebSearchResult[] {
  const merged = new Map<string, WebSearchResult>();

  for (const result of results) {
    const key = normalizeUrlKey(result.url);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, result);
      continue;
    }

    const resultScore = getResultPriority(result);
    const existingScore = getResultPriority(existing);
    if (resultScore > existingScore) {
      merged.set(key, result);
    }
  }

  return [...merged.values()];
}

function getResultPriority(result: WebSearchResult): number {
  let priority = result.score;
  if (isUiucOfficialUrl(result.url)) {
    priority += 100;
  } else if (isUiucRelatedResult(result)) {
    priority += 20;
  }
  return priority;
}

async function runTavilySearch(
  searchQuery: string,
  options: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeDomains?: string[];
  },
): Promise<WebSearchResult[]> {
  const {
    maxResults = 5,
    searchDepth = 'basic',
    includeDomains,
  } = options;

  // DEV: proxy forwards to Tavily with key from vite.config.ts server proxy header
  // PROD: CF Pages Function /api/tavily injects key from CF environment variables
  const body: Record<string, unknown> = {
    query: searchQuery,
    search_depth: searchDepth,
    max_results: maxResults,
  };
  if (includeDomains?.length) body.include_domains = includeDomains;

  // In dev mode, inject key directly (still goes through proxy, not exposed in bundle)
  if (IS_DEV && TAVILY_API_KEY) body.api_key = TAVILY_API_KEY;

  const response = await fetch(TAVILY_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  return (data.results ?? []).map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
  }));
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
  // In dev, warn if key missing (won't work without it)
  if (IS_DEV && !TAVILY_API_KEY) {
    console.warn('[WebSearch] TAVILY_API_KEY not set in .env.local, skipping web search');
    return [];
  }

  try {
    return await runTavilySearch(`UIUC ${query}`, options);
  } catch (err) {
    console.warn('[WebSearch] Tavily search failed:', err);
    return [];
  }
}

export async function webSearchWithOfficialPriority(
  queries: string[],
  options: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
  } = {},
): Promise<WebSearchResult[]> {
  // In dev, warn if key missing
  if (IS_DEV && !TAVILY_API_KEY) {
    console.warn('[WebSearch] TAVILY_API_KEY not set in .env.local, skipping web search');
    return [];
  }

  const { maxResults = 5, searchDepth = 'basic' } = options;
  const uniqueQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
  if (!uniqueQueries.length) return [];

  try {
    const officialResults = (
      await Promise.all(
        uniqueQueries.map((query) =>
          runTavilySearch(`site:${UIUC_OFFICIAL_HOST} UIUC ${query}`, {
            maxResults,
            searchDepth,
            includeDomains: [UIUC_OFFICIAL_HOST],
          }),
        ),
      )
    ).flat();

    const mergedOfficialResults = mergeWebResults(officialResults)
      .sort((a, b) => getResultPriority(b) - getResultPriority(a))
      .slice(0, maxResults);

    const hasEnoughOfficialResults = mergedOfficialResults.length >= Math.min(maxResults, 2);
    if (hasEnoughOfficialResults) {
      return mergedOfficialResults;
    }

    const fallbackResults = (
      await Promise.all(uniqueQueries.map((query) => webSearch(query, { maxResults, searchDepth })))
    ).flat();

    return mergeWebResults([...mergedOfficialResults, ...fallbackResults])
      .sort((a, b) => getResultPriority(b) - getResultPriority(a))
      .slice(0, maxResults);
  } catch (err) {
    console.warn('[WebSearch] Official-priority search failed:', err);
    return [];
  }
}
