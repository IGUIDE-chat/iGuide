import type { ToolDefinition, ToolResult } from "../tools/types"

export type MCPFailureReason =
  | "unreachable"
  | "invalid_mcp_response"
  | "unsupported_transport"
  | "auth_required"
  | "no_tools_discovered"
  | "timeout"
  | "unknown"

export interface MCPTestResult {
  success: boolean
  failure_reason: MCPFailureReason | null
  error_message: string | null
  latency_ms: number | null
}

export interface MCPDiscoveredTool {
  url: string
  name: string
  description: string
  parameters: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface MCPDiscoveryResult {
  success: boolean
  failure_reason: MCPFailureReason | null
  tools: MCPDiscoveredTool[]
  error_message: string | null
}

export interface MCPCallResult {
  success: boolean
  failure_reason: MCPFailureReason | null
  error_message: string | null
  latency_ms: number | null
  tool_result: ToolResult | null
  raw_response?: unknown
}

export interface MCPAdapterClient {
  test(url: string): Promise<MCPTestResult>
  discover(url: string): Promise<MCPDiscoveryResult>
  call(url: string, toolName: string, args: unknown): Promise<MCPCallResult>
}

/**
 * Remote calls fail without throwing: the failure is returned as a tool result
 * tagged `metadata.error` so the agent loop reports it through its normal
 * observation channel instead of unwinding the whole turn.
 */
export function createMCPToolWrapper(
  tool: MCPDiscoveredTool,
  client: MCPAdapterClient,
): ToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    execute: async (args): Promise<ToolResult> => {
      const callResult = await client.call(tool.url, tool.name, args)

      if (callResult.success && callResult.tool_result) {
        return callResult.tool_result
      }

      return {
        content: JSON.stringify({
          error: "mcp_call_failed",
          tool: tool.name,
          url: tool.url,
          failure_reason: callResult.failure_reason,
          message: callResult.error_message,
        }),
        metadata: {
          error: true,
          adapter: "mcp",
          transport: "streamable_http",
        },
      }
    },
  }
}
