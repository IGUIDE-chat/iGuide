export interface StreamChunk {
  text: string
  followUpQuestions?: string[]
  thinkingStep?: {
    type: "reasoning" | "searching" | "tool_call" | "processing"
    label: string
    detail?: string
  }
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
  id: "deepseek"
  streamChatResponse: StreamChatResponseFn
}
