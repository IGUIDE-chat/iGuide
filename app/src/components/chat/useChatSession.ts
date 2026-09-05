/**
 * @file ./src/components/chat/useChatSession.ts
 * @description Chat Behavioral Hook / Module
 * @description_zh 这是一个聊天行为 hook（Orchestrator）。管理会话状态和消息处理逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Language, ChatMessage, ThinkingStep } from "../../types";
import { streamChatResponse } from "../../services/ai";
import { conversationService } from "../../services/conversationService";
import { localConversationService } from "../../services/localConversationService";
import { memoryService } from "../../services/memoryService";
import {
  feedbackService,
  type FeedbackVote,
} from "../../services/feedbackService";
import { useAuth } from "../../contexts/AuthContext";
import { useThrottle } from "../../hooks/useThrottle";

interface UseChatSessionOptions {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated?: (conversationId: string) => void;
}

type MessageAction =
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | {
      type: "UPDATE_MESSAGE";
      payload: { id: string; updates: Partial<ChatMessage> };
    }
  | { type: "REPLACE_MESSAGE"; payload: ChatMessage };

const messageReducer = (
  state: ChatMessage[],
  action: MessageAction
): ChatMessage[] => {
  switch (action.type) {
    case "SET_MESSAGES":
      return action.payload;
    case "ADD_MESSAGE":
      return [...state, action.payload];
    case "UPDATE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.payload.id
          ? { ...msg, ...action.payload.updates }
          : msg
      );
    case "REPLACE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.payload.id ? action.payload : msg
      );
    default:
      return state;
  }
};

const NEW_CHAT_TITLE = {
  en: "New Chat",
  zh: "新对话",
} as const;

const INVALID_RESPONSE = {
  en: "No response was returned. Please try again.",
  zh: "暂时没有收到回复，请重试。",
} as const;

const CONNECTION_ERROR = {
  en: "Connection error. Please try again.",
  zh: "连接失败，请重试。",
} as const;

const LOGGED_IN_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateSmartTitle = (text: string, language: Language): string => {
  let title = text
    .replace(/^(请帮我|帮忙|能否|可以|how to|please|help me)/i, "")
    .trim();

  if (title.includes("?") || title.includes("？")) {
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
  const [messages, dispatch] = useReducer(messageReducer, []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, FeedbackVote>>({});

  // Always-current conversation id, including one just created during a send,
  // so regenerate / edit persist to the right conversation without waiting for
  // the parent prop to round-trip.
  const conversationIdRef = useRef<string | null>(currentConversationId);
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // In-flight request controller, used to cancel streaming on stop.
  const abortRef = useRef<AbortController | null>(null);

  const updateMessageText = useCallback(
    (id: string, text: string, steps: ThinkingStep[]) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id,
          updates: {
            text,
            isThinking: false,
            thinkingSteps: [...steps],
          },
        },
      });
    },
    []
  );

  const throttledUpdateMessageText = useThrottle(updateMessageText, 100);

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
          dispatch({
            type: "SET_MESSAGES",
            payload: service.convertToChatMessages(data.messages),
          });
        }

        const votes = await feedbackService.getFeedbackForConversation(
          conversationId,
          user?.id
        );
        setFeedback(votes);
      } catch (error) {
        console.error("Failed to load conversation:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (isLoading) {
      console.log("[ChatPage] Skipping loadConversation while streaming");
      return;
    }

    if (!currentConversationId) {
      dispatch({ type: "SET_MESSAGES", payload: [] });
      setFeedback({});
      return;
    }

    if (user && !LOGGED_IN_ID_REGEX.test(currentConversationId)) {
      console.warn(
        "[ChatPage] Skipping load of invalid/legacy ID for logged-in user:",
        currentConversationId
      );
      return;
    }

    void loadConversation(currentConversationId);
  }, [currentConversationId, isLoading, loadConversation, user]);

  /**
   * Stream an assistant reply for the given thread state.
   *
   * `baseMessages` is the full visible thread the assistant should answer,
   * with the user message to respond to as its last element. The caller is
   * responsible for having dispatched `baseMessages` into the visible state
   * before calling this. Persistence is "append" for a fresh turn or
   * "overwrite" when the tail was rewritten (regenerate / edit).
   */
  const streamAssistant = useCallback(
    async (
      baseMessages: ChatMessage[],
      conversationId: string | null,
      persistMode: "append" | "overwrite"
    ) => {
      const lastUserMessage = baseMessages[baseMessages.length - 1];
      if (!lastUserMessage) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      const aiMsgId = crypto.randomUUID();
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: aiMsgId,
          role: "model",
          text: "",
          isStreaming: true,
          isThinking: true,
          thinkingSteps: [
            {
              id: `step-${Date.now()}-init`,
              type: "processing" as const,
              label: language === "zh" ? "理解问题..." : "Understanding...",
              timestamp: Date.now(),
              done: false,
            },
          ],
        },
      });

      try {
        const stream = await streamChatResponse(
          baseMessages.slice(0, -1).map((message) => ({
            role: message.role,
            text: message.text,
          })),
          lastUserMessage.text,
          language,
          conversationId || undefined,
          user?.id,
          controller.signal
        );

        let fullText = "";
        let followUpQuestions: string[] | undefined;
        const thinkingSteps: ThinkingStep[] = [];

        for await (const chunk of stream) {
          if (chunk.thinkingStep) {
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
            dispatch({
              type: "UPDATE_MESSAGE",
              payload: {
                id: aiMsgId,
                updates: { thinkingSteps: [...thinkingSteps] },
              },
            });
          }

          if (chunk.text) {
            fullText += chunk.text;
            if (fullText === chunk.text && thinkingSteps.length > 0) {
              thinkingSteps.forEach((s) => {
                s.done = true;
              });
            }
            throttledUpdateMessageText(aiMsgId, fullText, thinkingSteps);
          }

          if (chunk.followUpQuestions) {
            followUpQuestions = chunk.followUpQuestions;
            dispatch({
              type: "UPDATE_MESSAGE",
              payload: {
                id: aiMsgId,
                updates: { followUpQuestions: chunk.followUpQuestions },
              },
            });
          }
        }

        const wasAborted = controller.signal.aborted;

        if (!fullText.trim() && !wasAborted) {
          fullText = INVALID_RESPONSE[language];
        }

        // Extract "💡 你可能还想了解：" section to followUpQuestions
        const followUpHeaderMatch = fullText.match(
          /\n+.*💡.*[你您]可能还想.*[:：\n]/
        );
        if (
          followUpHeaderMatch &&
          (!followUpQuestions || followUpQuestions.length === 0)
        ) {
          const splitIndex = followUpHeaderMatch.index!;
          const followUpText = fullText.substring(
            splitIndex + followUpHeaderMatch[0].length
          );

          const questions = followUpText
            .split("\n")
            .map((line) =>
              line
                .replace(/^[>\s\d.*[\]-]+/, "")
                .replace(/\]?$/, "")
                .trim()
            )
            .filter((line) => line.length > 0 && line.length < 150);

          if (questions.length > 0) {
            followUpQuestions = questions;
            fullText = fullText.substring(0, splitIndex).trim();
          }
        }

        // Extract and strip memory tags (invisible to user)
        let userSoulMatch: RegExpMatchArray | null = null;
        let userMemoryMatch: RegExpMatchArray | null = null;
        let convMemoryMatch: RegExpMatchArray | null = null;

        try {
          userSoulMatch = fullText.match(/<user_soul>([\s\S]*?)<\/user_soul>/);
          userMemoryMatch = fullText.match(
            /<user_memory>([\s\S]*?)<\/user_memory>/
          );
          convMemoryMatch = fullText.match(
            /<conv_memory>([\s\S]*?)<\/conv_memory>/
          );
          fullText = fullText
            .replace(/<user_soul>[\s\S]*?<\/user_soul>/g, "")
            .replace(/<user_memory>[\s\S]*?<\/user_memory>/g, "")
            .replace(/<conv_memory>[\s\S]*?<\/conv_memory>/g, "")
            .trim();
        } catch {
          // Regex failed — skip memory extraction, keep fullText as-is
        }

        // Clean up unclosed/partial tags that would leak into visible text
        fullText = fullText
          .replace(/<user_soul>[\s\S]*/g, "")
          .replace(/<user_memory>[\s\S]*/g, "")
          .replace(/<conv_memory>[\s\S]*/g, "")
          .trim();

        // Persist extracted memories (fire-and-forget)
        if (user && (userSoulMatch || userMemoryMatch || convMemoryMatch)) {
          const uid = user.id;
          const cid = conversationId;
          const soulContent = userSoulMatch?.[1]?.trim();
          if (soulContent) {
            void memoryService.appendSoul(uid, soulContent);
          }
          const userMemContent = userMemoryMatch?.[1]?.trim();
          if (userMemContent) {
            void memoryService.appendUserMemory(uid, userMemContent);
          }
          const convMemContent = convMemoryMatch?.[1]?.trim();
          if (convMemContent && cid) {
            void memoryService.updateConversationMemory(cid, convMemContent);
          }
        }

        // Mark all steps done
        thinkingSteps.forEach((s) => {
          s.done = true;
        });

        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: "model",
          text: fullText,
          isStreaming: false,
          isThinking: false,
          followUpQuestions,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };

        dispatch({ type: "REPLACE_MESSAGE", payload: aiMsg });

        if (conversationId) {
          try {
            const service = user
              ? conversationService
              : localConversationService;
            if (persistMode === "overwrite") {
              const finalMessages = aiMsg.text.trim()
                ? [...baseMessages, aiMsg]
                : baseMessages;
              await service.overwriteMessages(conversationId, finalMessages);
            } else if (aiMsg.text.trim()) {
              await service.saveMessage(conversationId, aiMsg);
            }
          } catch (error) {
            console.error("Failed to persist assistant message:", error);
          }
        }
      } catch {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: crypto.randomUUID(),
            role: "model",
            text: CONNECTION_ERROR[language],
          },
        });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [language, throttledUpdateMessageText, user]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) {
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
      };

      const baseMessages = [...messages, userMsg];
      dispatch({ type: "ADD_MESSAGE", payload: userMsg });
      setInput("");
      // Set loading before any await so the conversation-load effect (guarded
      // by `if (isLoading) return`) does not fire when onConversationCreated
      // flips currentConversationId for a brand-new conversation — that reload
      // would replace the streaming placeholder and drop its thinking steps.
      setIsLoading(true);

      let conversationId = conversationIdRef.current;
      if (!conversationId) {
        try {
          const service = user ? conversationService : localConversationService;
          const { data, error } = await service.createConversation(
            undefined,
            generateSmartTitle(text, language)
          );
          if (error) {
            throw error;
          }
          if (data) {
            conversationId = data.id;
            conversationIdRef.current = data.id;
            onConversationCreated?.(data.id);
          }
        } catch (error) {
          console.error("Failed to create conversation:", error);
        }
      }

      if (conversationId) {
        try {
          const service = user ? conversationService : localConversationService;
          await service.saveMessage(conversationId, userMsg);
        } catch (error) {
          console.error("Failed to save user message:", error);
        }
      }

      await streamAssistant(baseMessages, conversationId, "append");
    },
    [
      isLoading,
      language,
      messages,
      onConversationCreated,
      streamAssistant,
      user,
    ]
  );

  /** Stop the in-flight response; partial text is kept. */
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /**
   * Regenerate the assistant reply whose parent is `parentId` (the user
   * message that prompted it). Everything after that user message is dropped
   * and a fresh reply is streamed.
   */
  const regenerate = useCallback(
    async (parentId: string | null) => {
      if (isLoading) return;

      const parentIndex = parentId
        ? messages.findIndex((m) => m.id === parentId)
        : -1;
      // Fall back to the last user message if no parent was provided.
      const anchorIndex =
        parentIndex >= 0
          ? parentIndex
          : messages.map((m) => m.role).lastIndexOf("user");
      if (anchorIndex < 0 || messages[anchorIndex].role !== "user") return;

      const baseMessages = messages.slice(0, anchorIndex + 1);
      dispatch({ type: "SET_MESSAGES", payload: baseMessages });
      await streamAssistant(baseMessages, conversationIdRef.current, "overwrite");
    },
    [isLoading, messages, streamAssistant]
  );

  /**
   * Replace a user message (identified by its parent `parentId`) with new
   * text and re-stream the reply. `parentId` is the message before the edited
   * one, per the assistant-ui edit contract (null = first message).
   */
  const editMessage = useCallback(
    async (parentId: string | null, newText: string) => {
      if (isLoading || !newText.trim()) return;

      const keepUpToIndex = parentId
        ? messages.findIndex((m) => m.id === parentId)
        : -1;

      const newUserMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: newText,
      };

      const baseMessages = [
        ...messages.slice(0, keepUpToIndex + 1),
        newUserMsg,
      ];
      dispatch({ type: "SET_MESSAGES", payload: baseMessages });
      await streamAssistant(baseMessages, conversationIdRef.current, "overwrite");
    },
    [isLoading, messages, streamAssistant]
  );

  /** Record a 👍/👎 vote on an assistant message. */
  const submitFeedback = useCallback(
    (messageId: string, type: "positive" | "negative") => {
      const vote: FeedbackVote = type === "positive" ? 1 : -1;
      setFeedback((prev) => ({ ...prev, [messageId]: vote }));
      const messageText = messages.find((m) => m.id === messageId)?.text;
      void feedbackService.setFeedback(messageId, vote, {
        userId: user?.id,
        conversationId: conversationIdRef.current,
        messageText,
      });
    },
    [messages, user]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage]
  );

  return {
    messages,
    input,
    isLoading,
    isLoadingHistory,
    feedback,
    setInput,
    sendMessage,
    stopGeneration,
    regenerate,
    editMessage,
    submitFeedback,
    handleSubmit,
  };
};
