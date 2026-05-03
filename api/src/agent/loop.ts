import {
	logFallbackEvent,
	withFallback,
	type FallbackEvent,
	type FallbackReason,
} from "./fallback.ts";
import {
	sendContent,
	sendDone,
	sendFallback,
	sendToolResult,
	sendToolStart,
} from "./stream.ts";
import { buildSystemPrompt } from "./prompts.ts";
import { shouldEnableRetrievalTools } from "./retrieval-policy.ts";
import {
	buildProviderMessages,
	convertObservationToMessage,
	type ProviderMessage,
	type ProviderToolCall,
} from "./messages.ts";
import { buildObservation } from "./observation.ts";
import type { ToolRegistry } from "../tools/registry.ts";
import type { OpenAITool, RequestContext, ToolResult } from "../tools/types.ts";

export interface AgentLoopOptions {
	message: string;
	history: Array<{ role: string; content: string }>;
	registry: ToolRegistry;
	env: Record<string, string>;
	userId?: string;
	region?: string;
	maxIterations?: number;
	lang?: string;
}

export interface AgentLoopToolCall {
	name: string;
	args: Record<string, unknown>;
	result: ToolResult;
}

export interface AgentLoopResult {
	content: string;
	toolCalls: AgentLoopToolCall[];
	iterations: number;
	usage?: { prompt_tokens: number; completion_tokens: number };
	metadata?: Record<string, unknown>;
}

type ChatCompletionMessage = ProviderMessage;

type DeepSeekToolCall = ProviderToolCall;

interface DeepSeekChoice {
	message?: {
		role: "assistant";
		content: string | null;
		reasoning_content?: string | null;
		tool_calls?: DeepSeekToolCall[] | null;
	};
	finish_reason?: string | null;
}

interface DeepSeekStreamDeltaToolCall {
	index: number;
	id?: string;
	type?: "function";
	function?: {
		name?: string;
		arguments?: string;
	};
}

interface DeepSeekStreamChoice {
	delta?: {
		role?: "assistant";
		content?: string | null;
		reasoning_content?: string | null;
		tool_calls?: DeepSeekStreamDeltaToolCall[] | null;
	};
	finish_reason?: string | null;
}

interface DeepSeekStreamChunk {
	choices?: DeepSeekStreamChoice[];
	usage?: DeepSeekUsage;
	error?: {
		message?: string;
	};
}

interface DeepSeekUsage {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
}

interface DeepSeekResponse {
	choices?: DeepSeekChoice[];
	usage?: DeepSeekUsage;
	error?: {
		message?: string;
	};
}

interface ProviderConfig {
	endpoint: string;
	apiKey: string;
	region: string;
}

interface StreamingToolCallAccumulator {
	id: string;
	index: number;
	type: "function";
	function: {
		name: string;
		arguments: string;
	};
}

interface StreamingAgentLoopOptions extends AgentLoopOptions {
	writer: WritableStreamDefaultWriter<string>;
}

interface ParsedStreamResponse {
	content: string;
	toolCalls: DeepSeekToolCall[];
	usage?: DeepSeekUsage;
	finishReason?: string | null;
}

interface ExecutedStreamingToolResult {
	toolCall: DeepSeekToolCall;
	args: Record<string, unknown>;
	result: ToolResult;
}

interface StreamingIterationOutcome {
	content: string;
	toolCalls: AgentLoopToolCall[];
	iterations: number;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	metadata?: Record<string, unknown>;
	nextMessages?: ChatCompletionMessage[];
	fallbackReason?: FallbackReason;
}

const DEFAULT_MAX_ITERATIONS = 3;

function detectRegion(region?: string, env?: Record<string, string>): string {
	const candidates = [
		region,
		env?.USER_REGION,
		env?.X_USER_REGION,
		env?.CF_REGION,
		env?.USER_COUNTRY,
		env?.X_USER_COUNTRY,
		env?.CF_COUNTRY,
	]
		.filter(Boolean)
		.map((value) => value!.toUpperCase());

	return candidates.some((value) => value === "CN" || value === "CHINA")
		? "CN"
		: "Global";
}

