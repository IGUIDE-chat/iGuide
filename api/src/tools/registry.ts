import type {
  OpenAITool,
  RequestContext,
  ToolDefinition,
  ToolResult,
} from './types'

interface ToolRegistryOptions {
  maxCalls?: number
  timeoutMs?: number
  maxResultBytes?: number
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()
  private callCount = 0
  private readonly maxCalls: number
  private readonly timeoutMs: number
  private readonly maxResultBytes: number
  private readonly textEncoder = new TextEncoder()
  private readonly textDecoder = new TextDecoder()

  constructor(options?: ToolRegistryOptions) {
    this.maxCalls = options?.maxCalls ?? 5
    this.timeoutMs = options?.timeoutMs ?? 10000
    this.maxResultBytes = options?.maxResultBytes ?? 4096
  }

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`)
    }

    this.tools.set(tool.name, tool)
  }

  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  toOpenAITools(): OpenAITool[] {
    return this.getTools().map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))
  }

  async execute(
    name: string,
    args: Record<string, unknown>,
    ctx: RequestContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return this.createErrorResult({
        error: 'tool_not_found',
        tool: name,
      })
    }

    if (this.callCount >= this.maxCalls) {
      return this.createErrorResult({
        error: 'budget_exceeded',
        max_calls: this.maxCalls,
      })
    }

    this.callCount += 1

    try {
      const result = await this.executeWithTimeout(
        name,
        tool.execute(args, ctx)
      )

      return this.truncateResultIfNeeded(result)
    } catch (error) {
      if (error instanceof ToolExecutionTimeoutError) {
        return this.createErrorResult({
          error: 'timeout',
          tool: name,
          timeout_ms: this.timeoutMs,
        })
      }

      return this.createErrorResult({
        error: 'execution_failed',
        tool: name,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  resetCallCount(): void {
    this.callCount = 0
  }

  getCallCount(): number {
    return this.callCount
  }

  private async executeWithTimeout(
    toolName: string,
    execution: Promise<ToolResult>
  ): Promise<ToolResult> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    try {
      return await Promise.race([
        execution,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new ToolExecutionTimeoutError(toolName, this.timeoutMs))
          }, this.timeoutMs)
        }),
      ])
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  private truncateResultIfNeeded(result: ToolResult): ToolResult {
    const contentBytes = this.textEncoder.encode(result.content)
    if (contentBytes.length <= this.maxResultBytes) {
      return result
    }

    const suffix = '\n...[truncated]'
    const suffixBytes = this.textEncoder.encode(suffix)
    const contentLimit = Math.max(this.maxResultBytes - suffixBytes.length, 0)
    const truncatedBytes = contentBytes.slice(0, contentLimit)
    const truncatedContent =
      contentLimit > 0
        ? `${this.textDecoder.decode(truncatedBytes)}${suffix}`
        : this.textDecoder.decode(contentBytes.slice(0, this.maxResultBytes))

    return {
      ...result,
      content: truncatedContent,
      metadata: {
        ...result.metadata,
        original_bytes: contentBytes.length,
        truncated_bytes: this.textEncoder.encode(truncatedContent).length,
      },
      truncated: true,
    }
  }

  private createErrorResult(payload: Record<string, unknown>): ToolResult {
    return {
      content: JSON.stringify(payload),
      metadata: {
        error: true,
      },
    }
  }
}

class ToolExecutionTimeoutError extends Error {
  readonly toolName: string
  readonly timeoutMs: number

  constructor(toolName: string, timeoutMs: number) {
    super(`Tool timed out: ${toolName}`)
    this.name = 'ToolExecutionTimeoutError'
    this.toolName = toolName
    this.timeoutMs = timeoutMs
  }
}
