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
import { type FeedbackVote } from "../../services/feedbackService";
import {
  type ChatMessage,
  type Language,
  type ThinkingStep,
} from "../../types";
import { ChatErrorBoundary } from "./ChatErrorBoundary";
import { GrepDocsToolUI, SearchToolUI, WebSearchToolUI } from "./tools";

interface ChatRuntimeProviderProps {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated: (id: string) => void;
  children: React.ReactNode;
}

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

const TOOL_NAMES = [
  "search_knowledge_base",
  "web_search",
  "grep_docs",
] as const;

type ToolName = (typeof TOOL_NAMES)[number];

type ToolCallPart = Extract<
  ThreadMessageLike["content"] extends string
    ? never
    : ThreadMessageLike["content"][number],
  { type: "tool-call" }
>;

const isToolName = (value: string | undefined): value is ToolName =>
  !!value && TOOL_NAMES.includes(value as ToolName);

const getToolNameFromLabel = (label: string) => {
  const [, candidate] = label.split(":");
  const toolName = candidate?.trim();

  return isToolName(toolName) ? toolName : undefined;
};

const parseJsonObject = (value: string | undefined) => {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const parseToolResult = (detail: string | undefined) => {
  if (!detail) return undefined;
  const [status, ...summaryParts] = detail.split(" — ");
  const summary = summaryParts.join(" — ");

  return {
    ...(status && { status }),
    summary: summary || detail,
  };
};

const getToolResultStep = (
  steps: ThinkingStep[],
  toolName: ToolName,
  startIndex: number
) =>
  steps
    .slice(startIndex + 1)
    .find(
      (step) =>
        step.type === "processing" &&
        getToolNameFromLabel(step.label) === toolName
    );

const getToolCallParts = (
  steps: ThinkingStep[] | undefined
): ToolCallPart[] => {
  if (!steps?.length) return [];

  return steps.flatMap((step, index) => {
    if (step.type !== "tool_call") return [];

    const toolName = getToolNameFromLabel(step.label);
    if (!toolName) return [];

    const resultStep = getToolResultStep(steps, toolName, index);
    const result = parseToolResult(resultStep?.detail);

    return [
      {
        type: "tool-call" as const,
        toolCallId: `${step.id}-${toolName}`,
        toolName,
        args: parseJsonObject(step.detail) as ToolCallPart["args"],
        ...(result && { result }),
      },
    ];
  });
};

const toAssistantThreadMessage = (
  msg: ChatMessage,
  feedback: Record<string, FeedbackVote>
): ThreadMessageLike => {
  const role = msg.role === "model" ? "assistant" : "user";
  const content: ThreadMessageLike["content"] =
    role === "assistant"
      ? [
          ...getToolCallParts(msg.thinkingSteps),
          { type: "text" as const, text: msg.text },
        ]
      : [{ type: "text" as const, text: msg.text }];

  const vote = feedback[msg.id];
  const submittedFeedback =
    role === "assistant" && vote
      ? ({ type: vote === 1 ? "positive" : "negative" } as const)
      : undefined;

  return {
    id: msg.id,
    role,
    content,
    ...(role === "assistant" && {
      status: msg.isStreaming
        ? ({ type: "running" } as const)
        : ({ type: "complete", reason: "stop" } as const),
    }),
    metadata: {
      ...(submittedFeedback && { submittedFeedback }),
      custom: {
        thinkingSteps: msg.thinkingSteps,
        isThinking: msg.isThinking,
        followUpQuestions: msg.followUpQuestions,
        isStreaming: msg.isStreaming,
      },
    },
  };
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
  const {
    messages,
    isLoading,
    feedback,
    sendMessage,
    stopGeneration,
    regenerate,
    editMessage,
    submitFeedback,
  } = useChatSession({
    language,
    currentConversationId,
    onConversationCreated,
  });

  const store = React.useMemo(
    () => ({
      messages,
      convertMessage: (msg: ChatMessage) =>
        toAssistantThreadMessage(msg, feedback),
      isRunning: isLoading,
      onNew: async (message: AppendMessage) => {
        const text = getTextFromAppendMessage(message);
        if (text) {
          await sendMessage(text);
        }
      },
      onEdit: async (message: AppendMessage) => {
        const text = getTextFromAppendMessage(message);
        if (text !== null) {
          await editMessage(message.parentId, text);
        }
      },
      onReload: async (parentId: string | null) => {
        await regenerate(parentId);
      },
      onCancel: async () => {
        stopGeneration();
      },
      adapters: {
        feedback: {
          submit: ({
            message,
            type,
          }: {
            message: { id: string };
            type: "positive" | "negative";
          }) => {
            submitFeedback(message.id, type);
          },
        },
      },
    }),
    [
      messages,
      isLoading,
      feedback,
      sendMessage,
      stopGeneration,
      regenerate,
      editMessage,
      submitFeedback,
    ]
  );

  const runtime = useExternalStoreRuntime(store);

  return (
    <ChatErrorBoundary>
      <AssistantRuntimeProvider runtime={runtime}>
        <SearchToolUI />
        <WebSearchToolUI />
        <GrepDocsToolUI />
        <AppendMessageInner>{children}</AppendMessageInner>
      </AssistantRuntimeProvider>
    </ChatErrorBoundary>
  );
};