function getProviderConfig(options: {
	region?: string;
	env: Record<string, string>;
}): ProviderConfig {
	const detectedRegion = detectRegion(options.region, options.env);
	const deepSeekKey = options.env.DEEPSEEK_API_KEY;
	const siliconFlowKey = options.env.SILICONFLOW_API_KEY;

	if (detectedRegion === "CN" && siliconFlowKey) {
		return {
			endpoint: "https://api.siliconflow.cn/v1/chat/completions",
			apiKey: siliconFlowKey,
			region: "CN",
		};
	}

	if (deepSeekKey) {
		return {
			endpoint: "https://api.deepseek.com/chat/completions",
			apiKey: deepSeekKey,
			region: "Global",
		};
	}

	if (siliconFlowKey) {
		return {
			endpoint: "https://api.siliconflow.cn/v1/chat/completions",
			apiKey: siliconFlowKey,
			region: detectedRegion,
		};
	}

	throw new Error("No DeepSeek-compatible API key configured");
}

function buildSupabaseHeaders(env: Record<string, string>): HeadersInit | null {
	const supabaseUrl = env.SUPABASE_URL;
	const authKey = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;

	if (!supabaseUrl || !authKey) {
		return null;
	}

	return {
		apikey: authKey,
		Authorization: `Bearer ${authKey}`,
	};
}

async function fetchSingleColumn(options: {
	env: Record<string, string>;
	table: string;
	column: string;
	userId: string;
}): Promise<string> {
	const supabaseUrl = options.env.SUPABASE_URL;
	const headers = buildSupabaseHeaders(options.env);

	if (!supabaseUrl || !headers) {
		return "";
	}

	const endpoint = new URL(`${supabaseUrl}/rest/v1/${options.table}`);
	endpoint.searchParams.set("select", options.column);
	endpoint.searchParams.set("user_id", `eq.${options.userId}`);
	endpoint.searchParams.set("limit", "1");

	try {
		const response = await fetch(endpoint.toString(), { headers });
		if (!response.ok) {
			return "";
		}

		const payload = (await response.json()) as Array<Record<string, unknown>>;
		const value = payload[0]?.[options.column];
		return typeof value === "string" ? value : "";
	} catch {
		return "";
	}
}

async function getUserMemoryBlock(
	userId: string | undefined,
	env: Record<string, string>,
): Promise<string | undefined> {
	if (!userId) {
		return undefined;
	}

	const [soul, userMemory] = await Promise.all([
		fetchSingleColumn({
			env,
			table: "user_souls",
			column: "soul_prompt",
			userId,
		}),
		fetchSingleColumn({
			env,
			table: "user_memories",
			column: "memory_text",
			userId,
		}),
	]);

	const sections: string[] = [];
	if (soul) {
		sections.push(`### Persona Preferences\n${soul}`);
	}
	if (userMemory) {
		sections.push(`### Remembered User Facts\n${userMemory}`);
	}

	return sections.length > 0 ? sections.join("\n\n") : undefined;
}

function createToolErrorResult(payload: Record<string, unknown>): ToolResult {
	return {
		content: JSON.stringify(payload),
		metadata: {
			error: true,
		},
	};
}

function parseToolArguments(
	toolCall: DeepSeekToolCall,
): Record<string, unknown> {
	const rawArguments = toolCall.function.arguments?.trim();
	if (!rawArguments) {
		return {};
	}

	const parsed = JSON.parse(rawArguments) as unknown;
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("Tool arguments must be a JSON object");
	}

	return parsed as Record<string, unknown>;
}

function buildIterationLimitMessage(lang?: string): string {
	if (lang === "zh") {
		return "我已经达到本轮可用的最大工具调用次数，下面的回答可能不完整。";
	}

	return "I reached the maximum tool-call iterations for this turn, so the answer below may be incomplete.";
}

