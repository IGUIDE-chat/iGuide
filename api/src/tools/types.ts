export interface RequestContext {
	env: Record<string, string>;
	userId?: string;
	region?: string;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
	execute: (
		args: Record<string, unknown>,
		ctx: RequestContext,
	) => Promise<ToolResult>;
}

export interface ToolResult {
	content: string;
	metadata?: Record<string, unknown>;
	truncated?: boolean;
}

export interface OpenAITool {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
}
