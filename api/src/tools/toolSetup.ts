import { tool } from "ai"
import { type z } from "zod"

export interface ToolBudget {
  maxSteps?: number
  maxToolCalls?: number
}

export interface ToolContext {
  kv?: KVNamespace
  env: Record<string, any>
}

export interface CustomTool {
  description: string
  parameters: z.ZodTypeAny
  execute: (args: any, context: ToolContext) => Promise<any>
}

/**
 * Wrap a map of CustomTool definitions into AI SDK `tool()` calls.
 * Each tool's execute receives a ToolContext with env bindings and KV.
 */
export function wrapTools(
  tools: Record<string, CustomTool>,
  context: ToolContext,
  budget?: ToolBudget
): Record<string, ReturnType<typeof tool>> {
  const result: Record<string, any> = {}

  for (const [name, customTool] of Object.entries(tools)) {
    result[name] = tool({
      description: customTool.description,
      inputSchema: customTool.parameters,
      execute: async (args: any, options: any) => {
        return customTool.execute(args, context)
      },
    })
  }

  return result
}
