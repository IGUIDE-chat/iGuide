/**
 * @file ./src/services/searchService.ts
 * @description Global Shared Component / Module
 * @description_zh QMD 知识库搜索服务。通过 /api/search 代理查询 QMD daemon。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type { SearchResult, SearchResponse, SearchMode } from '../types';

const SEARCH_ENDPOINT = '/api/search';

/**
 * Search the QMD knowledge base via the gateway proxy.
 *
 * In dev mode, Vite proxies /api/search → localhost:3100.
 * In production, the CF Worker gateway routes to the appropriate
 * QMD node (CN or Global) based on user geo-IP.
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
    // Extract filename without extension: …/dorms/isr.md ��� isr
    const match = filePath.match(/\/([^/]+)\.md$/);
    return match?.[1];
}
