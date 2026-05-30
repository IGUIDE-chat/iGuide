import { expect, test } from "vite-plus/test"

import {
  buildProviderMessages,
  convertToolResultToMessage,
  normalizeMessages,
} from "./messages.ts"

test("first-turn provider messages preserve system and current user order", () => {
  const messages = buildProviderMessages({
    systemPrompt: "system prompt",
    history: [],
    message: "Where should I live freshman year?",
  })

  expect(messages.length).toBe(2)
  expect(messages.map((message) => message.role)).toEqual(["system", "user"])
  expect(messages[0].content).toBe("system prompt")
  expect(messages[1].content).toBe("Where should I live freshman year?")
  expect(messages.every((message) => message.role !== "tool")).toBeTruthy()
})

test("normalizes history roles and appends current user message", () => {
  const messages = normalizeMessages({
    history: [
      { role: "model", content: "I can help with housing." },
      { role: "assistant", content: "What preferences do you have?" },
      { role: "unexpected", content: "I want quiet dorms." },
    ],
    message: "Compare ISR and PAR.",
  })

  expect(messages).toEqual([
    { role: "assistant", content: "I can help with housing." },
    { role: "assistant", content: "What preferences do you have?" },
    { role: "user", content: "I want quiet dorms." },
    { role: "user", content: "Compare ISR and PAR." },
  ])
})

test("replay-turn provider messages preserve assistant tool call and linked tool result", () => {
  const toolCall = {
    id: "call_search_1",
    type: "function" as const,
    function: {
      name: "search_knowledge_base",
      arguments: JSON.stringify({ query: "PAR dorm dining" }),
    },
  }

  const toolMessage = convertToolResultToMessage({
    toolCall,
    result: {
      content: "PAR has multiple dining options.",
      metadata: { source: "knowledge_base" },
    },
  })

  const messages = buildProviderMessages({
    systemPrompt: "system prompt",
    history: [
      { role: "user", content: "What dining is near PAR?" },
      {
        role: "assistant",
        content: "Let me search.",
        tool_calls: [toolCall],
      },
      toolMessage,
    ],
    message: "Use that result to answer.",
  })

  expect(messages.map((message) => message.role)).toEqual([
    "system",
    "user",
    "assistant",
    "tool",
    "user",
  ])

  const assistantMessage = messages[2]
  expect(assistantMessage.tool_calls?.[0]?.id).toBe("call_search_1")
  expect(assistantMessage.tool_calls?.[0]?.function.name).toBe(
    "search_knowledge_base"
  )

  const replayToolMessage = messages[3]
  expect(replayToolMessage.tool_call_id).toBe("call_search_1")
  expect(replayToolMessage.role).toBe("tool")
  expect(
    // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe assertion
    replayToolMessage.content ?? ""
  ).toMatch(/PAR has multiple dining options/)
  // eslint-disable-next-line vitest/no-conditional-in-test -- nullish coalescing for safe assertion
  expect(replayToolMessage.content ?? "").toMatch(/knowledge_base/)
  expect(messages.at(-1)?.content).toBe("Use that result to answer.")
})

test("plain tool result conversion keeps simple content unchanged", () => {
  const message = convertToolResultToMessage({
    toolCall: {
      id: "call_plain",
      type: "function",
      function: { name: "grep_docs", arguments: "{}" },
    },
    result: { content: "plain result" },
  })

  expect(message).toEqual({
    role: "tool",
    tool_call_id: "call_plain",
    content: "plain result",
  })
})
