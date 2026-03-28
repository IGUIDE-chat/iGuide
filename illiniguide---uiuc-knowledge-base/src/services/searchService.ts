/**
 * @file ./src/services/searchService.ts
 * @description Global Shared Component / Module
 * @description_zh QMD 知识库搜索服务。通过 /api/search 代理查询 QMD daemon。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type { SearchResult, SearchResponse, SearchMode } from '../types';

const SEARCH_ENDPOINT = '/api/search';

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
    mode: SearchMode = 'hybrid',
): Promise<SearchResponse> {
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

    return { results, query, region: region ?? undefined };
}

/** Quick BM25-only search (no LLM, faster). */
export async function quickSearch(
    query: string,
    lang: 'en' | 'zh' = 'en',
    limit = 5,
): Promise<SearchResponse> {
    return searchKnowledgeBase(query, lang, limit, 'bm25');
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
