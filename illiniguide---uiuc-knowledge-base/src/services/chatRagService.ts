import type { SearchResult } from '../types';
import { quickSearch } from './searchService';
import {
  isUiucOfficialUrl,
  type WebSearchResult,
  webSearchWithOfficialPriority,
} from './webSearchService';

const IS_DEV = import.meta.env.DEV;
const QMD_RESULT_LIMIT = 5;
const WEB_RESULT_LIMIT = 3;
const INTERNAL_DORM_ROUTE = '/dorms';
const INTERNAL_ARTICLE_ROUTE = '/library/article';
const GENERIC_QUERY_TOKENS = new Set([
  'uiuc',
  'illinois',
  'university',
  'student',
  'campus',
]);
const ASCII_STOPWORDS = new Set([
  'a',
  'about',
  'an',
  'and',
  'are',
  'at',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'me',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'when',
  'where',
  'which',
  'with',
]);

const OFFICIAL_DORM_URLS: Record<string, string> = {
  isr: 'https://www.housing.illinois.edu/living-communities/halls/isr',
  nugent: 'https://www.housing.illinois.edu/living-communities/halls/nugent',
  wassaja: 'https://www.housing.illinois.edu/living-communities/halls/wassaja',
  bousefield: 'https://www.housing.illinois.edu/living-communities/halls/bousfield',
  par: 'https://www.housing.illinois.edu/living-communities/halls/par',
  far: 'https://www.housing.illinois.edu/living-communities/halls/far',
  allen: 'https://www.housing.illinois.edu/living-communities/halls/allen',
  'busey-evans': 'https://www.housing.illinois.edu/living-communities/halls/busey-evans',
  snyder: 'https://www.housing.illinois.edu/living-communities/halls/snyder',
  hopkins: 'https://www.housing.illinois.edu/living-communities/halls/hopkins',
  weston: 'https://www.housing.illinois.edu/living-communities/halls/weston',
  scott: 'https://www.housing.illinois.edu/living-communities/halls/scott',
  taft: 'https://www.housing.illinois.edu/living-communities/halls/taft-van-doren',
  'van-doren': 'https://www.housing.illinois.edu/living-communities/halls/taft-van-doren',
  daniels: 'https://www.housing.illinois.edu/living-communities/halls/daniels',
  sherman: 'https://www.housing.illinois.edu/living-communities/halls/sherman',
  lar: 'https://www.housing.illinois.edu/living-communities/halls/lar',
};

