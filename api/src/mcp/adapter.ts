import type { ToolDefinition, ToolResult } from '../tools/types'

/**
 * Thin adapter boundary for exposing remote MCP tools through the existing
 * internal ToolDefinition runtime. Phase 1 supports Streamable HTTP MCP only;
 * it does not change internal tools, ToolRegistry execution, or agent loop
 * semantics.
 */
export type MCPFailureReason =
  | 'unreachable'
  | 'invalid_mcp_response'
  | 'unsupported_transport'
  | 'auth_required'
  | 'no_tools_discovered'
  | 'timeout'
  | 'unknown'

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

export function createMCPToolWrapper(
  tool: MCPDiscoveredTool,
  client: MCPAdapterClient
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
          error: 'mcp_call_failed',
          tool: tool.name,
          url: tool.url,
          failure_reason: callResult.failure_reason,
          message: callResult.error_message,
        }),
        metadata: {
          error: true,
          adapter: 'mcp',
          transport: 'streamable_http',
        },
      }
    },
  }
}
