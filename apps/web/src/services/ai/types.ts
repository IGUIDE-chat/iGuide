import type { MessageSource } from "../../types"

export interface StreamChunk {
  text: string
  followUpQuestions?: string[]
  thinkingStep?: {
    type: "reasoning" | "searching" | "tool_call" | "processing"
    label: string
    detail?: string
  }
  /** A page the agent read, from the Worker's `source-url` event. */
  source?: MessageSource
}

export interface ChatHistoryItem {
  role: "user" | "model"
  text: string
}

export type StreamChatResponseFn = (
  history: ChatHistoryItem[],
  newMessage: string,
  lang?: string,
  conversationId?: string,
  userId?: string,
) => AsyncGenerator<StreamChunk>

export interface AIProvider {
  id: "gemini" | "deepseek"
  streamChatResponse: StreamChatResponseFn
}
