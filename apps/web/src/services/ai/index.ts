import { deepseekProvider } from "./providers/deepseekProvider"
import { geminiProvider } from "./providers/geminiProvider"
import { StreamChatResponseFn } from "./types"

const providerKey = "deepseek"
const providers = {
  gemini: geminiProvider,
  deepseek: deepseekProvider,
}
const activeProvider = providers[providerKey]

export const getActiveAIProvider = () => activeProvider.id

export const streamChatResponse: StreamChatResponseFn = (
  history,
  newMessage,
  lang,
  conversationId,
  userId,
) => {
  return activeProvider.streamChatResponse(history, newMessage, lang, conversationId, userId)
}
