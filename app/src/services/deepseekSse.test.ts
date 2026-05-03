import test from "node:test";
import assert from "node:assert/strict";

import { createSSEParserState, parseDeepSeekSSELine } from "./deepseekSse.ts";

test("parses legacy DeepSeek reasoning and content deltas", () => {
  const state = createSSEParserState();

  const reasoning = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"reasoning_content":"step 1"}}]}',
    state,
    "en"
  );
  const content = parseDeepSeekSSELine(
    'data: {"choices":[{"delta":{"content":"final answer"}}]}',
    state,
    "en"
  );

  assert.deepEqual(reasoning, [
    {
      text: "",
      thinkingStep: {
        type: "reasoning",
        label: "Thinking...",
        detail: "step 1",
      },
    },
  ]);
  assert.deepEqual(content, [{ text: "final answer" }]);
});

test("parses worker tool and content events", () => {
  const state = createSSEParserState();

  const toolStartEvent = parseDeepSeekSSELine("event: tool_start", state, "en");
  const toolStartData = parseDeepSeekSSELine(
    'data: {"tool":"search_knowledge_base","args":{"query":"housing"}}',
    state,
    "en"
  );
  const toolResultEvent = parseDeepSeekSSELine(
    "event: tool_result",
    state,
    "en"
  );
  const toolResultData = parseDeepSeekSSELine(
    'data: {"tool":"search_knowledge_base","status":"success","summary":"2 results"}',
    state,
    "en"
  );
  const contentEvent = parseDeepSeekSSELine("event: content", state, "en");
  const contentData = parseDeepSeekSSELine(
    'data: {"delta":"Housing options are available."}',
    state,
    "en"
  );
  const doneEvent = parseDeepSeekSSELine("event: done", state, "en");
  const doneData = parseDeepSeekSSELine(
    'data: {"usage":{"prompt_tokens":10}}',
    state,
    "en"
  );

  assert.deepEqual(toolStartEvent, []);
  assert.deepEqual(toolStartData, [
    {
      text: "",
      thinkingStep: {
        type: "tool_call",
        label: "Calling tool: search_knowledge_base",
        detail: '{"query":"housing"}',
      },
    },
  ]);
  assert.deepEqual(toolResultEvent, []);
  assert.deepEqual(toolResultData, [
    {
      text: "",
      thinkingStep: {
        type: "processing",
        label: "Tool finished: search_knowledge_base",
        detail: "success — 2 results",
      },
    },
  ]);
  assert.deepEqual(contentEvent, []);
  assert.deepEqual(contentData, [{ text: "Housing options are available." }]);
  assert.deepEqual(doneEvent, []);
  assert.deepEqual(doneData, []);
});

// ─────────────────────────────────────────────────────────────────────────────
// T6: Parser compatibility tests for Worker `name` field vs legacy `tool` field
// These tests capture the mismatch between Worker output and frontend parser.
// Worker emits `{ name }` but parser expects `{ tool }`.
// ─────────────────────────────────────────────────────────────────────────────

test("Worker name payload: tool_start with { name } should parse tool name (not unknown)", () => {
  const state = createSSEParserState();

  // Worker emits: { name: "web_search", args: {...} }
  parseDeepSeekSSELine("event: tool_start", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","args":{"query":"housing options"}}',
    state,
    "en"
  );

  // EXPECTED TO FAIL: parser reads `data.tool` which is undefined → "Calling tool: unknown"
  // After T15 fix: parser should read `data.name` → "Calling tool: web_search"
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "tool_call");
  assert.equal(chunks[0].thinkingStep?.label, "Calling tool: web_search");
  assert.equal(chunks[0].thinkingStep?.detail, '{"query":"housing options"}');
});

test("Worker name payload: tool_result with { name } should parse tool name (not unknown)", () => {
  const state = createSSEParserState();

  // Worker emits: { name: "web_search", status: "success", summary: "3 results" }
  parseDeepSeekSSELine("event: tool_result", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","status":"success","summary":"3 results found"}',
    state,
    "en"
  );

  // EXPECTED TO FAIL: parser reads `data.tool` which is undefined → "Tool finished: unknown"
  // After T15 fix: parser should read `data.name` → "Tool finished: web_search"
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "processing");
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: web_search");
  assert.equal(chunks[0].thinkingStep?.detail, "success — 3 results found");
});

test("Legacy tool payload: tool_start with { tool } remains supported", () => {
  const state = createSSEParserState();

  // Legacy format: { tool: "search_knowledge_base", args: {...} }
  parseDeepSeekSSELine("event: tool_start", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"search_knowledge_base","args":{"query":"dorms"}}',
    state,
    "en"
  );

  // SHOULD PASS: existing parser handles `tool` field correctly
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "tool_call");
  assert.equal(
    chunks[0].thinkingStep?.label,
    "Calling tool: search_knowledge_base"
  );
  assert.equal(chunks[0].thinkingStep?.detail, '{"query":"dorms"}');
});

test("Legacy tool payload: tool_result with { tool } remains supported", () => {
  const state = createSSEParserState();

  // Legacy format: { tool: "grep_docs", status: "success", summary: "found 5 matches" }
  parseDeepSeekSSELine("event: tool_result", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"tool":"grep_docs","status":"success","summary":"found 5 matches"}',
    state,
    "en"
  );

  // SHOULD PASS: existing parser handles `tool` field correctly
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.type, "processing");
  assert.equal(chunks[0].thinkingStep?.label, "Tool finished: grep_docs");
  assert.equal(chunks[0].thinkingStep?.detail, "success — found 5 matches");
});

test("Future trace events are ignored safely", () => {
  const state = createSSEParserState();

  // Unknown event type should be ignored
  parseDeepSeekSSELine("event: trace", state, "en");
  const traceChunks = parseDeepSeekSSELine(
    'data: {"type":"model_call","duration_ms":150}',
    state,
    "en"
  );

  // SHOULD PASS: unknown events return empty array
  assert.deepEqual(traceChunks, []);

  // Another unknown event
  parseDeepSeekSSELine("event: metrics", state, "en");
  const metricsChunks = parseDeepSeekSSELine(
    'data: {"tokens_used":256,"latency_ms":300}',
    state,
    "en"
  );

  assert.deepEqual(metricsChunks, []);
});

test("Worker name payload: Chinese locale labels use name field", () => {
  const state = createSSEParserState();

  // Worker emits: { name: "custom_skills", args: {...} }
  parseDeepSeekSSELine("event: tool_start", state, "zh");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"custom_skills","args":{"skill":"campus_map"}}',
    state,
    "zh"
  );

  // EXPECTED TO FAIL: parser reads `data.tool` which is undefined → "调用工具: unknown"
  // After T15 fix: parser should read `data.name` → "调用工具: custom_skills"
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.label, "调用工具: custom_skills");
});

test("Worker name payload: mixed name and args fields parse correctly", () => {
  const state = createSSEParserState();

  // Full Worker-style payload with name, args, and extra fields
  parseDeepSeekSSELine("event: tool_start", state, "en");
  const chunks = parseDeepSeekSSELine(
    'data: {"name":"web_search","args":{"query":"UIUC housing","max_results":5},"call_id":"call_123"}',
    state,
    "en"
  );

  // EXPECTED TO FAIL: `name` field not recognized → "Calling tool: unknown"
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].thinkingStep?.label, "Calling tool: web_search");
  // detail should stringify args
  assert.ok(chunks[0].thinkingStep?.detail?.includes("UIUC housing"));
});
