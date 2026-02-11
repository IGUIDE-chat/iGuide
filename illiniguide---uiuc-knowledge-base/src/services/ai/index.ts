import { cozeProvider } from './providers/cozeProvider';
import { geminiProvider } from './providers/geminiProvider';
import { StreamChatResponseFn } from './types';

type ProviderKey = 'coze' | 'gemini';

const providerKey = (import.meta.env.VITE_AI_PROVIDER || 'coze') as ProviderKey;
const activeProvider = providerKey === 'gemini' ? geminiProvider : cozeProvider;

export const getActiveAIProvider = () => activeProvider.id;

export const streamChatResponse: StreamChatResponseFn = (
  history,
  newMessage,
  lang,
  conversationId,
  userId,
) => {
  return activeProvider.streamChatResponse(history, newMessage, lang, conversationId, userId);
};
