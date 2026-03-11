/**
 * @file ./src/pages/chat/useChatSession.ts
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useCallback, useEffect, useState } from 'react';
import { Language, ChatMessage } from '../../types';
import { streamChatResponse } from '../../services/ai';
import { conversationService } from '../../services/conversationService';
import { localConversationService } from '../../services/localConversationService';
import { useAuth } from '../../contexts/AuthContext';

interface UseChatSessionOptions {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated?: (conversationId: string) => void;
}

const NEW_CHAT_TITLE = {
  en: 'New Chat',
  zh: '新对话',
} as const;

const INVALID_RESPONSE = {
  en: 'No response was returned. Please try again.',
  zh: '暂时没有收到回复，请重试。',
} as const;

const CONNECTION_ERROR = {
  en: 'Connection error. Please try again.',
  zh: '连接失败，请重试。',
} as const;

const LOGGED_IN_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateSmartTitle = (text: string, language: Language): string => {
  let title = text
    .replace(/^(请帮我|帮忙|能否|可以|how to|please|help me)/i, '')
    .trim();

  if (title.includes('?') || title.includes('？')) {
    title = title.split(/[?？]/)[0].trim();
  }

  if (title.length > 30) {
    title = `${title.substring(0, 27)}...`;
  }

  return title || NEW_CHAT_TITLE[language];
};

export const useChatSession = ({
  language,
  currentConversationId,
  onConversationCreated,
}: UseChatSessionOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      setIsLoadingHistory(true);
      try {
        const service = user ? conversationService : localConversationService;
        const { data, error } = await service.getConversation(conversationId);
        if (error) {
          throw error;
        }

        if (data?.messages) {
          setMessages(service.convertToChatMessages(data.messages));
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (isLoading) {
      console.log('[ChatPage] Skipping loadConversation while streaming');
      return;
    }

    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    if (user && !LOGGED_IN_ID_REGEX.test(currentConversationId)) {
      console.warn(
        '[ChatPage] Skipping load of invalid/legacy ID for logged-in user:',
        currentConversationId,
      );
      return;
    }

    void loadConversation(currentConversationId);
  }, [currentConversationId, isLoading, loadConversation, user]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) {
        return;
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      let conversationId = currentConversationId;
      if (!conversationId) {
        try {
          const service = user ? conversationService : localConversationService;
          const { data, error } = await service.createConversation(
            undefined,
            generateSmartTitle(text, language),
          );
          if (error) {
            throw error;
          }
          if (data) {
            conversationId = data.id;
            onConversationCreated?.(data.id);
          }
        } catch (error) {
          console.error('Failed to create conversation:', error);
        }
      }

      if (conversationId) {
        try {
          const service = user ? conversationService : localConversationService;
          await service.saveMessage(conversationId, userMsg);
        } catch (error) {
          console.error('Failed to save user message:', error);
        }
      }

      try {
        const aiMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, role: 'model', text: '', isStreaming: true },
        ]);

        const stream = await streamChatResponse(
          messages.map((message) => ({ role: message.role, text: message.text })),
          userMsg.text,
          language,
          conversationId || undefined,
          user?.id,
        );

        let fullText = '';
        let followUpQuestions: string[] | undefined;
        let lastUpdateTime = Date.now();
        const updateInterval = 50;

        for await (const chunk of stream) {
          if (chunk.text) {
            fullText += chunk.text;
            const now = Date.now();
            if (now - lastUpdateTime >= updateInterval) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === aiMsgId ? { ...message, text: fullText } : message,
                ),
              );
              lastUpdateTime = now;
            }
          }

          if (chunk.followUpQuestions) {
            followUpQuestions = chunk.followUpQuestions;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === aiMsgId
                  ? { ...message, followUpQuestions: chunk.followUpQuestions }
                  : message,
              ),
            );
          }
        }

        if (!fullText.trim()) {
          fullText = INVALID_RESPONSE[language];
        }

        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: 'model',
          text: fullText,
          isStreaming: false,
          followUpQuestions,
        };

        setMessages((prev) =>
          prev.map((message) => (message.id === aiMsgId ? aiMsg : message)),
        );

        if (conversationId && aiMsg.text.trim()) {
          try {
            const service = user ? conversationService : localConversationService;
            await service.saveMessage(conversationId, aiMsg);
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'model',
            text: CONNECTION_ERROR[language],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, isLoading, language, messages, onConversationCreated, user],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage],
  );

  return {
    messages,
    input,
    isLoading,
    isLoadingHistory,
    setInput,
    sendMessage,
    handleSubmit,
  };
};
