/**
 * @file ./src/services/deepseekService.ts
 * @description RAG-enhanced DeepSeek chat service.
 * @description_zh RAG 增强的 DeepSeek 聊天服务：QMD 检索 → Web 搜索 → DeepSeek 回答。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type { StreamChunk, ChatHistoryItem } from './ai/types';
import { quickSearch } from './searchService';
import { webSearch } from './webSearchService';

// ── Config ──────────────────────────────────────────────────────

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const IS_DEV = import.meta.env.DEV;

const DEFAULT_SYSTEM_PROMPT = `# Role: UIUC 资深学长姐顾问 (Illini Spirit Advisor)

## 👤 设定与职责
深谙 UIUC 选课、签证及提早排坑的校友，为 2026 届新生传授“人话”指南。自称“咱学长姐”或“UIUC 顾问”（性别中立），语气极度亲切元气 🌽🧡💙，严禁任何机械的 AI 腔调。

## 🎯 搜索机制 (严控 Token)
1. **精准挖掘**：强依赖 \`Tavily\`，结合 Google Maps（区位）与 Reddit r/UIUC（实地评价）锁定硬核数据。
2. **限次重试**：若初始结果不满意，允许主动换词追问，但**绝对限制最多只允许循环搜索 3 次**。
3. **极简截断**：每次取回结果仅提炼“核心事实”（精确金额、官方要求），残忍丢弃所有网页噪音，严防长上下文溢出。

## ⚙️ 交互准则
1. **语言镜像**：严格使用与用户提问完全相同的语言作答。
2. **红线必报**：绝不脑补事实。凡涉及 **学费、签证、疫苗**，**必须高亮警告**逾期必定导致的 Late Fee 或账户 Hold 风险！
3. **极简闭环与来源链接**：回答结构分明、拒绝车轱辘话。复杂的流程必须整理为 Step-by-step Checklist，并且**对于提到的真实参考内容，必须在句号结尾后附上实际可点击的 Markdown 来源链接（格式严格为：。[来源](URL)）**。
4. **追问引导 (Follow-ups)**：每次回答的最后，必须基于当前解答的语境，自动生成 **3 个连贯的推荐追问问题**，激发新生继续探索。采用如下格式结尾：
   > 💡 **你可能还想了解：**
   > 1. [追问问题一]
   > 2. [追问问题二]
   > 3. [追问问题三]
5. **记忆连贯 (No Repetitive Greetings)**：请结合对话历史（Conversation History）自然连贯地互动。**严禁**在每轮回复开头重复使用固定套话（如“UIUC顾问来啦！”或每次起手都用固定的颜文字打招呼）。当处理多轮对话的追问时，应不带任何废话，直接切入正题给出答案。`;

// ── RAG Context Builder ──────────────────────────────────────────

/**
 * Query QMD for relevant knowledge base chunks.
 */
async function fetchQMDContext(query: string, lang: string): Promise<string[]> {
  try {
    const { results } = await quickSearch(query, lang as 'en' | 'zh', 5);
    return results
      .filter(r => r.score > 0.3)
      .map(r => {
        const typeLabel = r.type === 'dorm' ? '🏠 Dorm' : r.type === 'article' ? '📄 Article' : '🌐 Web';
        const url = r.id ? `/${r.type === 'dorm' ? 'housing' : 'article'}/${r.id}` : 'N/A';
        return `[${typeLabel}] ${r.title} (relevance: ${r.score.toFixed(2)})\nURL: ${url}\n${r.snippet}`;
      });
  } catch (err) {
    console.warn('[RAG] QMD search failed:', err);
    return [];
  }
}

/**
 * Query Tavily for web search results.
 */
async function fetchWebContext(query: string): Promise<string[]> {
  try {
    const results = await webSearch(query, { maxResults: 3 });
    return results.map(
      r => `[🌐 Web] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 300)}`,
    );
  } catch (err) {
    console.warn('[RAG] Web search failed:', err);
    return [];
  }
}

interface RAGResult {
  context: string;
  hasQMD: boolean;
  hasWeb: boolean;
}

/**
 * Combined RAG: QMD knowledge base + Tavily web search (parallel).
 */
async function fetchRAGContext(query: string, lang: string): Promise<RAGResult> {
  const [qmdBlocks, webBlocks] = await Promise.all([
    fetchQMDContext(query, lang),
    fetchWebContext(query),
  ]);

  const allBlocks = [...qmdBlocks, ...webBlocks];
  if (!allBlocks.length) return { context: '', hasQMD: false, hasWeb: false };

  const context =
    `\n\n--- Retrieved Context ---\n${allBlocks.join('\n\n')}\n--- End Context ---\n\n` +
    `Use the above context to inform your answer. YOU MUST cite your sources by placing a Markdown link closely after the punctuation at the end of the relevant sentence (e.g. "这就是事实。[来源](URL)"). If the context doesn't cover the question, say so.`;

  return { context, hasQMD: qmdBlocks.length > 0, hasWeb: webBlocks.length > 0 };
}

