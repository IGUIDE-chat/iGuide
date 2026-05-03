import type {
	RequestContext,
	ToolDefinition,
	ToolResult,
} from "../../tools/types.ts";

export interface StubToolOptions {
	name?: string;
	description?: string;
	content?: string | ((args: Record<string, unknown>, ctx: RequestContext) => string);
	metadata?: Record<string, unknown>;
	throws?: string;
}

export function createStubTool(options: StubToolOptions = {}): ToolDefinition {
	return {
		name: options.name ?? "stub_tool",
		description: options.description ?? "Deterministic test stub tool",
		parameters: {
			type: "object",
			additionalProperties: true,
		},
		async execute(args, ctx): Promise<ToolResult> {
			if (options.throws) {
				throw new Error(options.throws);
			}

			const content =
				typeof options.content === "function"
					? options.content(args, ctx)
					: (options.content ?? JSON.stringify(args));

			return {
				content,
				metadata: {
					stub: true,
					tool: options.name ?? "stub_tool",
					...options.metadata,
				},
			};
		},
	};
}

export function createEchoTool(name = "stub_echo"): ToolDefinition {
	return createStubTool({
		name,
		description: "Echoes test arguments as JSON",
		content: (args) => JSON.stringify(args),
	});
}

export function createFailingTool(name = "stub_fail"): ToolDefinition {
	return createStubTool({
		name,
		description: "Throws a deterministic test error",
		throws: "stub tool failure",
	});
}
