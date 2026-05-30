import type { ToolRegistry } from "../tools/registry.ts"
import type { RequestContext, ToolResult } from "../tools/types.ts"
import type { ProviderToolCall } from "./messages.ts"
import { buildObservation } from "./observation.ts"
import type { Observation } from "./observation.ts"

export interface ExecuteToolActionOptions {
  toolCall: ProviderToolCall
  registry: ToolRegistry
  requestContext: RequestContext
  stepIndex: number
}

export async function executeToolAction(
  options: ExecuteToolActionOptions
): Promise<Observation> {
  const toolName = options.toolCall.function.name
  const parsedArgs = parseToolArguments(options.toolCall.function.arguments)

  if (!parsedArgs.ok) {
    return buildObservation({
      toolCallId: options.toolCall.id,
      toolName,
      input: {},
      result: createToolErrorResult({
        error: "invalid_arguments",
        tool: toolName,
        message: parsedArgs.message,
        raw_arguments: options.toolCall.function.arguments,
      }),
      stepIndex: options.stepIndex,
    })
  }

  if (!hasRegisteredTool(options.registry, toolName)) {
    return buildObservation({
      toolCallId: options.toolCall.id,
      toolName,
      input: parsedArgs.args,
      result: createToolErrorResult({
        error: "tool_not_found",
        tool: toolName,
      }),
      stepIndex: options.stepIndex,
    })
  }

  const result = await options.registry.execute(
    toolName,
    parsedArgs.args,
    options.requestContext
  )

  return buildObservation({
    toolCallId: options.toolCall.id,
    toolName,
    input: parsedArgs.args,
    result,
    stepIndex: options.stepIndex,
  })
}

function hasRegisteredTool(registry: ToolRegistry, toolName: string): boolean {
  return registry.getTools().some((tool) => tool.name === toolName)
}

type ParsedToolArguments =
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; message: string }

function parseToolArguments(rawArguments: string): ParsedToolArguments {
  try {
    const parsed = JSON.parse(rawArguments || "{}") as unknown
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {
        ok: false,
        message: "Tool arguments must be a JSON object",
      }
    }

    return { ok: true, args: parsed as Record<string, unknown> }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Invalid tool arguments",
    }
  }
}

function createToolErrorResult(payload: Record<string, unknown>): ToolResult {
  return {
    content: JSON.stringify(payload),
    metadata: {
      error: true,
    },
  }
}
