import { streamChatResponse as cozeStreamChatResponse } from '../../cozeService';
import { AIProvider } from '../types';

export const cozeProvider: AIProvider = {
  id: 'coze',
  streamChatResponse: (history, newMessage, lang, conversationId, userId) =>
    cozeStreamChatResponse(history, newMessage, lang, conversationId, userId),
};
