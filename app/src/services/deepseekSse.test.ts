import test from "node:test";
import assert from "node:assert/strict";

import { createSSEParserState, parseDeepSeekSSELine } from "./deepseekSse.ts";

test("parses legacy DeepSeek reasoning and content deltas", () => {
	const state = createSSEParserState();

	const reasoning = parseDeepSeekSSELine(
		'data: {"choices":[{"delta":{"reasoning_content":"step 1"}}]}',
		state,
		"en",
	);
	const content = parseDeepSeekSSELine(
		'data: {"choices":[{"delta":{"content":"final answer"}}]}',
		state,
		"en",
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
		"en",
	);
	const toolResultEvent = parseDeepSeekSSELine(
		"event: tool_result",
		state,
		"en",
	);
	const toolResultData = parseDeepSeekSSELine(
		'data: {"tool":"search_knowledge_base","status":"success","summary":"2 results"}',
		state,
		"en",
	);
	const contentEvent = parseDeepSeekSSELine("event: content", state, "en");
	const contentData = parseDeepSeekSSELine(
		'data: {"delta":"Housing options are available."}',
		state,
		"en",
	);
	const doneEvent = parseDeepSeekSSELine("event: done", state, "en");
	const doneData = parseDeepSeekSSELine(
		'data: {"usage":{"prompt_tokens":10}}',
		state,
		"en",
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
