import { expect, test } from "vite-plus/test"

import { createSSEParserState, parseDeepSeekSSELine } from "../deepseekSse.ts"

test("tool_start event: parses Worker payload with name field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","args":{"query":"housing"}}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].thinkingStep?.type).toBe("tool_call")
  expect(chunks[0].thinkingStep?.label).toBe("Calling tool: web_search")
  expect(chunks[0].thinkingStep?.detail).toBe('{"query":"housing"}')
})

test("tool_start event: parses legacy payload with tool field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"search_knowledge_base","args":{"query":"dorms"}}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].thinkingStep?.type).toBe("tool_call")
  expect(chunks[0].thinkingStep?.label).toBe(
    "Calling tool: search_knowledge_base"
  )
})

test("tool_start event: uses Chinese locale labels", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "zh")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"custom_skills","args":{"skill":"campus_map"}}',
    state,
    "zh"
  )

  expect(chunks[0].thinkingStep?.label).toBe("调用工具: custom_skills")
})

test("tool_result event: parses Worker payload with name field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","status":"success","summary":"3 results"}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].thinkingStep?.type).toBe("processing")
  expect(chunks[0].thinkingStep?.label).toBe("Tool finished: web_search")
  expect(chunks[0].thinkingStep?.detail).toBe("success — 3 results")
})

test("tool_result event: parses legacy payload with tool field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"grep_docs","status":"success","summary":"found 5 matches"}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].thinkingStep?.type).toBe("processing")
  expect(chunks[0].thinkingStep?.label).toBe("Tool finished: grep_docs")
  expect(chunks[0].thinkingStep?.detail).toBe("success — found 5 matches")
})

test("tool_result event: handles missing status and summary", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search"}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].thinkingStep?.detail).toBe(undefined)
})

test("content event: parses delta field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"delta":"Hello, world!"}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].text).toBe("Hello, world!")
})

test("content event: parses content field (legacy)", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"content":"Final answer here."}',
    state,
    "en"
  )

  expect(chunks.length).toBe(1)
  expect(chunks[0].text).toBe("Final answer here.")
})

test("content event: returns empty for empty content", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"delta":""}', state, "en")

  expect(chunks.length).toBe(0)
})

test("reasoning buffer: accumulates across multiple reasoning_content deltas", () => {
  const state = createSSEParserState()

  const chunk1 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"Let me "}}]}',
    state,
    "en"
  )

  expect(state.isInReasoning).toBe(true)
  expect(state.reasoningBuffer).toBe("Let me ")
  expect(chunk1[0].thinkingStep?.detail).toBe("Let me ")

  const chunk2 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"think about this"}}]}',
    state,
    "en"
  )

  expect(state.reasoningBuffer).toBe("Let me think about this")
  expect(chunk2[0].thinkingStep?.detail).toBe("Let me think about this")
})

test("reasoning buffer: resets when content starts", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}',
    state,
    "en"
  )
  expect(state.isInReasoning).toBe(true)
  expect(state.reasoningBuffer).toBe("thinking...")

  const contentChunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"content":"Final answer"}}]}',
    state,
    "en"
  )

  expect(state.isInReasoning).toBe(false)
  expect(state.reasoningBuffer).toBe("")
  expect(contentChunk[0].text).toBe("Final answer")
})

test("reasoning buffer: starts new buffer on first reasoning_content", () => {
  const state = createSSEParserState()
  expect(state.isInReasoning).toBe(false)
  expect(state.reasoningBuffer).toBe("")

  const chunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"new thought"}}]}',
    state,
    "en"
  )

  expect(state.isInReasoning).toBe(true)
  expect(state.reasoningBuffer).toBe("new thought")
  expect(chunk[0].thinkingStep?.type).toBe("reasoning")
  expect(chunk[0].thinkingStep?.label).toBe("Thinking...")
})

test("handles empty lines", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("", state, "en")
  expect(chunks.length).toBe(0)
})

test("handles [DONE] marker", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("data: [DONE]", state, "en")
  expect(chunks.length).toBe(0)
})

test("handles malformed JSON gracefully", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("data: {invalid json}", state, "en")
  expect(chunks.length).toBe(0)
})

test("ignores unknown events", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: unknown_event", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"some":"data"}', state, "en")

  expect(chunks.length).toBe(0)
})
