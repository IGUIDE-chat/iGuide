import assert from "node:assert/strict";
import test from "node:test";

import {
	Observation,
	createObservation,
	observationStatus,
	observationSummary,
	observationRaw,
	observationTruncated,
	observationError,
	observationToolCallId,
	observationToolName,
	observationInput,
	observationOutput,
} from "./observation.ts";

function createSuccessObservation(): Observation {
	return {
		toolCallId: "call_abc123",
		toolName: "search_knowledge_base",
		input: { query: "PAR dorm dining", limit: 5 },
		output: { content: "Found 3 dining options at PAR", results: [] },
		status: "success",
		summary: "Found 3 dining options at PAR",
		raw: '{"content":"Found 3 dining options at PAR","results":[]}',
		truncated: false,
		error: null,
	};
}

function createErrorObservation(): Observation {
	return {
		toolCallId: "call_def456",
		toolName: "web_search",
		input: { query: "UIUC housing" },
		output: null,
		status: "error",
		summary: "API timeout after 30s",
		raw: '{"error":"timeout"}',
		truncated: false,
		error: { code: "TIMEOUT", message: "API timeout after 30s" },
	};
}

function createTruncatedObservation(): Observation {
	return {
		toolCallId: "call_ghi789",
		toolName: "grep_docs",
		input: { pattern: "dorm", path: "/docs" },
		output: { content: "Very long output..." },
		status: "success",
		summary: "Very long output...",
		raw: '{"content":"Very long output that was truncated..."}',
		truncated: true,
		error: null,
	};
}

test("Observation has required tool identity fields", () => {
	const obs = createSuccessObservation();

	assert.equal(typeof obs.toolCallId, "string", "toolCallId must be a string");
	assert.equal(typeof obs.toolName, "string", "toolName must be a string");
	assert.ok(obs.input !== undefined, "input must be present");
	assert.ok(obs.output !== undefined, "output must be present");
});

test("toolCallId and toolName are separate fields", () => {
	const obs = createSuccessObservation();

	assert.equal(obs.toolCallId, "call_abc123");
	assert.equal(obs.toolName, "search_knowledge_base");
	assert.notEqual(obs.toolCallId, obs.toolName, "toolCallId and toolName must be distinct");
});

test("input preserves tool arguments", () => {
	const obs = createSuccessObservation();

	assert.deepEqual(obs.input, { query: "PAR dorm dining", limit: 5 });
});

test("output contains tool result content", () => {
	const obs = createSuccessObservation();

	assert.ok(obs.output !== null);
	assert.equal(typeof obs.output, "object");
});

test("Observation has status field", () => {
	const successObs = createSuccessObservation();
	assert.equal(successObs.status, "success");

	const errorObs = createErrorObservation();
	assert.equal(errorObs.status, "error");
});

test("Observation has summary field", () => {
	const obs = createSuccessObservation();

	assert.equal(typeof obs.summary, "string");
	assert.equal(obs.summary, "Found 3 dining options at PAR");
});

test("Observation has raw field for original response", () => {
	const obs = createSuccessObservation();

	assert.equal(typeof obs.raw, "string");
	assert.ok(obs.raw.length > 0, "raw should contain serialized data");
});

test("Observation tracks truncated flag", () => {
	const normalObs = createSuccessObservation();
	assert.equal(normalObs.truncated, false);

	const truncatedObs = createTruncatedObservation();
	assert.equal(truncatedObs.truncated, true);
});

test("Observation has error field that is null on success", () => {
	const successObs = createSuccessObservation();
	assert.equal(successObs.error, null, "Successful observation should have null error");
});

test("Observation error field contains error details on failure", () => {
	const errorObs = createErrorObservation();

	assert.ok(errorObs.error !== null, "Error observation should have non-null error");
	assert.equal(typeof errorObs.error, "object");
	assert.equal(errorObs.error.code, "TIMEOUT");
	assert.equal(errorObs.error.message, "API timeout after 30s");
});

test("observationToolCallId extracts tool call identifier", () => {
	const obs = createSuccessObservation();

	assert.equal(observationToolCallId(obs), "call_abc123");
});

test("observationToolName extracts tool name", () => {
	const obs = createSuccessObservation();

	assert.equal(observationToolName(obs), "search_knowledge_base");
});

