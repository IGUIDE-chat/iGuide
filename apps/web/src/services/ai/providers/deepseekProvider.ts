import { streamDeepSeekChat } from "../../deepseekService"
import type { AIProvider } from "../types"

export const deepseekProvider: AIProvider = {
  id: "deepseek",
  streamChatResponse: (history, newMessage, lang, conversationId, userId) =>
    streamDeepSeekChat(history, newMessage, lang, conversationId, userId),
}