async function callDeepSeek(options: {
	provider: ProviderConfig;
	messages: ChatCompletionMessage[];
	registry: ToolRegistry;
	tools?: OpenAITool[];
}): Promise<DeepSeekResponse> {
	const response = await fetch(options.provider.endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${options.provider.apiKey}`,
		},
		body: JSON.stringify({
			model: "deepseek-chat",
			messages: options.messages,
			tools: options.tools ?? options.registry.toOpenAITools(),
			stream: false,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`DeepSeek API returned ${response.status}${errorText ? `: ${errorText}` : ""}`,
		);
	}

	return (await response.json()) as DeepSeekResponse;
}

async function callDeepSeekStream(options: {
	provider: ProviderConfig;
	messages: ChatCompletionMessage[];
	registry: ToolRegistry;
	tools?: OpenAITool[];
}): Promise<ReadableStreamDefaultReader<Uint8Array>> {
	const response = await fetch(options.provider.endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${options.provider.apiKey}`,
		},
		body: JSON.stringify({
			model: "deepseek-chat",
			messages: options.messages,
			tools: options.tools ?? options.registry.toOpenAITools(),
			stream: true,
			stream_options: {
				include_usage: true,
			},
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`DeepSeek API returned ${response.status}${errorText ? `: ${errorText}` : ""}`,
		);
	}

	if (!response.body) {
		throw new Error("DeepSeek streaming response missing body");
	}

	return response.body.getReader();
}

function createToolCallAccumulator(
	index: number,
): StreamingToolCallAccumulator {
	return {
		id: `tool_call_${index}`,
		index,
		type: "function",
		function: {
			name: "",
			arguments: "",
		},
	};
}

function accumulateStreamingToolCalls(
	accumulators: Map<number, StreamingToolCallAccumulator>,
	deltaToolCalls: DeepSeekStreamDeltaToolCall[] | null | undefined,
): void {
	if (!deltaToolCalls || deltaToolCalls.length === 0) {
		return;
	}

	for (const deltaToolCall of deltaToolCalls) {
		const accumulator =
			accumulators.get(deltaToolCall.index) ||
			createToolCallAccumulator(deltaToolCall.index);

		if (deltaToolCall.id) {
			accumulator.id = deltaToolCall.id;
		}

		if (deltaToolCall.type) {
			accumulator.type = deltaToolCall.type;
		}

		if (deltaToolCall.function?.name) {
			accumulator.function.name += deltaToolCall.function.name;
		}

		if (deltaToolCall.function?.arguments) {
			accumulator.function.arguments += deltaToolCall.function.arguments;
		}

		accumulators.set(deltaToolCall.index, accumulator);
	}
}

function finalizeStreamingToolCalls(
	accumulators: Map<number, StreamingToolCallAccumulator>,
): DeepSeekToolCall[] {
	return Array.from(accumulators.values())
		.sort((a, b) => a.index - b.index)
		.map((toolCall) => ({
			id: toolCall.id,
			type: toolCall.type,
			function: {
				name: toolCall.function.name,
				arguments: toolCall.function.arguments,
			},
		}));
}

async function readDeepSeekStreamingResponse(options: {
	reader: ReadableStreamDefaultReader<Uint8Array>;
	writer: WritableStreamDefaultWriter<string>;
}): Promise<ParsedStreamResponse> {
	const decoder = new TextDecoder();
	let buffer = "";
	let content = "";
	let finishReason: string | null = null;
	let latestUsage: DeepSeekUsage | undefined;
	const toolCallAccumulators = new Map<number, StreamingToolCallAccumulator>();

	const processChunk = async (chunkText: string): Promise<void> => {
		const lines = chunkText
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		for (const line of lines) {
			if (!line.startsWith("data: ")) {
				continue;
			}

			const payload = line.slice(6);
			if (payload === "[DONE]") {
				continue;
			}

			const data = JSON.parse(payload) as DeepSeekStreamChunk;
			if (data.error?.message) {
				throw new Error(data.error.message);
			}

			if (data.usage) {
				latestUsage = data.usage;
			}

			const choice = data.choices?.[0];
			if (!choice) {
				continue;
			}

			finishReason = choice.finish_reason ?? finishReason;
			const delta = choice.delta;
			if (!delta) {
				continue;
			}

			if (typeof delta.content === "string" && delta.content.length > 0) {
				content += delta.content;
				await sendContent(options.writer, delta.content);
			}

			accumulateStreamingToolCalls(toolCallAccumulators, delta.tool_calls);
		}
	};

	while (true) {
		const { done, value } = await options.reader.read();
		if (done) {
			buffer += decoder.decode();
			break;
		}

		buffer += decoder.decode(value, { stream: true });
		const events = buffer.split("\n\n");
		buffer = events.pop() || "";

		for (const eventText of events) {
			if (!eventText.trim()) {
				continue;
			}

			await processChunk(eventText);
		}
	}

	if (buffer.trim()) {
		await processChunk(buffer);
	}

	return {
		content,
		toolCalls: finalizeStreamingToolCalls(toolCallAccumulators),
		usage: latestUsage,
		finishReason,
	};
}

