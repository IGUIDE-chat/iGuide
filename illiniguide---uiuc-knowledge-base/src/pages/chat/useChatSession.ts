/**
 * @file ./src/pages/chat/useChatSession.ts
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Language, ChatMessage, ChatErrorType, ThinkingStep } from '../../types';
import { streamChatResponse } from '../../services/ai';
import { conversationService } from '../../services/conversationService';
import { localConversationService } from '../../services/localConversationService';
import { memoryService } from '../../services/memoryService';
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

const ERROR_MESSAGES: Record<ChatErrorType, Record<Language, string>> = {
  timeout: {
    en: 'Request timed out. Please try again.',
    zh: '请求超时，请重试。',
  },
  api_error: {
    en: 'The service is temporarily unavailable. Please try again later.',
    zh: '服务暂时不可用，请稍后重试。',
  },
  unknown: {
    en: 'Connection error. Please try again.',
    zh: '连接失败，请重试。',
  },
};

const STREAM_TIMEOUT_MS = 30_000;

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

  // AbortController ref — does not trigger re-renders
  const abortControllerRef = useRef<AbortController | null>(null);

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
        setMessages([{
          id: Date.now().toString(),
          role: 'model',
          text: language === 'zh' ? '历史消息加载失败，请刷新重试。' : 'Failed to load history. Please refresh.',
          isError: true,
          errorType: 'unknown',
        }]);
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
        // Create a new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // 30s timeout — auto-abort if no response completes in time
        const timeoutId = setTimeout(() => {
          abortController.abort('timeout');
        }, STREAM_TIMEOUT_MS);

        const aiMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'model',
            text: '',
            isStreaming: true,
            isThinking: true,
            thinkingSteps: [
              {
                id: `step-${Date.now()}-init`,
                type: 'processing' as const,
                label: '理解问题...',
                timestamp: Date.now(),
                done: false,
              },
            ],
          },
        ]);

        const stream = await streamChatResponse(
          messages.map((message) => ({ role: message.role, text: message.text })),
          userMsg.text,
          language,
          conversationId || undefined,
          user?.id,
          abortController.signal,
        );

        let fullText = '';
        let followUpQuestions: string[] | undefined;
        const thinkingSteps: ThinkingStep[] = [];
        let lastUpdateTime = Date.now();
        const updateInterval = 50;

        for await (const chunk of stream) {
          if (chunk.thinkingStep) {
            // Mark previous step as done
            if (thinkingSteps.length > 0) {
              thinkingSteps[thinkingSteps.length - 1].done = true;
            }
            const step: ThinkingStep = {
              id: `step-${Date.now()}-${thinkingSteps.length}`,
              type: chunk.thinkingStep.type,
              label: chunk.thinkingStep.label,
              detail: chunk.thinkingStep.detail,
              timestamp: Date.now(),
              done: false,
            };
            thinkingSteps.push(step);
            setMessages((prev) =>
              prev.map((message) =>
                message.id === aiMsgId
                  ? { ...message, thinkingSteps: [...thinkingSteps] }
                  : message,
              ),
            );
          }

          if (chunk.text) {
            fullText += chunk.text;
            const now = Date.now();
            // First text chunk means thinking is done
            if (fullText === chunk.text && thinkingSteps.length > 0) {
              thinkingSteps.forEach((s) => (s.done = true));
            }
            if (now - lastUpdateTime >= updateInterval) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === aiMsgId
                    ? { ...message, text: fullText, isThinking: false, thinkingSteps: [...thinkingSteps] }
                    : message,
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

        // Stream completed — clear timeout and abort ref
        clearTimeout(timeoutId);
        abortControllerRef.current = null;

        if (!fullText.trim()) {
          fullText = INVALID_RESPONSE[language];
        }

        // Extract "💡 你可能还想了解：" section to followUpQuestions
        const followUpHeaderMatch = fullText.match(/\n+.*💡.*[你您]可能还想.*[:：\n]/);
        if (followUpHeaderMatch && (!followUpQuestions || followUpQuestions.length === 0)) {
          const splitIndex = followUpHeaderMatch.index!;
          const followUpText = fullText.substring(splitIndex + followUpHeaderMatch[0].length);
          
          const questions = followUpText.split('\n')
            .map(line => line.replace(/^[>\s\d\.\-\*\[\]]+/, '').replace(/\]?$/, '').trim())
            .filter(line => line.length > 0 && line.length < 150);
            
          if (questions.length > 0) {
            followUpQuestions = questions;
            fullText = fullText.substring(0, splitIndex).trim();
          }
        }

        // Extract and strip memory tags (invisible to user)
        const userSoulMatch = fullText.match(/<user_soul>([\s\S]*?)<\/user_soul>/);
        const userMemoryMatch = fullText.match(/<user_memory>([\s\S]*?)<\/user_memory>/);
        const convMemoryMatch = fullText.match(/<conv_memory>([\s\S]*?)<\/conv_memory>/);
        fullText = fullText
          .replace(/<user_soul>[\s\S]*?<\/user_soul>/g, '')
          .replace(/<user_memory>[\s\S]*?<\/user_memory>/g, '')
          .replace(/<conv_memory>[\s\S]*?<\/conv_memory>/g, '')
          .trim();

        // Persist extracted memories (fire-and-forget)
        if (user && (userSoulMatch || userMemoryMatch || convMemoryMatch)) {
          const uid = user.id;
          const cid = conversationId;
          if (userSoulMatch?.[1]?.trim()) {
            void memoryService.appendSoul(uid, userSoulMatch[1].trim());
          }
          if (userMemoryMatch?.[1]?.trim()) {
            void memoryService.appendUserMemory(uid, userMemoryMatch[1].trim());
          }
          if (convMemoryMatch?.[1]?.trim() && cid) {
            void memoryService.updateConversationMemory(cid, convMemoryMatch[1].trim());
          }
        }

        // Mark all steps done
        thinkingSteps.forEach((s) => (s.done = true));

        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: 'model',
          text: fullText,
          isStreaming: false,
          isThinking: false,
          followUpQuestions,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };

        setMessages((prev) =>
          prev.map((message) => (message.id === aiMsgId ? aiMsg : message)),
        );

        if (conversationId && aiMsg.text.trim() && !aiMsg.isError) {
          try {
            const service = user ? conversationService : localConversationService;
            await service.saveMessage(conversationId, aiMsg);
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        }
      } catch (error) {
        // Classify the error type
        const isAbort = error instanceof DOMException && error.name === 'AbortError';
        const isTimeout = isAbort && abortControllerRef.current?.signal.reason === 'timeout';

        if (isAbort && !isTimeout) {
          // User-initiated stop — keep partial content, no error message
          console.log('[Chat] Stream aborted by user');
        } else {
          const errorType: ChatErrorType = isTimeout
            ? 'timeout'
            : error instanceof Error && /4\d\d|5\d\d/.test(error.message)
              ? 'api_error'
              : 'unknown';

          console.error('[Chat] Stream error:', error instanceof Error ? error.message : error);

          setMessages((prev) => {
            // Mark the in-progress AI message as error (if exists), or append a new one
            const hasAiMsg = prev.some(m => m.isStreaming);
            if (hasAiMsg) {
              return prev.map(m =>
                m.isStreaming
                  ? {
                      ...m,
                      text: ERROR_MESSAGES[errorType][language],
                      isStreaming: false,
                      isThinking: false,
                      isError: true,
                      errorType,
                    }
                  : m,
              );
            }
            return [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'model' as const,
                text: ERROR_MESSAGES[errorType][language],
                isError: true,
                errorType,
              },
            ];
          });
        }
      } finally {
        clearTimeout(abortControllerRef.current ? undefined : undefined); // timeout already cleared on success
        abortControllerRef.current = null;
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

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    isLoading,
    isLoadingHistory,
    setInput,
    sendMessage,
    handleSubmit,
    stopStreaming,
  };
};
