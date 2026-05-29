/**
 * @file ./src/services/deepseekService.ts
 * @description RAG-enhanced DeepSeek chat service.
 * @description_zh RAG 增强的 DeepSeek 聊天服务：QMD 检索 → Web 搜索 → DeepSeek 回答。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type ChatHistoryItem, type StreamChunk } from "./ai/types"
import { fetchChatRAGContext, isToolUseRagEnabled } from "./chatRagService"
import { parseDeepSeekSSEStream } from "./deepseekSse"
import { quickSearch } from "./searchService"
import { webSearch } from "./webSearchService"
import { memoryService } from "./memoryService"
import defaultSystemPrompt from "./prompts/deepseek-default-system.md?raw"
import memoryExtractionInstructions from "./prompts/deepseek-memory-extraction.md?raw"
import soulExtractionInstructions from "./prompts/deepseek-soul-extraction.md?raw"
import languageZhPrompt from "./prompts/language-zh.md?raw"
import languageEnPrompt from "./prompts/language-en.md?raw"

// ── Config ──────────────────────────────────────────────────────

// Security: API key is NEVER in the frontend bundle.
// DEV: Vite proxy /api/deepseek-raw injects Authorization header from .env.local
// PROD: CF Pages Function /api/deepseek injects key from CF environment variables
const viteEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>
  }
).env
const IS_DEV = Boolean(viteEnv?.DEV)
const CHAT_ENDPOINT = IS_DEV
  ? "/api/chat"
  : `${viteEnv?.VITE_API_GATEWAY_URL ?? "https://api.iguide.chat"}/chat`

// ── RAG Context Builder ──────────────────────────────────────────

/**
 * Query QMD for relevant knowledge base chunks.
 */
async function _fetchQMDContext(
  query: string,
  lang: string
): Promise<string[]> {
  try {
    const { results } = await quickSearch(query, lang as "en" | "zh", 5)
    return results
      .filter((r) => r.score > 0.3)
      .map((r) => {
        let typeLabel: string
        if (r.type === "dorm") {
          typeLabel = "🏠 Dorm"
        } else if (r.type === "article") {
          typeLabel = "📄 Article"
        } else {
          typeLabel = "🌐 Web"
        }
        const url = r.id
          ? `/${r.type === "dorm" ? "housing" : "article"}/${r.id}`
          : "N/A"
        return `[${typeLabel}] ${r.title} (relevance: ${r.score.toFixed(2)})\nURL: ${url}\n${r.snippet}`
      })
  } catch (err) {
    console.warn("[RAG] QMD search failed:", err)
    return []
  }
}

/**
 * Query Tavily for web search results.
 */
async function _fetchWebContext(query: string): Promise<string[]> {
  try {
    const results = await webSearch(query, { maxResults: 3 })
    return results.map(
      (r) => `[🌐 Web] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 300)}`
    )
  } catch (err) {
    console.warn("[RAG] Web search failed:", err)
    return []
  }
}

const DEFAULT_SYSTEM_PROMPT = defaultSystemPrompt.trim()
const MEMORY_EXTRACTION_INSTRUCTIONS = memoryExtractionInstructions.trim()
const SOUL_EXTRACTION_INSTRUCTIONS = soulExtractionInstructions.trim()
const LANGUAGE_PROMPTS = {
  zh: languageZhPrompt.trim(),
  en: languageEnPrompt.trim(),
} as const

interface RAGResult {
  context: string
  hasQMD: boolean
  hasWeb: boolean
}

/**
 * Combined RAG: QMD knowledge base + Tavily web search (parallel).
 */
async function fetchRAGContext(
  query: string,
  lang: string
): Promise<RAGResult> {
  return fetchChatRAGContext(query, lang)
}

// ── Message Builder ─────────────────────────────────────────────

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

