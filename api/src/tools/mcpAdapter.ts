import { tool } from 'ai'
import { z } from 'zod'
import type { ToolDefinition, RequestContext } from './types.ts'

/**
 * Convert a ToolDefinition (JSON Schema-based) into an AI SDK tool() object.
 * Parameters use passthrough() since ToolDefinition.parameters is JSON Schema
 * format — the MCP tool itself validates its own input at runtime.
 * The execute result extracts content from ToolResult to match AI SDK's
 * expected return type (string).
 */
export function toolDefToAISDK(td: ToolDefinition, ctx: RequestContext) {
  return tool({
    description: td.description,
    inputSchema: z.object({}).passthrough(),
    execute: async (args: any, _options: any) => {
      const result = await td.execute(args, ctx)
      return result.content
    },
  })
}

/**
 * Convert an array of ToolDefinitions into a record keyed by tool name,
 * each wrapped as an AI SDK tool() object. Useful for bulk-registering
 * MCP tools from an MCP service.
 */
export function mcpToolsToAISDK(
  tools: ToolDefinition[],
  ctx: RequestContext
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const td of tools) {
    result[td.name] = toolDefToAISDK(td, ctx)
  }
  return result
}