function summarizeToolResult(result: ToolResult): string {
	const summary = result.content.replace(/\s+/g, " ").trim();
	return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
}

function parseToolFailureReason(result: ToolResult): FallbackReason | null {
	if (!result.metadata?.error) {
		return null;
	}

	try {
		const payload = JSON.parse(result.content) as { error?: string };
		return payload.error === "timeout" ? "tool_timeout" : "tool_failure";
	} catch {
		return "tool_failure";
	}
}

function getFallbackReason(
	toolResults: ExecutedStreamingToolResult[],
): FallbackReason | undefined {
	if (toolResults.length === 0) {
		return undefined;
	}

	const reasons = toolResults.map((entry) =>
		parseToolFailureReason(entry.result),
	);
	if (reasons.some((reason) => reason === null)) {
		return undefined;
	}

	return reasons.every((reason) => reason === "tool_timeout")
		? "tool_timeout"
		: "tool_failure";
}

function buildSimplifiedRetryMessages(
	messages: ChatCompletionMessage[],
	reason: FallbackReason,
): ChatCompletionMessage[] {
	const [systemMessage, ...rest] = messages;
	const trimmedContext = rest.slice(-4);
	const retryInstruction =
		reason === "tool_timeout"
			? "Fallback retry: tool requests timed out. Retry with one tool only and minimal context."
			: "Fallback retry: tool use failed. Retry with one tool only and minimal context.";

	return [
		systemMessage,
		{
			role: "system",
			content: retryInstruction,
		},
		...trimmedContext,
	];
}

function buildDirectFallbackMessages(
	messages: ChatCompletionMessage[],
): ChatCompletionMessage[] {
	return [
		messages[0],
		...messages.slice(-4),
		{
			role: "user",
			content:
				"Tool access is unavailable. Answer directly without tools using general knowledge, be explicit about uncertainty, and keep helping the user.",
		},
	];
}

async function executeStreamingToolCalls(options: {
	toolCalls: DeepSeekToolCall[];
	registry: ToolRegistry;
	requestContext: RequestContext;
	writer: WritableStreamDefaultWriter<string>;
}): Promise<ExecutedStreamingToolResult[]> {
	const toolResults: ExecutedStreamingToolResult[] = [];

	for (const toolCall of options.toolCalls) {
		let args: Record<string, unknown> = {};
		let result: ToolResult;

		try {
			args = parseToolArguments(toolCall);
			await sendToolStart(options.writer, toolCall.function.name, args);
			result = await options.registry.execute(
				toolCall.function.name,
				args,
				options.requestContext,
			);
		} catch (error) {
			result = createToolErrorResult({
				error: "invalid_arguments",
				tool: toolCall.function.name,
				message:
					error instanceof Error ? error.message : "Invalid tool arguments",
				raw_arguments: toolCall.function.arguments,
			});
			await sendToolStart(options.writer, toolCall.function.name, args);
		}

		const status = result.metadata?.error ? "error" : "success";
		await sendToolResult(
			options.writer,
			toolCall.function.name,
			status,
			summarizeToolResult(result),
		);

		toolResults.push({
			toolCall,
			args,
			result,
		});
	}

	return toolResults;
}

