import { tool } from "ai"
import type { z } from "zod"

export interface ToolBudget {
  maxSteps?: number
  maxToolCalls?: number
}

export interface ToolContext {
  kv?: KVNamespace
  env: Record<string, string | undefined>
}

export interface CustomTool {
  description: string
  parameters: z.ZodTypeAny
  // eslint-disable-next-line typescript/no-explicit-any -- AI SDK tool execute requires flexible types
  execute: (args: any, context: ToolContext) => Promise<unknown>
}

/**
 * Wrap a map of CustomTool definitions into AI SDK `tool()` calls.
 * Each tool's execute receives a ToolContext with env bindings and KV.
 */
export function wrapTools(
  tools: Record<string, CustomTool>,
  context: ToolContext,
  _budget?: ToolBudget
  // eslint-disable-next-line typescript/no-explicit-any -- AI SDK ToolSet requires Record<string, any>
): Record<string, any> {
  // eslint-disable-next-line typescript/no-explicit-any -- AI SDK ToolSet requires Record<string, any>
  const result: Record<string, any> = {}

  for (const [name, customTool] of Object.entries(tools)) {
    result[name] = tool({
      description: customTool.description,
      inputSchema: customTool.parameters,
      execute: async (args) => customTool.execute(args, context),
    })
  }

  return result
}
