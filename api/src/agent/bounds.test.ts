import assert from "node:assert/strict";
import test from "node:test";

import {
	DEFAULT_MAX_ITERATIONS,
	evaluateStopCondition,
} from "./bounds.ts";
import type { Observation } from "./observation.ts";
import type { ProviderToolCall } from "./messages.ts";

function toolCall(name = "web_search"): ProviderToolCall {
	return {
		id: `call_${name}`,
		type: "function",
		function: {
			name,
			arguments: "{}",
		},
	};
}

function observation(options: {
	status?: Observation["status"];
	code?: string;
	message?: string;
}): Observation {
	const status = options.status ?? (options.code ? "error" : "success");
	return {
		toolCallId: "call_1",
		toolName: "web_search",
		input: {},
		output: "",
		status,
		summary: options.message ?? options.code ?? "ok",
		raw: options.code ? JSON.stringify({ error: options.code }) : "ok",
		truncated: false,
		error: options.code
			? {
					code: options.code,
					message: options.message ?? options.code,
					type: options.code,
				}
			: null,
	};
}

test("evaluateStopCondition stops content-only model responses as final answers", () => {
	const decision = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [],
	});

	assert.equal(decision.shouldStop, true);
	assert.equal(decision.reason, "final_answer");
	assert.equal(decision.semanticLabel, "final_answer_no_tool_calls");
	assert.equal(decision.fallbackReason, null);
});

test("evaluateStopCondition stops continued tool use at the max iteration bound", () => {
	const decision = evaluateStopCondition({
		iterationCount: DEFAULT_MAX_ITERATIONS,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
	});

	assert.equal(decision.shouldStop, true);
	assert.equal(decision.reason, "max_iterations");
	assert.equal(decision.semanticLabel, "max_iterations_reached");
	assert.equal(decision.fallbackReason, "max_iterations_exceeded");
});

test("evaluateStopCondition stops when the registry reports max tool-call budget exceeded", () => {
	const decision = evaluateStopCondition({
		iterationCount: 2,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		observations: [observation({ code: "budget_exceeded" })],
	});

	assert.equal(decision.shouldStop, true);
	assert.equal(decision.reason, "max_tool_calls");
	assert.equal(decision.semanticLabel, "tool_call_budget_exceeded");
	assert.equal(decision.fallbackReason, "tool_failure");
});

test("evaluateStopCondition stops unrecoverable invalid tool calls", () => {
	const invalidArguments = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		observations: [observation({ code: "invalid_arguments" })],
	});

	assert.equal(invalidArguments.shouldStop, true);
	assert.equal(invalidArguments.reason, "invalid_tool_call");
	assert.equal(invalidArguments.semanticLabel, "unrecoverable_invalid_tool_call");
	assert.equal(invalidArguments.fallbackReason, "tool_failure");

	const missingTool = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall("missing_tool")],
		observations: [observation({ code: "tool_not_found" })],
	});

	assert.equal(missingTool.shouldStop, true);
	assert.equal(missingTool.reason, "invalid_tool_call");
});

test("evaluateStopCondition keeps recoverable tool errors in the loop with fallback context", () => {
	const failure = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		observations: [observation({ code: "execution_failed" })],
	});

	assert.equal(failure.shouldStop, false);
	assert.equal(failure.reason, null);
	assert.equal(failure.semanticLabel, "continue_after_recoverable_tool_error");
	assert.equal(failure.fallbackReason, "tool_failure");

	const timeout = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		observations: [observation({ code: "timeout" })],
	});

	assert.equal(timeout.shouldStop, false);
	assert.equal(timeout.fallbackReason, "tool_timeout");
});

test("evaluateStopCondition exposes generic loop errors as machine-readable stops", () => {
	const decision = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		error: new Error("provider failed"),
	});

	assert.equal(decision.shouldStop, true);
	assert.equal(decision.reason, "error");
	assert.equal(decision.semanticLabel, "loop_error");
	assert.equal(decision.fallbackReason, "tool_failure");
});

test("evaluateStopCondition continues when tools and observations are within bounds", () => {
	const decision = evaluateStopCondition({
		iterationCount: 1,
		maxIterations: DEFAULT_MAX_ITERATIONS,
		toolCalls: [toolCall()],
		observations: [observation({ status: "success" })],
	});

	assert.equal(decision.shouldStop, false);
	assert.equal(decision.reason, null);
	assert.equal(decision.semanticLabel, "continue_within_bounds");
	assert.equal(decision.fallbackReason, null);
});
