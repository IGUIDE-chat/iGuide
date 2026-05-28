import {
  type MCPAdapterClient,
  type MCPCallResult,
  type MCPDiscoveredTool,
  type MCPDiscoveryResult,
  type MCPFailureReason,
  type MCPTestResult,
} from "./adapter"
import { type ToolResult } from "../tools/types"

const JSON_RPC_VERSION = "2.0"
const PROTOCOL_VERSION = "2024-11-05"
const DEFAULT_TIMEOUT_MS = 10_000

type JsonRpcId = 1 | 2 | 3

interface JsonRpcRequest {
  jsonrpc: typeof JSON_RPC_VERSION
  id: JsonRpcId
  method: "initialize" | "tools/list" | "tools/call"
  params: Record<string, unknown>
}

interface JsonRpcError {
  code?: number
  message?: string
  data?: unknown
}

type RequestResult =
  | {
      success: true
      latency_ms: number
      result: Record<string, unknown>
      raw_response: unknown
    }
  | {
      success: false
      failure_reason: MCPFailureReason
      error_message: string
      latency_ms: number | null
      raw_response?: unknown
    }

export interface StreamableHttpMCPClientOptions {
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class StreamableHttpMCPClient implements MCPAdapterClient {
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(options: StreamableHttpMCPClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async test(url: string): Promise<MCPTestResult> {
    const request = this.buildRequest(1, "initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "iguide",
        version: "1.0",
      },
    })

    const response = await this.send(url, request, "invalid_mcp_response")
    if (!response.success) {
      return {
        success: false,
        failure_reason: response.failure_reason,
        error_message: response.error_message,
        latency_ms: response.latency_ms,
      }
    }

    return {
      success: true,
      failure_reason: null,
      error_message: null,
      latency_ms: response.latency_ms,
    }
  }

  async discover(url: string): Promise<MCPDiscoveryResult> {
    const request = this.buildRequest(2, "tools/list", {})
    const response = await this.send(url, request, "invalid_mcp_response")

    if (!response.success) {
      return {
        success: false,
        failure_reason: response.failure_reason,
        tools: [],
        error_message: response.error_message,
      }
    }

    const tools = this.parseDiscoveredTools(url, response.result)
    if (!tools.success) {
      return tools.result
    }

    return {
      success: true,
      failure_reason: null,
      tools: tools.result,
      error_message: null,
    }
  }

  async call(
    url: string,
    toolName: string,
    args: unknown
  ): Promise<MCPCallResult> {
    const request = this.buildRequest(3, "tools/call", {
      name: toolName,
      arguments: isRecord(args) ? args : {},
    })

    const response = await this.send(url, request, "unknown")
    if (!response.success) {
      return {
        success: false,
        failure_reason: response.failure_reason,
        error_message: response.error_message,
        latency_ms: response.latency_ms,
        tool_result: null,
        raw_response: response.raw_response,
      }
    }

    const toolResult = this.mapToolResult(url, toolName, response.result)
    if (!toolResult.success) {
      return {
        success: false,
        failure_reason: toolResult.failure_reason,
        error_message: toolResult.error_message,
        latency_ms: response.latency_ms,
        tool_result: null,
        raw_response: response.raw_response,
      }
    }

    return {
      success: true,
      failure_reason: null,
      error_message: null,
      latency_ms: response.latency_ms,
      tool_result: toolResult.tool_result,
      raw_response: response.raw_response,
    }
  }

  private buildRequest(
    id: JsonRpcId,
    method: JsonRpcRequest["method"],
    params: Record<string, unknown>
  ): JsonRpcRequest {
    return {
      jsonrpc: JSON_RPC_VERSION,
      id,
      method,
      params,
    }
  }