const QUERY_EXPANSION_RULES: Array<{ pattern: RegExp; terms: string[] }> = [
  { pattern: /grainger|工程图书馆|工图/i, terms: ['Grainger Engineering Library'] },
  { pattern: /mckinley|麦金利|校医院/i, terms: ['McKinley Health Center'] },
  { pattern: /quad\s*day|社团招新|百团大战/i, terms: ['Quad Day', 'RSO fair'] },
  { pattern: /mtd|公交|巴士|bus/i, terms: ['MTD bus', 'transit'] },
  { pattern: /safe\s*walk|safe\s*ride|夜路|陪走|护送/i, terms: ['SafeWalks', 'SafeRides'] },
  { pattern: /选课|注册|抢课|registration/i, terms: ['course registration'] },
  { pattern: /自习|学习地点|图书馆|study/i, terms: ['study spots', 'library'] },
  { pattern: /食堂|餐厅|吃饭|dining/i, terms: ['dining hall'] },
  { pattern: /医疗|健康|疫苗|保险|health/i, terms: ['health services'] },
  { pattern: /签证|国际生|i-20|opt|cpt|visa/i, terms: ['international student services'] },
  { pattern: /宿舍|住宿|housing|dorm/i, terms: ['housing', 'dorm'] },
  { pattern: /户型图|平面图|floor\s*plan/i, terms: ['floor plan'] },
  { pattern: /官网|official|source/i, terms: ['official website'] },
  { pattern: /isr|伊利诺伊街/i, terms: ['Illinois Street Residence Hall', 'ISR'] },
  { pattern: /nugent|纽金特/i, terms: ['Nugent Hall'] },
  { pattern: /wassaja|瓦萨加/i, terms: ['Wassaja Hall'] },
  { pattern: /bousefield|布斯菲尔德/i, terms: ['Bousfield Hall'] },
  { pattern: /par|宾州大道|宾夕法尼亚/i, terms: ['Pennsylvania Avenue Residence Hall', 'PAR'] },
  { pattern: /far|佛州大道|佛罗里达大道/i, terms: ['Florida Avenue Residence Hall', 'FAR'] },
  { pattern: /allen|艾伦/i, terms: ['Allen Hall'] },
  { pattern: /busey|evans|布西|埃文斯/i, terms: ['Busey-Evans'] },
  { pattern: /snyder|斯奈德/i, terms: ['Snyder Hall'] },
  { pattern: /hopkins|霍普金斯/i, terms: ['Hopkins Hall'] },
  { pattern: /weston|韦斯顿/i, terms: ['Weston Hall'] },
  { pattern: /scott|斯科特/i, terms: ['Scott Hall'] },
  { pattern: /taft|塔夫脱/i, terms: ['Taft Hall'] },
  { pattern: /van[\s-]?doren|范多伦/i, terms: ['Van Doren Hall'] },
  { pattern: /daniels|丹尼尔斯/i, terms: ['Daniels Hall'] },
  { pattern: /sherman|舍曼/i, terms: ['Sherman Hall'] },
  { pattern: /lar|林肯大道/i, terms: ['Lincoln Avenue Residence Hall', 'LAR'] },
];

interface RankedContextBlock {
  text: string;
  priority: number;
}

export interface ChatRAGResult {
  context: string;
  hasQMD: boolean;
  hasWeb: boolean;
}

function containsChinese(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(normalized);
  }

  return deduped;
}

function extractAsciiKeywords(query: string): string[] {
  const matches: string[] = query.match(/[A-Za-z][A-Za-z0-9&-]*/g) ?? [];

  return matches.filter((token) => {
    const normalized = token.toLowerCase();
    if (ASCII_STOPWORDS.has(normalized)) return false;
    if (token.length === 1) return false;
    if (token.length === 2 && token === token.toLowerCase()) return false;
    return true;
  });
}

function buildStaticEnglishQuery(query: string): string | null {
  const terms: string[] = [];

  for (const rule of QUERY_EXPANSION_RULES) {
    if (rule.pattern.test(query)) {
      terms.push(...rule.terms);
    }
  }

  terms.push(...extractAsciiKeywords(query));

  const deduped = dedupeStrings(terms);
  if (!deduped.length) return null;

  if (!deduped.some((term) => GENERIC_QUERY_TOKENS.has(term.toLowerCase()))) {
    deduped.unshift('UIUC');
  }

  return normalizeWhitespace(deduped.join(' '));
}

function isUsableEnglishQuery(query: string | null): query is string {
  if (!query) return false;

  const meaningfulTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && !GENERIC_QUERY_TOKENS.has(token));

  return meaningfulTokens.length >= 2;
}

function mergeEnglishQueries(staticQuery: string | null, rewrittenQuery: string | null): string | null {
  if (!staticQuery && !rewrittenQuery) return null;
  if (!rewrittenQuery) return staticQuery;
  if (!staticQuery) return rewrittenQuery;

  const merged = dedupeStrings([
    ...rewrittenQuery.split(/\s+/),
    ...staticQuery.split(/\s+/),
  ]);

  return merged.length ? normalizeWhitespace(merged.join(' ')) : null;
}

