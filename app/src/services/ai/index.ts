/**
 * @file ./src/services/ai/index.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { cozeProvider } from "./providers/cozeProvider"
import { geminiProvider } from "./providers/geminiProvider"
import { deepseekProvider } from "./providers/deepseekProvider"
import { type StreamChatResponseFn } from "./types"

// Force deepseek to ensure the transition from Coze takes effect regardless of Cloudflare env vars
const providerKey = "deepseek"
const providers = {
  coze: cozeProvider,
  gemini: geminiProvider,
  deepseek: deepseekProvider,
}
const activeProvider = providers[providerKey]

const getActiveAIProvider = () => activeProvider.id

const streamChatResponse: StreamChatResponseFn = (params) => {
  return activeProvider.streamChatResponse(params)
}

export { getActiveAIProvider, streamChatResponse }