async function runStreamingIteration(options: {
	provider: ProviderConfig;
	messages: ChatCompletionMessage[];
	registry: ToolRegistry;
	requestContext: RequestContext;
	writer: WritableStreamDefaultWriter<string>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	executedToolCalls: AgentLoopToolCall[];
	iterations: number;
	tools?: OpenAITool[];
}): Promise<StreamingIterationOutcome> {
	const reader = await callDeepSeekStream({
		provider: options.provider,
		messages: options.messages,
		registry: options.registry,
		tools: options.tools,
	});

	const streamResponse = await readDeepSeekStreamingResponse({
		reader,
		writer: options.writer,
	});

	const usage = {
		prompt_tokens:
			options.usage.prompt_tokens + (streamResponse.usage?.prompt_tokens ?? 0),
		completion_tokens:
			options.usage.completion_tokens +
			(streamResponse.usage?.completion_tokens ?? 0),
		total_tokens:
			options.usage.total_tokens + (streamResponse.usage?.total_tokens ?? 0),
	};

	const toolCalls = streamResponse.toolCalls;
	if (toolCalls.length === 0) {
		return {
			content: streamResponse.content,
			toolCalls: options.executedToolCalls,
			iterations: options.iterations,
			usage,
		};
	}

	const toolResults = await executeStreamingToolCalls({
		toolCalls,
		registry: options.registry,
		requestContext: options.requestContext,
		writer: options.writer,
	});

	const nextMessages = [
		...options.messages,
		{
			role: "assistant" as const,
			content: streamResponse.content,
			tool_calls: toolCalls,
		},
		...toolResults.map((toolResult) =>
			convertObservationToMessage(
				buildObservation({
					toolCallId: toolResult.toolCall.id,
					toolName: toolResult.toolCall.function.name,
					input: toolResult.args,
					result: toolResult.result,
					stepIndex: options.iterations,
				}),
			),
		),
	];

	const executedToolCalls = [
		...options.executedToolCalls,
		...toolResults.map(
			(toolResult): AgentLoopToolCall => ({
				name: toolResult.toolCall.function.name,
				args: toolResult.args,
				result: toolResult.result,
			}),
		),
	];

	return {
		content: streamResponse.content,
		toolCalls: executedToolCalls,
		iterations: options.iterations,
		usage,
		nextMessages,
		fallbackReason: getFallbackReason(toolResults),
	};
}

async function runDirectFallbackResponse(options: {
	provider: ProviderConfig;
	messages: ChatCompletionMessage[];
	registry: ToolRegistry;
	writer: WritableStreamDefaultWriter<string>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	executedToolCalls: AgentLoopToolCall[];
	iterations: number;
	reason: FallbackReason;
}): Promise<StreamingIterationOutcome> {
	const disclaimer =
		"I couldn't search our knowledge base. Here's what I know generally...";
	await sendContent(options.writer, `${disclaimer}\n\n`, {
		fallback: true,
		fallbackLevel: 2,
		reason: options.reason,
	});

	try {
		const reader = await callDeepSeekStream({
			provider: options.provider,
			messages: buildDirectFallbackMessages(options.messages),
			registry: options.registry,
			tools: [],
		});
		const streamResponse = await readDeepSeekStreamingResponse({
			reader,
			writer: options.writer,
		});
		return {
			content: `${disclaimer}\n\n${streamResponse.content}`,
			toolCalls: options.executedToolCalls,
			iterations: options.iterations,
			usage: {
				prompt_tokens:
					options.usage.prompt_tokens +
					(streamResponse.usage?.prompt_tokens ?? 0),
				completion_tokens:
					options.usage.completion_tokens +
					(streamResponse.usage?.completion_tokens ?? 0),
				total_tokens:
					options.usage.total_tokens +
					(streamResponse.usage?.total_tokens ?? 0),
			},
			metadata: {
				fallback: true,
				fallbackLevel: 2,
				reason: options.reason,
			},
		};
	} catch {
		const genericContent =
			"I couldn't search our knowledge base. Here's what I know generally... I may be missing specifics, but you can share more details and I'll do my best to help.";
		await sendContent(
			options.writer,
			"I may be missing specifics, but you can share more details and I'll do my best to help.",
		);
		return {
			content: genericContent,
			toolCalls: options.executedToolCalls,
			iterations: options.iterations,
			usage: options.usage,
			metadata: {
				fallback: true,
				fallbackLevel: 2,
				reason: options.reason,
			},
		};
	}
}

