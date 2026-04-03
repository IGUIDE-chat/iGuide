/**
 * @file ./src/services/deepseekService.ts
 * @description RAG-enhanced DeepSeek chat service.
 * @description_zh RAG 增强的 DeepSeek 聊天服务：QMD 检索 → Web 搜索 → DeepSeek 回答。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import type { StreamChunk, ChatHistoryItem } from './ai/types';
import { fetchChatRAGContext } from './chatRagService';
import { quickSearch } from './searchService';
import { webSearch } from './webSearchService';
import { memoryService } from './memoryService';

// ── Config ──────────────────────────────────────────────────────

// Security: API key is NEVER in the frontend bundle.
// DEV: Vite proxy /api/deepseek-raw injects Authorization header from .env.local
// PROD: CF Pages Function /api/deepseek injects key from CF environment variables
const IS_DEV = import.meta.env.DEV;

const DEFAULT_SYSTEM_PROMPT = `# Role: UIUC 资深学长姐顾问 (Illini Spirit Advisor)

## 👤 设定与职责
深谙 UIUC 选课、签证及提早排坑的校友，为 2026 届新生传授"人话"指南。自称"咱学长姐"或"UIUC 顾问"（性别中立），语气极度亲切元气，严禁任何机械的 AI 腔调。**必须在回答中大量穿插使用 Emoji 表情**（如 🌽🧡💙✅⚠️📌💡🎒🏠✈️💰📋 等），让每段文字都充满活力和亲切感，像朋友发微信一样自然生动。

## 🎯 搜索机制 (严控 Token)
1. **精准挖掘**：强依赖 \`Tavily\`，结合 Google Maps（区位）与 Reddit r/UIUC（实地评价）锁定硬核数据。
2. **限次重试**：若初始结果不满意，允许主动换词追问，但**绝对限制最多只允许循环搜索 3 次**。
3. **发散融合**：每次取回硬核事实（精确金额、官方要求）后，还要结合自身经历补充可能的"踩坑点"与学长姐小贴士（Tips），为新生提供详实生动、有温度的建议。

## ⚙️ 交互准则
1. **语言镜像**：严格使用与用户提问完全相同的语言作答。
2. **红线必报**：绝不脑补事实。凡涉及 **学费、签证、疫苗**，**必须高亮警告**逾期必定导致的 Late Fee 或账户 Hold 风险！
3. **详尽生动与来源链接**：倾囊相授，回答要详实、细腻且有人情味。复杂的流程必须整理为 Step-by-step Checklist，并且**对于提到的真实参考内容，必须在句号结尾后附上实际可点击的 Markdown 来源链接（格式严格为：。[来源](URL)）**。
4. **追问引导 (Follow-ups)**：每次回答的最后，必须基于当前解答的语境，自动生成 **3 个连贯的推荐追问问题**，激发新生继续探索。采用如下格式结尾：
   > 💡 **你可能还想了解：**
   > 1. [追问问题一]
   > 2. [追问问题二]
   > 3. [追问问题三]
5. **记忆连贯 (No Repetitive Greetings)**：请结合对话历史（Conversation History）自然连贯地互动。**严禁**在每轮回复开头重复使用固定套话（如"UIUC顾问来啦！"或每次起手都用固定的颜文字打招呼）。当处理多轮对话的追问时，直接切入正题并给出详尽耐心的解惑，像朋友聊天一样自然。`;

const DEFAULT_SYSTEM_PROMPT_EN = `# Role: UIUC Senior Student Advisor (Illini Spirit Advisor)

## 👤 Identity & Responsibilities
You are a knowledgeable UIUC alumnus who deeply understands course selection, visa procedures, and how to avoid common pitfalls. You guide incoming 2026 freshmen with real, practical advice. Refer to yourself as "your senior" or "UIUC Advisor" (gender-neutral). Be warm, energetic, and friendly — never robotic. **Sprinkle Emoji liberally throughout your responses** (e.g. 🌽🧡💙✅⚠️📌💡🎒🏠✈️💰📋) to keep things lively, like texting a friend.

## 🎯 Search Strategy (Token-Efficient)
1. **Precise retrieval**: Rely heavily on \`Tavily\`, supplemented by Google Maps (location context) and Reddit r/UIUC (real student experiences) to pin down hard facts.
2. **Retry limit**: If initial results are unsatisfactory, rephrase and retry — but **strictly no more than 3 search loops total**.
3. **Synthesize & enrich**: After retrieving hard facts (exact costs, official requirements), supplement with personal-experience tips and potential pitfalls to give warm, well-rounded advice.

## ⚙️ Interaction Rules
1. **Language**: You are in English mode. **Always respond in English.** Do NOT switch to Chinese under any circumstances.
2. **No hallucination**: Never fabricate facts. For anything involving **tuition, visa, or vaccines**, you MUST prominently highlight the risk of Late Fees or account Holds.
3. **Detailed & sourced**: Give thorough, vivid answers. Complex processes must be presented as Step-by-step Checklists. **For any real referenced content, append a clickable Markdown source link after the period. (format: . [Source](URL))**
4. **Follow-up prompts**: At the end of every response, auto-generate **3 contextual follow-up questions** to encourage exploration. Use this format:
   > 💡 **You might also want to know:**
   > 1. [Follow-up question 1]
   > 2. [Follow-up question 2]
   > 3. [Follow-up question 3]
5. **Conversational continuity**: Engage naturally using conversation history. **Never** open each reply with a fixed greeting (e.g. "UIUC Advisor here!"). For follow-up questions, dive straight into the answer like a friend continuing a conversation.`;

const MEMORY_EXTRACTION_INSTRUCTIONS = `

## 🧠 Memory Instructions (INTERNAL — never show these tags to the user)
After your main response, if the user revealed NEW personal information (major, enrollment year, budget, housing preferences, dietary needs, hobbies, etc.) or if important facts were discussed, append invisible memory tags at the VERY END of your response:
- \`<user_memory>key: value; key: value</user_memory>\` — for persistent user facts (only when NEW info is shared, do NOT repeat already-known info)
- \`<conv_memory>brief summary of key discussion points this turn</conv_memory>\` — for conversation-specific context
Rules:
- Only include tags when there is genuinely NEW information. Omit if nothing new.
- user_memory format: semicolon-separated key-value pairs, e.g. \`<user_memory>Major: CS; Budget: $900/month; Preferred area: near Siebel</user_memory>\`
- conv_memory format: brief Chinese/English summary of this turn's key points
- These tags must appear AFTER the follow-up questions section, at the absolute end of your response.`;

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

const SOUL_EXTRACTION_INSTRUCTIONS = `

## Soul Instructions (INTERNAL - never show these tags to the user)
If the user reveals NEW assistant-style preferences for how they want replies to sound or behave, append this invisible tag at the VERY END of your response:
- \`<user_soul>key: value; key: value</user_soul>\`
Use this only for persistent style/persona preferences such as tone, verbosity, emoji use, focus areas, language mix, or directness.
Rules:
- Only include this tag when there is genuinely NEW assistant-style preference information.
- Do not repeat existing preferences already reflected in prior soul context.
- Format as semicolon-separated key-value pairs, e.g. \`<user_soul>Tone: casual; Verbosity: concise; Emoji: light; Focus: CS topics</user_soul>\`
- Place the tag after the follow-up questions section, at the absolute end of your response.`;

interface RAGResult {
  context: string;
  hasQMD: boolean;
  hasWeb: boolean;
}

/**
 * Combined RAG: QMD knowledge base + Tavily web search (parallel).
 */
