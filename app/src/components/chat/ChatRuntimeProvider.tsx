/**
 * @file ./src/components/chat/ChatRuntimeProvider.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  useAui,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatSession } from "./useChatSession";
import { type ChatMessage, type Language } from "../../types";

interface ChatRuntimeProviderProps {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated: (id: string) => void;
  children: React.ReactNode;
}

/* eslint-disable react-refresh/only-export-components */
interface ChatSessionContextValue {
  appendMessage: (text: string) => void;
}

export const ChatSessionContext =
  React.createContext<ChatSessionContextValue | null>(null);

const getTextFromAppendMessage = (message: AppendMessage): string | null => {
  const textPart = message.content.find((part) => part.type === "text");

  if (textPart && textPart.type === "text") {
    return textPart.text;
  }

  return null;
};

const AppendMessageInner = ({ children }: { children: React.ReactNode }) => {
  const api = useAui();
  const appendMessage = React.useCallback(
    (text: string) => {
      api.thread().append({
        role: "user",
        content: [{ type: "text", text }],
      });
    },
    [api]
  );
  return (
    <ChatSessionContext.Provider value={{ appendMessage }}>
      {children}
    </ChatSessionContext.Provider>
  );
};

/**
 * ChatRuntimeProvider — route-level assistant-ui runtime provider.
 *
 * Architectural notes:
 * - AGENTS.md deviation: AGENTS.md:71 recommends placing AssistantRuntimeProvider
 *   at the app root. This component intentionally mounts it at the /chat route
 *   level instead. The chat feature is route-local, so scoping the runtime here
 *   avoids polluting non-chat routes with chat state, context, and side effects.
 * - ExternalStore pattern: uses useExternalStoreRuntime with a custom store
 *   (backed by useChatSession) rather than the AI SDK transport. This gives
 *   full control over message conversion, streaming metadata (thinking steps,
 *   follow-up questions), and the custom SSE backend stream format.
 * - ChatSessionContext: exposed by AppendMessageInner (rendered inside the
 *   AssistantRuntimeProvider) so useAui() runs within the required provider
 *   context. Child components use appendMessage to send via the runtime API.
 */
export const ChatRuntimeProvider = ({
  language,
  currentConversationId,
  onConversationCreated,
  children,
}: ChatRuntimeProviderProps) => {
  const { messages, isLoading, sendMessage } = useChatSession({
    language,
    currentConversationId,
    onConversationCreated,
  });

  const convertMessage = React.useCallback(
    (msg: ChatMessage): ThreadMessageLike => {
      return {
        id: msg.id,
        role: msg.role === "model" ? "assistant" : "user",
        content: [{ type: "text", text: msg.text }],
        metadata: {
          custom: {
            thinkingSteps: msg.thinkingSteps,
            isThinking: msg.isThinking,
            followUpQuestions: msg.followUpQuestions,
            isStreaming: msg.isStreaming,
          },
        },
      };
    },
    []
  );

  const store = React.useMemo(
    () => ({
      messages,
      convertMessage,
      isRunning: isLoading,
      onNew: async (message: AppendMessage) => {
        const text = getTextFromAppendMessage(message);
        if (text) {
          await sendMessage(text);
        }
      },
    }),
    [messages, convertMessage, isLoading, sendMessage]
  );

  const runtime = useExternalStoreRuntime(store);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AppendMessageInner>{children}</AppendMessageInner>
    </AssistantRuntimeProvider>
  );
};