export async function runAgentLoop(
	options: AgentLoopOptions,
): Promise<AgentLoopResult> {
	const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
	const userMemory = await getUserMemoryBlock(options.userId, options.env);
	const provider = getProviderConfig({
		region: options.region,
		env: options.env,
	});
	const requestContext: RequestContext = {
		env: options.env,
		userId: options.userId,
		region: provider.region,
	};

	const messages = buildProviderMessages({
		systemPrompt: buildSystemPrompt({
			userMemory,
			lang: options.lang,
		}),
		history: options.history,
		message: options.message,
	});
	const tools = shouldEnableRetrievalTools(options.message) ? undefined : [];

	const executedToolCalls: AgentLoopToolCall[] = [];
	const usage = {
		prompt_tokens: 0,
		completion_tokens: 0,
	};
	let iterations = 0;
	let lastAssistantContent = "";

	for (let index = 0; index < maxIterations; index += 1) {
		iterations = index + 1;
		const data = await callDeepSeek({
			provider,
			messages,
			registry: options.registry,
			tools,
		});
		usage.prompt_tokens += data.usage?.prompt_tokens ?? 0;
		usage.completion_tokens += data.usage?.completion_tokens ?? 0;

		const responseMessage = data.choices?.[0]?.message;
		if (!responseMessage) {
			throw new Error(
				data.error?.message || "DeepSeek response missing message",
			);
		}

		const assistantContent = responseMessage.content ?? "";
		if (assistantContent) {
			lastAssistantContent = assistantContent;
		}

		const toolCalls = responseMessage.tool_calls ?? [];
		if (toolCalls.length === 0) {
			return {
				content: assistantContent || lastAssistantContent,
				toolCalls: executedToolCalls,
				iterations,
				usage,
			};
		}

		messages.push({
			role: "assistant",
			content: responseMessage.content,
			tool_calls: toolCalls,
		});

		const toolResults = await Promise.all(
			toolCalls.map(async (toolCall) => {
				let args: Record<string, unknown> = {};
				let result: ToolResult;

				try {
					args = parseToolArguments(toolCall);
					result = await options.registry.execute(
						toolCall.function.name,
						args,
						requestContext,
					);
				} catch (error) {
					result = createToolErrorResult({
						error: "invalid_arguments",
						tool: toolCall.function.name,
						message:
							error instanceof Error ? error.message : "Invalid tool arguments",
						raw_arguments: toolCall.function.arguments,
					});
				}

				return {
					toolCall,
					args,
					result,
				};
			}),
		);

		if (toolResults.length === 0) {
			break;
		}

		for (const toolResult of toolResults) {
			executedToolCalls.push({
				name: toolResult.toolCall.function.name,
				args: toolResult.args,
				result: toolResult.result,
			});

			messages.push(
				convertObservationToMessage(
					buildObservation({
						toolCallId: toolResult.toolCall.id,
						toolName: toolResult.toolCall.function.name,
						input: toolResult.args,
						result: toolResult.result,
						stepIndex: iterations,
					}),
				),
			);
		}
	}

	const disclaimer = buildIterationLimitMessage(options.lang);
	const content = lastAssistantContent
		? `${lastAssistantContent}\n\n${disclaimer}`
		: disclaimer;

	return {
		content,
		toolCalls: executedToolCalls,
		iterations,
		usage,
	};
}

