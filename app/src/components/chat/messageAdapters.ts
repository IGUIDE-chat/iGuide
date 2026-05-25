/**
 * @file messageAdapters.ts
 * @description Adapter layer between legacy ChatMessage and AI SDK UIMessage.
 *
 * This module bridges the app's legacy ChatMessage shape (with `text` + optional `content`)
 * and the AI SDK's UIMessage shape (with `parts: UIMessagePart[]`).
 *
 * Intended consumers: hooks that integrate with useChat / AI SDK runtimes.
 * NOT for use with @assistant-ui/react (see adapters/messageAdapter.ts for that).
 */

import type { UIDataTypes, UITools, UIMessage, UIMessagePart } from "ai";
import type { ChatMessage } from "../../types";

/**
 * Convert one or more legacy ChatMessages to AI SDK UIMessages.
 *
 * Each message maps the `text` or `content` field into a `parts` array
 * with a single text part.  Model messages get `role: "assistant"`;
 * user messages get `role: "user"`.
 */
export function chatMessagesToUIMessages(legacy: ChatMessage[]): UIMessage[] {
  return legacy.map((msg) => {
    const role = msg.role === "model" ? "assistant" : "user";
    const text = msg.text ?? msg.content ?? "";

    return {
      id: msg.id,
      role,
      parts: [{ type: "text", text }] as UIMessagePart<UIDataTypes, UITools>[],
      // The remaining UIMessage fields (metadata, etc.) are optional at runtime;
      // the interface requires them only when generics dictate.  TypeScript
      // structural compatibility allows this minimal shape.
    } as UIMessage;
  });
}

/**
 * Extract plain text from a UIMessagePart[], joining all text parts.
 *
 * Non-text parts (tool-calls, reasoning, file, data, step-start, source-url,
 * source-document) are silently skipped.
 */
export function extractAssistantText(parts: UIMessagePart<UIDataTypes, UITools>[]): string {
  return parts
    .filter((part): part is { type: "text"; text: string } =>
      part.type === "text"
    )
    .map((part) => part.text)
    .join("");
}
