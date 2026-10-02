import assert from "node:assert/strict"
import test from "node:test"

import { createSSEParserState, parseDeepSeekSSELine } from "../deepseekSse.ts"

test("tool_start event: parses Worker payload with name field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","args":{"query":"housing"}}',
    state,
    "en",
  )

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].thinkingStep?.type, "tool_call")
  assert.equal(chunks[0].thinkingStep?.label, "Calling tool: web_search")
  assert.equal(chunks[0].thinkingStep?.detail, '{"query":"housing"}')
})

test("tool_start event: parses legacy payload with tool field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"web_search","args":{"query":"dorms"}}',
    state,
    "en",
  )

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].thinkingStep?.type, "tool_call")
  assert.equal(chunks[0].thinkingStep?.label, "Calling tool: web_search")
})

test("tool_start event: uses Chinese locale labels", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_start", state, "zh")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"custom_skills","args":{"skill":"campus_map"}}',
    state,
    "zh",
  )

  assert.equal(chunks[0].thinkingStep?.label, "调用工具: custom_skills")
})

test("tool_result event: parses Worker payload with name field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","status":"success","summary":"3 results"}',
    state,
    "en",
  )

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].thinkingStep?.type, "processing")
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: web_search")
  assert.equal(chunks[0].thinkingStep?.detail, "success — 3 results")
})

test("tool_result event: parses legacy payload with tool field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"web_search","status":"success","summary":"found 5 matches"}',
    state,
    "en",
  )

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].thinkingStep?.type, "processing")
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: web_search")
  assert.equal(chunks[0].thinkingStep?.detail, "success — found 5 matches")
})

test("tool_result event: handles missing status and summary", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: tool_result", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"name":"web_search"}', state, "en")

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].thinkingStep?.detail, undefined)
})

test("content event: parses delta field", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"delta":"Hello, world!"}', state, "en")

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].text, "Hello, world!")
})

test("content event: parses content field (legacy)", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"content":"Final answer here."}', state, "en")

  assert.equal(chunks.length, 1)
  assert.equal(chunks[0].text, "Final answer here.")
})

test("content event: returns empty for empty content", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: content", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"delta":""}', state, "en")

  assert.equal(chunks.length, 0)
})

test("reasoning buffer: accumulates across multiple reasoning_content deltas", () => {
  const state = createSSEParserState()

  const chunk1 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"Let me "}}]}',
    state,
    "en",
  )

  assert.equal(state.isInReasoning, true)
  assert.equal(state.reasoningBuffer, "Let me ")
  assert.equal(chunk1[0].thinkingStep?.detail, "Let me ")

  const chunk2 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"think about this"}}]}',
    state,
    "en",
  )

  assert.equal(state.reasoningBuffer, "Let me think about this")
  assert.equal(chunk2[0].thinkingStep?.detail, "Let me think about this")
})

test("reasoning buffer: resets when content starts", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}',
    state,
    "en",
  )
  assert.equal(state.isInReasoning, true)
  assert.equal(state.reasoningBuffer, "thinking...")

  const contentChunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"content":"Final answer"}}]}',
    state,
    "en",
  )

  assert.equal(state.isInReasoning, false)
  assert.equal(state.reasoningBuffer, "")
  assert.equal(contentChunk[0].text, "Final answer")
})

test("reasoning buffer: starts new buffer on first reasoning_content", () => {
  const state = createSSEParserState()
  assert.equal(state.isInReasoning, false)
  assert.equal(state.reasoningBuffer, "")

  const chunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"new thought"}}]}',
    state,
    "en",
  )

  assert.equal(state.isInReasoning, true)
  assert.equal(state.reasoningBuffer, "new thought")
  assert.equal(chunk[0].thinkingStep?.type, "reasoning")
  assert.equal(chunk[0].thinkingStep?.label, "Thinking...")
})

test("handles empty lines", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("", state, "en")
  assert.equal(chunks.length, 0)
})

test("handles [DONE] marker", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("data: [DONE]", state, "en")
  assert.equal(chunks.length, 0)
})

test("handles malformed JSON gracefully", () => {
  const state = createSSEParserState()
  const chunks = parseDeepSeekSSELine("data: {invalid json}", state, "en")
  assert.equal(chunks.length, 0)
})

test("ignores unknown events", () => {
  const state = createSSEParserState()

  parseDeepSeekSSELine("event: unknown_event", state, "en")
  const chunks = parseDeepSeekSSELine('data: {"some":"data"}', state, "en")

  assert.equal(chunks.length, 0)
})

function parseSourceEvent(payload: unknown) {
  const state = createSSEParserState()
  parseDeepSeekSSELine("event: source-url", state, "en")
  return parseDeepSeekSSELine(`data: ${JSON.stringify(payload)}`, state, "en")
}

test("source-url event: yields a source chunk with id, url, title, and snippet", () => {
  const chunks = parseSourceEvent({
    sourceId: "https://housing.illinois.edu/rates",
    url: "https://housing.illinois.edu/rates",
    title: "Room and Board Rates",
    snippet: "Rates for the 2026-27 academic year…",
  })

  assert.deepEqual(chunks, [
    {
      text: "",
      source: {
        id: "https://housing.illinois.edu/rates",
        url: "https://housing.illinois.edu/rates",
        title: "Room and Board Rates",
        snippet: "Rates for the 2026-27 academic year…",
      },
    },
  ])
})

test("source-url event: falls back to the hostname when the title is missing or blank", () => {
  const missing = parseSourceEvent({
    sourceId: "https://housing.illinois.edu/rates",
    url: "https://housing.illinois.edu/rates",
  })
  const blank = parseSourceEvent({ url: "https://www.illinois.edu/about", title: "   " })

  assert.equal(missing.length, 1)
  assert.equal(missing[0].source?.title, "housing.illinois.edu")
  assert.ok(!("snippet" in (missing[0].source ?? {})), "absent snippet stays absent")
  assert.equal(blank[0].source?.title, "www.illinois.edu")
})

test("source-url event: sourceId falls back to the url", () => {
  const chunks = parseSourceEvent({ url: "https://illinois.edu/", title: "Illinois" })

  assert.equal(chunks[0].source?.id, "https://illinois.edu/")
})

test("source-url event: ignores non-http(s) and unparseable URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "ftp://illinois.edu/file",
    "not a url",
    "",
  ]) {
    assert.deepEqual(parseSourceEvent({ sourceId: url, url, title: "x" }), [], url)
  }
})

test("source-url event: ignores payloads without a string url", () => {
  assert.deepEqual(parseSourceEvent({ title: "No URL" }), [])
  assert.deepEqual(parseSourceEvent({ url: 42, title: "Numeric URL" }), [])
  assert.deepEqual(parseSourceEvent(null), [])
})

test("source-url event: an invalid payload never falls through to legacy delta parsing", () => {
  const chunks = parseSourceEvent({
    url: "javascript:alert(1)",
    choices: [{ delta: { content: "injected text" } }],
  })

  assert.deepEqual(chunks, [])
})