function parseDeepSeekReply(data: unknown): string | null {
  const payload = data as {
    reply?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  return normalizeWhitespace(
    payload.reply ??
      payload.choices?.[0]?.message?.content ??
      '',
  ) || null;
}

async function rewriteQueryToEnglish(query: string, staticQuery: string | null): Promise<string | null> {
  if (IS_DEV && !DEEPSEEK_API_KEY) return null;

  const messages = [
    {
      role: 'system',
      content:
        'You rewrite UIUC student questions into short English search queries. ' +
        'Return ONLY the search query, under 12 words, using official UIUC terminology when possible.',
    },
    {
      role: 'user',
      content: [
        `Original query: ${query}`,
        staticQuery ? `Known UIUC hints: ${staticQuery}` : '',
        'Return one concise English search query only.',
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];

  try {
    const response = IS_DEV
      ? await fetch('/api/deepseek-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            stream: false,
            temperature: 0.1,
          }),
        })
      : await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            stream: false,
          }),
        });

    if (!response.ok) {
      console.warn('[RAG] Query rewrite failed:', response.status);
      return null;
    }

    const data = await response.json();
    const rewritten = parseDeepSeekReply(data);
    if (!rewritten) return null;

    return rewritten.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.warn('[RAG] Query rewrite exception:', error);
    return null;
  }
}

async function buildSearchQueries(query: string, lang: string): Promise<string[]> {
  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) return [];

  const queries = [normalizedQuery];
  const shouldExpandEnglish = lang === 'zh' || containsChinese(normalizedQuery);
  if (!shouldExpandEnglish) return queries;

  const staticQuery = buildStaticEnglishQuery(normalizedQuery);
  let englishQuery = staticQuery;

  if (!isUsableEnglishQuery(staticQuery)) {
    const rewrittenQuery = await rewriteQueryToEnglish(normalizedQuery, staticQuery);
    englishQuery = mergeEnglishQueries(staticQuery, rewrittenQuery);
  }

  if (englishQuery && englishQuery.toLowerCase() !== normalizedQuery.toLowerCase()) {
    queries.push(englishQuery);
  }

  return dedupeStrings(queries);
}

function getResultKey(result: SearchResult): string {
  return result.file || `${result.type ?? 'unknown'}:${result.id ?? result.title}`;
}

