export interface StreamChunk {
  text: string;
  followUpQuestions?: string[];
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export type StreamChatResponseFn = (
  history: ChatHistoryItem[],
  newMessage: string,
  lang?: string,
  conversationId?: string,
  userId?: string,
) => AsyncGenerator<StreamChunk>;

export interface AIProvider {
  id: 'coze' | 'gemini';
  streamChatResponse: StreamChatResponseFn;
}
