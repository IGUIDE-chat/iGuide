import test from "node:test";
import assert from "node:assert/strict";

import { createSSEParserState, parseDeepSeekSSELine } from "../deepseekSse.ts";

test("tool_start event: parses Worker payload with name field", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_start", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","args":{"query":"housing"}}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "tool_call");
  assert.equal(chunks[0].thinkingStep?.label, "Calling tool: web_search");
  assert.equal(chunks[0].thinkingStep?.detail, '{"query":"housing"}');
});

test("tool_start event: parses legacy payload with tool field", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_start", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"search_knowledge_base","args":{"query":"dorms"}}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "tool_call");
  assert.equal(
    chunks[0].thinkingStep?.label,
    "Calling tool: search_knowledge_base"
  );
});

test("tool_start event: uses Chinese locale labels", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_start", state, "zh");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"custom_skills","args":{"skill":"campus_map"}}',
    state,
    "zh"
  );

  assert.equal(chunks[0].thinkingStep?.label, "调用工具: custom_skills");
});

test("tool_result event: parses Worker payload with name field", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_result", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","status":"success","summary":"3 results"}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "processing");
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: web_search");
  assert.equal(chunks[0].thinkingStep?.detail, "success — 3 results");
});

test("tool_result event: parses legacy payload with tool field", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_result", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"grep_docs","status":"success","summary":"found 5 matches"}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "processing");
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: grep_docs");
  assert.equal(chunks[0].thinkingStep?.detail, "success — found 5 matches");
});

test("tool_result event: handles missing status and summary", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: tool_result", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search"}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.detail, undefined);
});

test("content event: parses delta field", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: content", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"delta":"Hello, world!"}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, "Hello, world!");
});

test("content event: parses content field (legacy)", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: content", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"content":"Final answer here."}',
    state,
    "en"
  );

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, "Final answer here.");
});

test("content event: returns empty for empty content", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: content", state, "en");
  const chunks = parseDeepSeekSSELine('data: {"delta":""}', state, "en");

  assert.equal(chunks.length, 0);
});

test("reasoning buffer: accumulates across multiple reasoning_content deltas", () => {
  const state = createSSEParserState();

  const chunk1 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"Let me "}}]}',
    state,
    "en"
  );

  assert.equal(state.isInReasoning, true);
  assert.equal(state.reasoningBuffer, "Let me ");
  assert.equal(chunk1[0].thinkingStep?.detail, "Let me ");

  const chunk2 = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"think about this"}}]}',
    state,
    "en"
  );

  assert.equal(state.reasoningBuffer, "Let me think about this");
  assert.equal(chunk2[0].thinkingStep?.detail, "Let me think about this");
});

test("reasoning buffer: resets when content starts", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}',
    state,
    "en"
  );
  assert.equal(state.isInReasoning, true);
  assert.equal(state.reasoningBuffer, "thinking...");

  const contentChunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"content":"Final answer"}}]}',
    state,
    "en"
  );

  assert.equal(state.isInReasoning, false);
  assert.equal(state.reasoningBuffer, "");
  assert.equal(contentChunk[0].text, "Final answer");
});

test("reasoning buffer: starts new buffer on first reasoning_content", () => {
  const state = createSSEParserState();
  assert.equal(state.isInReasoning, false);
  assert.equal(state.reasoningBuffer, "");

  const chunk = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"new thought"}}]}',
    state,
    "en"
  );

  assert.equal(state.isInReasoning, true);
  assert.equal(state.reasoningBuffer, "new thought");
  assert.equal(chunk[0].thinkingStep?.type, "reasoning");
  assert.equal(chunk[0].thinkingStep?.label, "Thinking...");
});

test("handles empty lines", () => {
  const state = createSSEParserState();
  const chunks = parseDeepSeekSSELine("", state, "en");
  assert.equal(chunks.length, 0);
});

test("handles [DONE] marker", () => {
  const state = createSSEParserState();
  const chunks = parseDeepSeekSSELine("data: [DONE]", state, "en");
  assert.equal(chunks.length, 0);
});

test("handles malformed JSON gracefully", () => {
  const state = createSSEParserState();
  const chunks = parseDeepSeekSSELine("data: {invalid json}", state, "en");
  assert.equal(chunks.length, 0);
});

test("ignores unknown events", () => {
  const state = createSSEParserState();

  parseDeepSeekSSELine("event: unknown_event", state, "en");
  const chunks = parseDeepSeekSSELine('data: {"some":"data"}', state, "en");

  assert.equal(chunks.length, 0);
});