  private async send(
    url: string,
    payload: JsonRpcRequest,
    rpcErrorReason: MCPFailureReason
  ): Promise<RequestResult> {
    const controller = new AbortController()
    const startedAt = performance.now()
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const latency_ms = Math.max(Math.round(performance.now() - startedAt), 0)

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          failure_reason: "auth_required",
          error_message: `MCP endpoint requires authentication (${response.status})`,
          latency_ms,
        }
      }

      const responseText = await response.text()

      if (!response.ok) {
        return {
          success: false,
          failure_reason: "invalid_mcp_response",
          error_message: `MCP endpoint returned HTTP ${response.status}${responseText ? `: ${responseText}` : ""}`,
          latency_ms,
        }
      }

      const parsedResponse = parseJson(responseText)
      if (!parsedResponse.success) {
        return {
          success: false,
          failure_reason: "invalid_mcp_response",
          error_message: parsedResponse.error_message,
          latency_ms,
        }
      }

      if (!isRecord(parsedResponse.value)) {
        return {
          success: false,
          failure_reason: "invalid_mcp_response",
          error_message: "MCP response must be a JSON object",
          latency_ms,
          raw_response: parsedResponse.value,
        }
      }

      if (
        parsedResponse.value.jsonrpc !== JSON_RPC_VERSION ||
        parsedResponse.value.id !== payload.id
      ) {
        return {
          success: false,
          failure_reason: "invalid_mcp_response",
          error_message:
            "MCP response did not match the expected JSON-RPC envelope",
          latency_ms,
          raw_response: parsedResponse.value,
        }
      }

      if ("error" in parsedResponse.value) {
        const error = parsedResponse.value.error
        return {
          success: false,
          failure_reason: rpcErrorReason,
          error_message: formatRpcError(error),
          latency_ms,
          raw_response: parsedResponse.value,
        }
      }

      if (!isRecord(parsedResponse.value.result)) {
        return {
          success: false,
          failure_reason: "invalid_mcp_response",
          error_message: "MCP response result was missing or invalid",
          latency_ms,
          raw_response: parsedResponse.value,
        }
      }

      return {
        success: true,
        latency_ms,
        result: parsedResponse.value.result,
        raw_response: parsedResponse.value,
      }
    } catch (error) {
      if (isAbortError(error)) {
        return {
          success: false,
          failure_reason: "timeout",
          error_message: `MCP request timed out after ${this.timeoutMs}ms`,
          latency_ms: null,
        }
      }

      return {
        success: false,
        failure_reason: "unreachable",
        error_message:
          error instanceof Error
            ? error.message
            : "MCP endpoint was unreachable",
        latency_ms: null,
      }
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  private parseDiscoveredTools(
    url: string,
    result: Record<string, unknown>
  ):
    | { success: true; result: MCPDiscoveredTool[] }
    | { success: false; result: MCPDiscoveryResult } {
    if (!Array.isArray(result.tools)) {
      return {
        success: false,
        result: {
          success: false,
          failure_reason: "invalid_mcp_response",
          tools: [],
          error_message:
            "MCP tools/list response did not contain a tools array",
        },
      }
    }

    if (result.tools.length === 0) {
      return {
        success: false,
        result: {
          success: false,
          failure_reason: "no_tools_discovered",
          tools: [],
          error_message: "MCP endpoint returned no tools",
        },
      }
    }

    const tools: MCPDiscoveredTool[] = []

    for (const entry of result.tools) {
      if (!isRecord(entry) || typeof entry.name !== "string") {
        return {
          success: false,
          result: {
            success: false,
            failure_reason: "invalid_mcp_response",
            tools: [],
            error_message: "MCP tools/list returned a malformed tool entry",
          },
        }
      }

      if (!isRecord(entry.inputSchema)) {
        return {
          success: false,
          result: {
            success: false,
            failure_reason: "invalid_mcp_response",
            tools: [],
            error_message: `MCP tool ${entry.name} is missing a valid inputSchema`,
          },
        }
      }

      tools.push({
        url,
        name: entry.name,
        description:
          typeof entry.description === "string" ? entry.description : "",
        parameters: entry.inputSchema,
      })
    }

    return { success: true, result: tools }
  }

  private mapToolResult(
    url: string,
    toolName: string,
    result: Record<string, unknown>
  ):
    | { success: true; tool_result: ToolResult }
    | {
        success: false
        failure_reason: MCPFailureReason
        error_message: string
      } {
    const content = formatToolContent(result.content, result)

    return {
      success: true,
      tool_result: {
        content,
        metadata: {
          adapter: "mcp",
          transport: "streamable_http",
          url,
          tool: toolName,
        },
      },
    }
  }
}

function parseJson(
  value: string
):
  | { success: true; value: unknown }
  | { success: false; error_message: string } {
  if (!value) {
    return {
      success: false,
      error_message: "MCP response body was empty",
    }
  }

  try {
    return {
      success: true,
      value: JSON.parse(value),
    }
  } catch (error) {
    return {
      success: false,
      error_message:
        error instanceof Error
          ? `MCP response was not valid JSON: ${error.message}`
          : "MCP response was not valid JSON",
    }
  }
}

function formatRpcError(error: unknown): string {
  if (!isRecord(error)) {
    return "MCP endpoint returned a JSON-RPC error"
  }

  const rpcError = error as JsonRpcError
  const codePart =
    typeof rpcError.code === "number" ? ` (${rpcError.code})` : ""
  const messagePart =
    typeof rpcError.message === "string"
      ? rpcError.message
      : "MCP endpoint returned a JSON-RPC error"

  return `${messagePart}${codePart}`
}

function formatToolContent(
  content: unknown,
  fallback: Record<string, unknown>
): string {
  if (!Array.isArray(content)) {
    return JSON.stringify(content ?? fallback)
  }

  if (content.length === 0) {
    return JSON.stringify([])
  }

  return content
    .map((item) => {
      if (
        isRecord(item) &&
        item.type === "text" &&
        typeof item.text === "string"
      ) {
        return item.text
      }

      return JSON.stringify(item)
    })
    .join("\n")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}
