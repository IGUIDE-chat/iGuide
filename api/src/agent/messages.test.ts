import assert from "node:assert/strict";
import test from "node:test";

import {
	buildProviderMessages,
	convertToolResultToMessage,
	normalizeMessages,
} from "./messages.ts";

test("first-turn provider messages preserve system and current user order", () => {
	const messages = buildProviderMessages({
		systemPrompt: "system prompt",
		history: [],
		message: "Where should I live freshman year?",
	});

	assert.equal(messages.length, 2);
	assert.deepEqual(messages.map((message) => message.role), ["system", "user"]);
	assert.equal(messages[0].content, "system prompt");
	assert.equal(messages[1].content, "Where should I live freshman year?");
	assert.ok(
		messages.every((message) => message.role !== "tool"),
		"First turn must not invent tool messages",
	);
});

test("normalizes history roles and appends current user message", () => {
	const messages = normalizeMessages({
		history: [
			{ role: "model", content: "I can help with housing." },
			{ role: "assistant", content: "What preferences do you have?" },
			{ role: "unexpected", content: "I want quiet dorms." },
		],
		message: "Compare ISR and PAR.",
	});

	assert.deepEqual(messages, [
		{ role: "assistant", content: "I can help with housing." },
		{ role: "assistant", content: "What preferences do you have?" },
		{ role: "user", content: "I want quiet dorms." },
		{ role: "user", content: "Compare ISR and PAR." },
	]);
});

test("replay-turn provider messages preserve assistant tool call and linked tool result", () => {
	const toolCall = {
		id: "call_search_1",
		type: "function" as const,
		function: {
			name: "search_knowledge_base",
			arguments: JSON.stringify({ query: "PAR dorm dining" }),
		},
	};

	const toolMessage = convertToolResultToMessage({
		toolCall,
		result: {
			content: "PAR has multiple dining options.",
			metadata: { source: "knowledge_base" },
		},
	});

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
	});

	assert.deepEqual(messages.map((message) => message.role), [
		"system",
		"user",
		"assistant",
		"tool",
		"user",
	]);

	const assistantMessage = messages[2];
	assert.equal(assistantMessage.tool_calls?.[0]?.id, "call_search_1");
	assert.equal(
		assistantMessage.tool_calls?.[0]?.function.name,
		"search_knowledge_base",
	);

	const replayToolMessage = messages[3];
	assert.equal(replayToolMessage.tool_call_id, "call_search_1");
	assert.equal(replayToolMessage.role, "tool");
	assert.match(replayToolMessage.content ?? "", /PAR has multiple dining options/);
	assert.match(replayToolMessage.content ?? "", /knowledge_base/);
	assert.equal(messages.at(-1)?.content, "Use that result to answer.");
});

test("plain tool result conversion keeps simple content unchanged", () => {
	const message = convertToolResultToMessage({
		toolCall: {
			id: "call_plain",
			type: "function",
			function: { name: "grep_docs", arguments: "{}" },
		},
		result: { content: "plain result" },
	});

	assert.deepEqual(message, {
		role: "tool",
		tool_call_id: "call_plain",
		content: "plain result",
	});
});
