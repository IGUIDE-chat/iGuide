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

import  { type UIDataTypes, type UIMessage, type UIMessagePart, type UITools } from "ai";
import  { type ChatMessage } from "../../types";

/**
 * Convert one or more legacy ChatMessages to AI SDK UIMessages.
 *
 * - `"user"` messages → `role: "user"` with a single text part
 * - `"model"` / `"assistant"` messages → `role: "assistant"` with a text part
 *   plus optional tool-call parts when `msg.tool_calls` is present
 * - `"tool"` messages → `role: "tool"` with a tool-result part using
 *   `msg.tool_call_id` and the parsed result from `msg.content`
 */
export function chatMessagesToUIMessages(legacy: ChatMessage[]): UIMessage[] {
  return legacy.map((msg) => {
    let role: "user" | "assistant" | "tool";
    const parts: Array<UIMessagePart<UIDataTypes, UITools>> = [];

    if (msg.role === "user") {
      role = "user";
      const text = msg.text ?? msg.content ?? "";
      parts.push({ type: "text", text } as UIMessagePart<UIDataTypes, UITools>);
    } else if (msg.role === "tool") {
      role = "tool";
      let result: unknown = msg.content ?? "";
      try {
        result = JSON.parse(msg.content ?? "{}");
      } catch {
        // content is plain text, use as-is
      }
      parts.push({
        type: "tool-result",
        toolCallId: msg.tool_call_id ?? "",
        toolName: "",
        args: {},
        result,
      } as unknown as UIMessagePart<UIDataTypes, UITools>);
    } else {
      // "model" (legacy) or "assistant"
      role = "assistant";
      const text = msg.text ?? msg.content ?? "";
      parts.push({ type: "text", text } as UIMessagePart<UIDataTypes, UITools>);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          let args: unknown = {};
          try {
            args = JSON.parse(tc.arguments);
          } catch {
            // arguments string is not valid JSON, use empty object
          }
          parts.push({
            type: "tool-call",
            toolCallId: tc.id,
            toolName: tc.name,
            args,
          } as unknown as UIMessagePart<UIDataTypes, UITools>);
        }
      }
    }

    return {
      id: msg.id,
      role,
      parts,
    } as UIMessage;
  });
}

/**
 * Extract plain text from a UIMessagePart[], joining all text parts.
 *
 * Non-text parts (tool-calls, reasoning, file, data, step-start, source-url,
 * source-document) are silently skipped.
 */
export function extractAssistantText(
  parts: Array<UIMessagePart<UIDataTypes, UITools>>
): string {
  return parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text"
    )
    .map((part) => part.text)
    .join("");
}
