/**
 * @file ./src/services/ai/providers/deepseekProvider.ts
 * @description DeepSeek AI provider with RAG-enhanced streaming.
 */

import  { type AIProvider } from "../types";
import { streamDeepSeekChat } from "../../deepseekService";

export const deepseekProvider: AIProvider = {
  id: "deepseek",
  streamChatResponse: (history, newMessage, lang, conversationId, userId) =>
    streamDeepSeekChat(history, newMessage, lang, conversationId, userId),
};