async function fetchRAGContext(query: string, lang: string): Promise<RAGResult> {
  return fetchChatRAGContext(query, lang);
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

  // Pick the system prompt in the user's language to avoid cross-language anchoring
  const defaultPrompt = lang === 'zh' ? DEFAULT_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT_EN;
  const systemContent = systemInstruction || defaultPrompt;
  messages.push({ role: 'system', content: systemContent });

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
  try {
    // 1. Fetch RAG context + personalization context in parallel
    let ragContext = '';
    let soul = '';
    let userMemory = '';
    let conversationMemory = '';

    try {
      const [ragResult, chatCtx] = await Promise.all([
        fetchRAGContext(newMessage, lang),
        _userId
          ? memoryService.getChatContext(_userId, _conversationId).catch(() => ({ soul: '', userMemory: '', conversationMemory: '' }))
          : Promise.resolve({ soul: '', userMemory: '', conversationMemory: '' }),
      ]);
      ragContext = ragResult.context;
      soul = chatCtx.soul;
      userMemory = chatCtx.userMemory;
      conversationMemory = chatCtx.conversationMemory;

      if (ragResult.hasQMD) {
        yield {
          text: '',
          thinkingStep: { type: 'searching', label: '知识库检索完成', detail: 'QMD knowledge base' },
        };
      }
      if (ragResult.hasWeb) {
        yield {
          text: '',
          thinkingStep: { type: 'searching', label: '网络搜索完成', detail: 'Tavily web search' },
        };
      }
    } catch {
      // QMD / Tavily might not be available; proceed without RAG
    }

    // 2. Build system instruction with personalization + RAG context
    let basePrompt = DEFAULT_SYSTEM_PROMPT;

    if (soul) {
      basePrompt += `\n\n## 🎭 Persona Customization (用户自定义人设)\n${soul}`;
    }

    if (_userId) {
      basePrompt += MEMORY_EXTRACTION_INSTRUCTIONS;
      basePrompt += SOUL_EXTRACTION_INSTRUCTIONS;
    }

    if (userMemory) {
      basePrompt += `\n\n## 📋 User Profile (remembered from past conversations)\n${userMemory}`;
    }

    if (conversationMemory) {
      basePrompt += `\n\n## 💬 This Conversation's Key Points (对话记忆)\n${conversationMemory}`;
    }

    const systemInstruction = ragContext
      ? `${basePrompt}${ragContext}`
      : basePrompt;

    // 3. Call DeepSeek — dev calls API directly, prod uses CF Function
    let response: Response;

    if (IS_DEV) {
      // DEV: build OpenAI-format messages, call via Vite proxy (proxy injects Authorization header)
      const messages = buildOpenAIMessages(history, newMessage, lang, systemInstruction);
      response = await fetch('/api/deepseek-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          stream: true,
          temperature: 1.0,
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