// ── SSE Stream Parser ────────────────────────────────────────────

/**
 * Parse DeepSeek SSE stream (OpenAI-compatible format).
 * Each SSE line: data: {"choices":[{"delta":{"content":"..."}}]}
 */
async function* parseDeepSeekSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<StreamChunk> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let reasoningBuffer = '';
  let isInReasoning = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Flush remaining buffer
      if (buffer.trim()) {
        for (const line of buffer.split('\n')) {
          const chunk = parseLine(line.trim());
          if (chunk) yield chunk;
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;

        // Handle reasoning_content (DeepSeek R1 / thinking)
        if (delta.reasoning_content) {
          if (!isInReasoning) {
            isInReasoning = true;
            reasoningBuffer = '';
          }
          reasoningBuffer += delta.reasoning_content;
          yield {
            text: '',
            thinkingStep: {
              type: 'reasoning',
              label: '正在思考...',
              detail: reasoningBuffer,
            },
          };
          continue;
        }

        // Regular content
        if (delta.content) {
          if (isInReasoning) {
            isInReasoning = false;
            reasoningBuffer = '';
          }
          yield { text: delta.content };
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  function parseLine(line: string): StreamChunk | null {
    if (!line.startsWith('data: ') || line === 'data: [DONE]') return null;
    try {
      const json = JSON.parse(line.slice(6));
      const content = json.choices?.[0]?.delta?.content;
      return content ? { text: content } : null;
    } catch {
      return null;
    }
  }
}

// ── Message Builder ─────────────────────────────────────────────

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildOpenAIMessages(
  history: ChatHistoryItem[],
  newMessage: string,
  lang: string,
  systemInstruction?: string,
): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [];

  // System prompt with optional RAG context
  const systemContent = systemInstruction || DEFAULT_SYSTEM_PROMPT;
  const langHint = lang === 'zh'
    ? '\n\nIMPORTANT: The user prefers Chinese. Reply in Chinese (简体中文) unless they write in English.'
    : '';
  messages.push({ role: 'system', content: systemContent + langHint });

  // Conversation history
  for (const h of history) {
    messages.push({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.text,
    });
  }

  // Current user message
  messages.push({ role: 'user', content: newMessage });
  return messages;
}

// ── Main Streaming Function ──────────────────────────────────────

/**
 * Stream chat response from DeepSeek with optional RAG context injection.
 *
 * DEV mode:  builds OpenAI messages locally, calls DeepSeek API via Vite proxy
 * PROD mode: calls CF Function `/api/deepseek` which handles format translation
 *
 * Flow: User message → QMD search → inject context → DeepSeek streaming
 */
export const streamDeepSeekChat = async function* (
  history: ChatHistoryItem[],
  newMessage: string,
  lang: string = 'en',
  _conversationId?: string,
  _userId?: string,
): AsyncGenerator<StreamChunk> {
  // Validate API key in dev
  if (IS_DEV && !DEEPSEEK_API_KEY) {
    yield { text: 'Error: VITE_DEEPSEEK_API_KEY missing in .env.local (Dev Mode).' };
    return;
  }

  try {
    // 1. RAG: fetch context from QMD + Web search (parallel)
    let ragContext = '';
    try {
      const rag = await fetchRAGContext(newMessage, lang);
      ragContext = rag.context;
      if (rag.hasQMD) {
        yield {
          text: '',
          thinkingStep: { type: 'searching', label: '知识库检索完成', detail: 'QMD knowledge base' },
        };
      }
      if (rag.hasWeb) {
        yield {
          text: '',
          thinkingStep: { type: 'searching', label: '网络搜索完成', detail: 'Tavily web search' },
        };
      }
    } catch {
      // QMD / Tavily might not be available; proceed without RAG
    }

    // 2. Build system instruction with RAG context
    const systemInstruction = ragContext
      ? `${DEFAULT_SYSTEM_PROMPT}${ragContext}`
      : undefined;

    // 3. Call DeepSeek — dev calls API directly, prod uses CF Function
    let response: Response;

    if (IS_DEV) {
      // DEV: build OpenAI-format messages, call via Vite proxy
      const messages = buildOpenAIMessages(history, newMessage, lang, systemInstruction);
      response = await fetch('/api/deepseek-raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          stream: true,
          temperature: 0.8,
        }),
      });
    } else {
      // PROD: CF Function handles format translation
      response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          newMessage,
          lang,
          stream: true,
          systemInstruction,
        }),
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `DeepSeek API returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream') && response.body) {
      // SSE streaming
      const reader = response.body.getReader();
      yield* parseDeepSeekSSE(reader);
    } else {
      // Fallback: non-streaming JSON response
      const data = (await response.json()) as { reply?: string };
      if (data.reply) {
        yield { text: data.reply };
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeepSeek] Stream error:', msg);
    yield { text: `\n(Error: ${msg})` };
  }
};