test("observationInput extracts tool input arguments", () => {
	const obs = createSuccessObservation();

	const input = observationInput(obs);
	assert.deepEqual(input, { query: "PAR dorm dining", limit: 5 });
});

test("observationOutput extracts tool output content", () => {
	const obs = createSuccessObservation();

	const output = observationOutput(obs);
	assert.ok(output !== null);
	assert.equal(typeof output, "object");
});

test("observationStatus extracts observation status", () => {
	const successObs = createSuccessObservation();
	assert.equal(observationStatus(successObs), "success");

	const errorObs = createErrorObservation();
	assert.equal(observationStatus(errorObs), "error");
});

test("observationSummary extracts observation summary", () => {
	const obs = createSuccessObservation();

	assert.equal(observationSummary(obs), "Found 3 dining options at PAR");
});

test("observationRaw extracts raw response data", () => {
	const obs = createSuccessObservation();

	const raw = observationRaw(obs);
	assert.equal(typeof raw, "string");
	assert.ok(raw.includes("Found 3 dining options"));
});

test("observationTruncated extracts truncation flag", () => {
	const normalObs = createSuccessObservation();
	assert.equal(observationTruncated(normalObs), false);

	const truncatedObs = createTruncatedObservation();
	assert.equal(observationTruncated(truncatedObs), true);
});

test("observationError extracts error details", () => {
	const successObs = createSuccessObservation();
	assert.equal(observationError(successObs), null);

	const errorObs = createErrorObservation();
	const error = observationError(errorObs);
	assert.ok(error !== null);
	assert.equal(error.code, "TIMEOUT");
});

test("observation fields are independently accessible", () => {
	const obs = createSuccessObservation();

	const toolCallId = observationToolCallId(obs);
	const toolName = observationToolName(obs);
	const input = observationInput(obs);
	const output = observationOutput(obs);
	const status = observationStatus(obs);
	const summary = observationSummary(obs);
	const raw = observationRaw(obs);
	const truncated = observationTruncated(obs);
	const error = observationError(obs);

	assert.equal(toolCallId, "call_abc123");
	assert.equal(toolName, "search_knowledge_base");
	assert.ok(input !== undefined);
	assert.ok(output !== undefined);
	assert.equal(status, "success");
	assert.equal(summary, "Found 3 dining options at PAR");
	assert.ok(raw.length > 0);
	assert.equal(truncated, false);
	assert.equal(error, null);
});

test("error observation has null output", () => {
	const obs = createErrorObservation();

	assert.equal(obs.output, null, "Error observation should have null output");
	assert.equal(obs.status, "error");
	assert.ok(obs.error !== null);
});

test("truncated observation still has valid output", () => {
	const obs = createTruncatedObservation();

	assert.ok(obs.output !== null, "Truncated observation should still have output");
	assert.equal(obs.truncated, true);
	assert.equal(obs.status, "success");
});

test("observation preserves complex input structures", () => {
	const obs: Observation = {
		toolCallId: "call_complex",
		toolName: "search_knowledge_base",
		input: {
			query: "dorm options",
			filters: { type: "residence", year: 2024 },
			options: { limit: 10, offset: 0 },
		},
		output: { content: "results" },
		status: "success",
		summary: "Found results",
		raw: "{}",
		truncated: false,
		error: null,
	};

	const input = observationInput(obs);
	assert.deepEqual(input.filters, { type: "residence", year: 2024 });
	assert.deepEqual(input.options, { limit: 10, offset: 0 });
});

test("observation preserves complex output structures", () => {
	const obs: Observation = {
		toolCallId: "call_complex",
		toolName: "search_knowledge_base",
		input: { query: "test" },
		output: {
			content: "Found dorms",
			results: [
				{ name: "PAR", type: "residence" },
				{ name: "ISR", type: "residence" },
			],
			metadata: { total: 2, page: 1 },
		},
		status: "success",
		summary: "Found 2 dorms",
		raw: "{}",
		truncated: false,
		error: null,
	};

	const output = observationOutput(obs);
	assert.ok(Array.isArray(output.results));
	assert.equal(output.results.length, 2);
	assert.equal(output.metadata.total, 2);
});
