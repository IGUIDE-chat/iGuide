import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ChatMessage, ThinkingStep } from "../../../types";

export function toThreadMessage(msg: ChatMessage): ThreadMessageLike {
  return {
    id: msg.id ?? "",
    role: msg.role === "model" ? "assistant" : "user",
    content: [{ type: "text" as const, text: msg.text }],
    metadata: {
      custom: {
        thinkingSteps: msg.thinkingSteps,
        isThinking: msg.isThinking,
        followUpQuestions: msg.followUpQuestions,
        isStreaming: msg.isStreaming,
      },
    },
  };
}

export function fromThreadMessage(
  msg: ThreadMessageLike,
  _fallbackRole: "user" | "model" = "model"
): ChatMessage {
  const custom = msg.metadata?.custom as
    | {
        thinkingSteps?: ThinkingStep[];
        isThinking?: boolean;
        followUpQuestions?: string[];
        isStreaming?: boolean;
      }
    | undefined;

  const content = msg.content;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else {
    const textContent = content?.find(
      (part: { type: string; text?: string }) => part.type === "text"
    );
    text = textContent?.type === "text" ? (textContent.text ?? "") : "";
  }

  return {
    id: msg.id ?? "",
    role: msg.role === "assistant" ? "model" : "user",
    text,
    isStreaming: custom?.isStreaming,
    followUpQuestions: custom?.followUpQuestions,
    thinkingSteps: custom?.thinkingSteps,
    isThinking: custom?.isThinking,
  };
}

export function isChatMessage(obj: unknown): obj is ChatMessage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "role" in obj &&
    "text" in obj &&
    ((obj as Record<string, unknown>).role === "user" ||
      (obj as Record<string, unknown>).role === "model")
  );
}

export function isThreadMessageLike(obj: unknown): obj is ThreadMessageLike {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "role" in obj &&
    ((obj as Record<string, unknown>).role === "user" ||
      (obj as Record<string, unknown>).role === "assistant")
  );
}