function buildOpenAIMessages(
  history: ChatHistoryItem[],
  newMessage: string,
  lang: string,
  systemInstruction?: string
): OpenAIMessage[] {
  const messages: OpenAIMessage[] = []

  // System prompt with optional RAG context
  const systemContent = systemInstruction ?? DEFAULT_SYSTEM_PROMPT
  const languagePrompt =
    lang === "zh" ? LANGUAGE_PROMPTS.zh : LANGUAGE_PROMPTS.en
  messages.push({
    role: "system",
    content: [systemContent, languagePrompt].filter(Boolean).join("\n\n"),
  })

  // Conversation history
  for (const h of history) {
    messages.push({
      role: h.role === "model" ? "assistant" : "user",
      content: h.text,
    })
  }

  // Current user message
  messages.push({ role: "user", content: newMessage })
  return messages
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
  lang: string = "en",
  options?: { conversationId?: string; userId?: string }
): AsyncGenerator<StreamChunk> {
  const conversationId = options?.conversationId
  const userId = options?.userId
  try {
    const useToolUseRag = isToolUseRagEnabled()

    if (useToolUseRag) {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          history,
          conversationId,
          userId,
          lang,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error ??
            `Chat API returned ${response.status}`
        )
      }

      const contentType = response.headers.get("content-type") ?? ""

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader()
        yield* parseDeepSeekSSEStream(reader, lang as "en" | "zh")
        return
      }

      const data = (await response.json()) as { reply?: string; text?: string }
      if (data.reply || data.text) {
        yield { text: data.reply ?? data.text ?? "" }
      }
      return
    }

    // 1. Fetch RAG context + personalization context in parallel
    let ragContext = ""
    let soul = ""
    let userMemory = ""
    let conversationMemory = ""

    try {
      const [ragResult, chatCtx] = await Promise.all([
        fetchRAGContext(newMessage, lang),
        _userId
          ? memoryService
              .getChatContext(_userId, _conversationId)
              .catch(() => ({
                soul: "",
                userMemory: "",
                conversationMemory: "",
              }))
          : Promise.resolve({
              soul: "",
              userMemory: "",
              conversationMemory: "",
            }),
      ])
      ragContext = ragResult.context
      soul = chatCtx.soul
      userMemory = chatCtx.userMemory
      conversationMemory = chatCtx.conversationMemory

      if (ragResult.hasQMD) {
        yield {
          text: "",
          thinkingStep: {
            type: "searching",
            label:
              lang === "zh" ? "知识库检索完成" : "Knowledge base retrieved",
            detail: "QMD knowledge base",
          },
        }
      }
      if (ragResult.hasWeb) {
        yield {
          text: "",
          thinkingStep: {
            type: "searching",
            label: lang === "zh" ? "网络搜索完成" : "Web search complete",
            detail: "Tavily web search",
          },
        }
      }
    } catch {
      // QMD / Tavily might not be available; proceed without RAG
    }

    // 2. Build system instruction with personalization + RAG context
    const basePrompt = [
      DEFAULT_SYSTEM_PROMPT,
      soul ? `## 🎭 Persona Customization (用户自定义人设)\n${soul}` : "",
      _userId ? MEMORY_EXTRACTION_INSTRUCTIONS : "",
      _userId ? SOUL_EXTRACTION_INSTRUCTIONS : "",
      userMemory
        ? `## 📋 User Profile (remembered from past conversations)\n${userMemory}`
        : "",
      conversationMemory
        ? `## 💬 This Conversation's Key Points (对话记忆)\n${conversationMemory}`
        : "",
    ]
      .filter((s) => s?.trim())
      .join("\n\n")

    const systemInstruction = [basePrompt, ragContext]
      .filter((s) => s?.trim())
      .join("\n\n")

    // 3. Call DeepSeek — dev calls API directly, prod uses CF Function
    let response: Response

    if (IS_DEV) {
      // DEV: build OpenAI-format messages, call via Vite proxy (proxy injects Authorization header)
      const messages = buildOpenAIMessages(
        history,
        newMessage,
        lang,
        systemInstruction
      )
      response = await fetch("/api/deepseek-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          stream: true,
          temperature: 1.0,
        }),
      })
    } else {
      // PROD: CF Function handles format translation
      response = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          newMessage,
          lang,
          stream: true,
          systemInstruction,
        }),
      })
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(
        (err as { error?: string }).error ??
          `DeepSeek API returned ${response.status}`
      )
    }

    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("text/event-stream") && response.body) {
      // SSE streaming
      const reader = response.body.getReader()
      yield* parseDeepSeekSSEStream(reader, lang as "en" | "zh")
    } else {
      // Fallback: non-streaming JSON response
      const data = (await response.json()) as { reply?: string }
      if (data.reply) {
        yield { text: data.reply }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[DeepSeek] Stream error:", msg)
    yield { text: `\n(Error: ${msg})` }
  }
}
