/**
 * @file ./src/services/searchService.ts
 * @description Global Shared Component / Module
 * @description_zh QMD 知识库搜索服务。通过 /api/search 代理查询 QMD daemon。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type { SearchResult, SearchResponse, SearchMode } from '../types';

const SEARCH_ENDPOINT = import.meta.env.PROD
    ? (import.meta.env.VITE_API_GATEWAY_URL || 'https://api.iguide.chat') + '/api/search'
    : '/api/search';

// ── Session-level search cache ──────────────────────────────────
const sessionCache = new Map<string, { data: SearchResponse; ts: number }>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getSessionCache(key: string): SearchResponse | null {
    const entry = sessionCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > SESSION_CACHE_TTL) {
        sessionCache.delete(key);
        return null;
    }
    return entry.data;
}

/**
 * Search the QMD knowledge base via the local/prod gateway.
 *
 * In local Vite runs, /api/search is handled by the Vite-side
 * QMD gateway plugin.
 * In production, the API gateway is expected to route the request
 * to the appropriate QMD backend.
 */
export async function searchKnowledgeBase(
    query: string,
    lang: 'en' | 'zh' = 'en',
    limit = 10,
    mode: SearchMode = 'fusion',
): Promise<SearchResponse> {
    const cacheKey = JSON.stringify({ query: query.trim().toLowerCase(), lang, limit, mode });
    const cached = getSessionCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(SEARCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang, limit, mode }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Search failed: ${response.status}`);
    }

    const data: unknown = await response.json();
    const region = response.headers.get('X-QMD-Region') as 'cn' | 'global' | null;

    // QMD returns an array directly; normalize to SearchResponse
    const raw = Array.isArray(data) ? data : ((data as Record<string, unknown>).results as unknown[] ?? []);
    const results: SearchResult[] = raw.map(
        (r: unknown) => {
        const item = r as SearchResult;
        return {
            ...item,
            type: parseResultType(item.file),
            id: parseResultId(item.file),
        };
        },
    );

    const result: SearchResponse = { results, query, region: region ?? undefined };
    sessionCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
}

/** Quick BM25-only search (no LLM, faster). */
export async function quickSearch(
    query: string,
    lang: 'en' | 'zh' = 'en',
    limit = 5,
): Promise<SearchResponse> {
    return searchKnowledgeBase(query, lang, limit, 'fusion');
}

// ── Helpers ──────────────────────────────────────────────────────

function parseResultType(filePath: string): SearchResult['type'] {
    if (/\/dorms[\-\/]/.test(filePath) || /\/dorms\//.test(filePath)) return 'dorm';
    if (/\/articles[\-\/]/.test(filePath) || /\/articles\//.test(filePath)) return 'article';
    if (/\/crawled\//.test(filePath)) return 'crawled';
    return undefined;
}

function parseResultId(filePath: string): string | undefined {
    // Extract filename without extension: .../articles/isr.md -> isr
    const match = filePath.match(/\/([^/]+)\.md$/i);
    return match?.[1];
}