export async function runStreamingAgentLoop(
	options: StreamingAgentLoopOptions,
): Promise<AgentLoopResult> {
	const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
	const userMemory = await getUserMemoryBlock(options.userId, options.env);
	const provider = getProviderConfig({
		region: options.region,
		env: options.env,
	});
	const requestContext: RequestContext = {
		env: options.env,
		userId: options.userId,
		region: provider.region,
	};

	let messages = buildProviderMessages({
		systemPrompt: buildSystemPrompt({
			userMemory,
			lang: options.lang,
		}),
		history: options.history,
		message: options.message,
	});
	const tools = shouldEnableRetrievalTools(options.message) ? undefined : [];

	const executedToolCalls: AgentLoopToolCall[] = [];
	const usage = {
		prompt_tokens: 0,
		completion_tokens: 0,
		total_tokens: 0,
	};
	let iterations = 0;
	let lastAssistantContent = "";
	let doneSent = false;

	try {
		for (let index = 0; index < maxIterations; index += 1) {
			iterations = index + 1;
			const iterationOutcome = await withFallback(
				() =>
					runStreamingIteration({
						provider,
						messages,
						registry: options.registry,
						requestContext,
						writer: options.writer,
						usage,
						executedToolCalls,
						iterations,
						tools,
					}),
				{
					query: options.message,
					evaluate: (result) => ({
						shouldFallback: Boolean(result.fallbackReason),
						reason: result.fallbackReason,
					}),
					retryOnce: (reason, previousResult) => {
						const simplifiedTools = (previousResult?.nextMessages ?? [])
							.slice()
							.reverse()
							.flatMap((message) => message.tool_calls ?? [])
							.slice(0, 1)
							.map((toolCall) => toolCall.function.name);
						const allowedTools = options.registry
							.toOpenAITools()
							.filter((tool) =>
								simplifiedTools.length === 0
									? false
									: simplifiedTools.includes(tool.function.name),
							);
						return runStreamingIteration({
							provider,
							messages: buildSimplifiedRetryMessages(messages, reason),
							registry: options.registry,
							requestContext,
							writer: options.writer,
							usage,
							executedToolCalls,
							iterations,
							tools: allowedTools,
						});
					},
					directResponse: (reason) =>
						runDirectFallbackResponse({
							provider,
							messages,
							registry: options.registry,
							writer: options.writer,
							usage,
							executedToolCalls,
							iterations,
							reason,
						}),
					onFallbackEvent: async (event: FallbackEvent) => {
						if (event.fallback_level === 3) {
							await sendFallback(options.writer, event.failure_reason);
						}
					},
					onError: () => "tool_failure",
				},
			);

			usage.prompt_tokens = iterationOutcome.usage.prompt_tokens;
			usage.completion_tokens = iterationOutcome.usage.completion_tokens;
			usage.total_tokens = iterationOutcome.usage.total_tokens;

			if (iterationOutcome.content) {
				lastAssistantContent = iterationOutcome.content;
			}

			if (!iterationOutcome.nextMessages) {
				await sendDone(options.writer, iterationOutcome.usage);
				doneSent = true;
				return {
					content: iterationOutcome.content || lastAssistantContent,
					toolCalls: iterationOutcome.toolCalls,
					iterations,
					usage: iterationOutcome.usage,
					metadata: iterationOutcome.metadata,
				};
			}

			messages = iterationOutcome.nextMessages;
			executedToolCalls.length = 0;
			executedToolCalls.push(...iterationOutcome.toolCalls);
		}

		logFallbackEvent({
			timestamp: new Date().toISOString(),
			query: options.message,
			failure_reason: "max_iterations_exceeded",
			fallback_level: 2,
		});

		const fallbackOutcome = await runDirectFallbackResponse({
			provider,
			messages,
			registry: options.registry,
			writer: options.writer,
			usage,
			executedToolCalls,
			iterations,
			reason: "max_iterations_exceeded",
		});
		usage.prompt_tokens = fallbackOutcome.usage.prompt_tokens;
		usage.completion_tokens = fallbackOutcome.usage.completion_tokens;
		usage.total_tokens = fallbackOutcome.usage.total_tokens;
		logFallbackEvent({
			timestamp: new Date().toISOString(),
			query: options.message,
			failure_reason: "max_iterations_exceeded",
			fallback_level: 3,
		});
		await sendFallback(options.writer, "max_iterations_exceeded");
		await sendDone(options.writer, fallbackOutcome.usage);
		doneSent = true;

		return {
			content: fallbackOutcome.content || lastAssistantContent,
			toolCalls: fallbackOutcome.toolCalls,
			iterations,
			usage: fallbackOutcome.usage,
			metadata: {
				fallback: true,
				fallbackLevel: 2,
				reason: "max_iterations_exceeded",
			},
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		await sendContent(options.writer, `\n(Error: ${message})`);
		if (!doneSent) {
			await sendDone(options.writer, {
				...usage,
				error: message,
			});
		}
		throw error;
	} finally {
		await options.writer.close();
	}
}
