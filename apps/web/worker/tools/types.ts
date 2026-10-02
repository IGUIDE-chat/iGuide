export interface RequestContext {
  env: Record<string, string>
  userId?: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, ctx: RequestContext) => Promise<ToolResult>
}

export interface ToolResult {
  content: string
  metadata?: Record<string, unknown>
  truncated?: boolean
}

/**
 * A page a retrieval tool handed to the model, returned as `metadata.sources`.
 * The agent loop streams the ones the model actually saw to the browser as
 * `source-url` events; they are never sent back to the model.
 */
export interface ToolSource {
  url: string
  title: string
  /** Short plain-text excerpt for the citation preview. */
  snippet?: string
}

export interface OpenAITool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}
