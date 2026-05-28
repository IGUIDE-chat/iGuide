import  { type Observation } from './observation.ts'
import  { type ToolResult } from '../tools/types.ts'

export interface ProviderToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: ProviderToolCall[]
}

export type RuntimeMessage = {
  role: string
  content: string | null
  tool_call_id?: string
  tool_calls?: ProviderToolCall[]
}

export function normalizeHistoryRole(role: string): ProviderMessage['role'] {
  if (role === 'assistant' || role === 'system' || role === 'tool') {
    return role
  }

  if (role === 'model') {
    return 'assistant'
  }

  return 'user'
}

export function normalizeMessages(options: {
  history: RuntimeMessage[]
  message: string
}): ProviderMessage[] {
  return [
    ...options.history.map((entry) => ({
      role: normalizeHistoryRole(entry.role),
      content: entry.content,
      ...(entry.tool_call_id ? { tool_call_id: entry.tool_call_id } : {}),
      ...(entry.tool_calls ? { tool_calls: entry.tool_calls } : {}),
    })),
    {
      role: 'user' as const,
      content: options.message,
    },
  ]
}

export function buildProviderMessages(options: {
  systemPrompt: string
  history: RuntimeMessage[]
  message: string
}): ProviderMessage[] {
  return [
    {
      role: 'system',
      content: options.systemPrompt,
    },
    ...normalizeMessages({
      history: options.history,
      message: options.message,
    }),
  ]
}

export function buildToolResultContent(result: ToolResult): string {
  if (!result.metadata && !result.truncated) {
    return result.content
  }

  return JSON.stringify({
    content: result.content,
    metadata: result.metadata,
    truncated: result.truncated,
  })
}

export function convertObservationToMessage(
  observation: Observation
): ProviderMessage {
  if (observation.providerMessage) {
    return observation.providerMessage
  }

  return {
    role: 'tool',
    tool_call_id: observation.toolCallId,
    content: observation.raw,
  }
}

export function convertToolResultToMessage(options: {
  toolCall: ProviderToolCall
  result: ToolResult
}): ProviderMessage {
  return {
    role: 'tool',
    tool_call_id: options.toolCall.id,
    content: buildToolResultContent(options.result),
  }
}
