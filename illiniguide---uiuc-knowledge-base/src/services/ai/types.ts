/**
 * @file ./src/services/ai/types.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

export interface StreamChunk {
  text: string;
  followUpQuestions?: string[];
  thinkingStep?: {
    type: 'reasoning' | 'searching' | 'tool_call' | 'processing';
    label: string;
    detail?: string;
  };
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
  signal?: AbortSignal,
) => AsyncGenerator<StreamChunk>;

export interface AIProvider {
  id: 'coze' | 'gemini' | 'deepseek';
  streamChatResponse: StreamChatResponseFn;
}