function readMetadataUrl(result: SearchResult): string | null {
  const metadata = result.metadata as Record<string, unknown> | undefined;
  if (!metadata) return null;

  const candidates = [
    metadata.url,
    metadata.doc_url,
    metadata.canonical_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function getPreferredQmdUrl(result: SearchResult): string {
  const metadataUrl = readMetadataUrl(result);
  if (metadataUrl && result.type === 'crawled') {
    return metadataUrl;
  }

  if (result.type === 'dorm' && result.id) {
    return OFFICIAL_DORM_URLS[result.id] ?? `${INTERNAL_DORM_ROUTE}/${result.id}`;
  }

  if (result.type === 'article' && result.id) {
    return `${INTERNAL_ARTICLE_ROUTE}/${result.id}`;
  }

  return metadataUrl ?? 'N/A';
}

function getQmdPriority(result: SearchResult): number {
  const preferredUrl = getPreferredQmdUrl(result);
  let priority = result.score;

  if (isUiucOfficialUrl(preferredUrl)) {
    priority += 100;
  }

  if (result.type === 'dorm') {
    priority += 5;
  }

  return priority;
}

function mergeQmdResults(results: SearchResult[]): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  for (const result of results) {
    const key = getResultKey(result);
    const existing = merged.get(key);

    if (!existing || getQmdPriority(result) > getQmdPriority(existing)) {
      merged.set(key, result);
    }
  }

  return [...merged.values()].sort((a, b) => getQmdPriority(b) - getQmdPriority(a));
}

function buildQmdBlocks(results: SearchResult[]): RankedContextBlock[] {
  return results
    .filter((result) => result.score > 0.3)
    .map((result) => {
      const preferredUrl = getPreferredQmdUrl(result);
      const typeLabel =
        result.type === 'dorm' ? 'Dorm' : result.type === 'article' ? 'Article' : 'Doc';

      return {
        text: `[${typeLabel}] ${result.title} (relevance: ${result.score.toFixed(2)})\nURL: ${preferredUrl}\n${result.snippet}`,
        priority: getQmdPriority(result),
      };
    })
    .slice(0, QMD_RESULT_LIMIT);
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function mergeWebResults(results: WebSearchResult[]): WebSearchResult[] {
  const merged = new Map<string, WebSearchResult>();

  for (const result of results) {
    const key = normalizeUrlKey(result.url);
    const existing = merged.get(key);

    if (!existing || result.score > existing.score || (isUiucOfficialUrl(result.url) && !isUiucOfficialUrl(existing.url))) {
      merged.set(key, result);
    }
  }

  return [...merged.values()];
}

function getWebPriority(result: WebSearchResult): number {
  const relatedText = `${result.title} ${result.url} ${result.content}`.toLowerCase();
  let priority = result.score;

  if (isUiucOfficialUrl(result.url)) {
    priority += 100;
  } else if (/uiuc|illinois|illini/.test(relatedText)) {
    priority += 20;
  }

  return priority;
}

function buildWebBlocks(results: WebSearchResult[]): RankedContextBlock[] {
  return mergeWebResults(results)
    .sort((a, b) => getWebPriority(b) - getWebPriority(a))
    .slice(0, WEB_RESULT_LIMIT)
    .map((result) => ({
      text: `[Web] ${result.title}\nURL: ${result.url}\n${result.content.slice(0, 300)}`,
      priority: getWebPriority(result),
    }));
}

export async function fetchChatRAGContext(query: string, lang: string): Promise<ChatRAGResult> {
  const queries = await buildSearchQueries(query, lang);
  const primaryQuery = queries[0] ?? normalizeWhitespace(query);
  const englishQuery = queries.find((candidate) => candidate !== primaryQuery) ?? null;

  const qmdSearches = [
    quickSearch(primaryQuery, (lang === 'zh' ? 'zh' : 'en') as 'en' | 'zh', QMD_RESULT_LIMIT)
      .then((response) => response.results)
      .catch((error) => {
        console.warn('[RAG] QMD search failed:', error);
        return [] as SearchResult[];
      }),
  ];

  if (englishQuery) {
    qmdSearches.push(
      quickSearch(englishQuery, 'en', QMD_RESULT_LIMIT)
        .then((response) => response.results)
        .catch((error) => {
          console.warn('[RAG] English QMD search failed:', error);
          return [] as SearchResult[];
        }),
    );
  }

  const [qmdResults, webResults] = await Promise.all([
    Promise.all(qmdSearches).then((nested) => mergeQmdResults(nested.flat())),
    webSearchWithOfficialPriority(queries, {
      maxResults: WEB_RESULT_LIMIT,
      searchDepth: 'basic',
    }).catch((error) => {
      console.warn('[RAG] Web search failed:', error);
      return [] as WebSearchResult[];
    }),
  ]);

  const rankedBlocks = [
    ...buildQmdBlocks(qmdResults),
    ...buildWebBlocks(webResults),
  ].sort((a, b) => b.priority - a.priority);

  if (!rankedBlocks.length) {
    return { context: '', hasQMD: false, hasWeb: false };
  }

  const context =
    `\n\n--- Retrieved Context ---\n${rankedBlocks.map((block) => block.text).join('\n\n')}\n--- End Context ---\n\n` +
    'Use the above context to inform your answer. Prefer citing UIUC official URLs under illinois.edu whenever they support the statement. ' +
    'Only use internal app routes or non-official sources when no UIUC official URL is available. ' +
    'Place the Markdown source link close to the sentence it supports.';

  return {
    context,
    hasQMD: qmdResults.length > 0,
    hasWeb: webResults.length > 0,
  };
}
