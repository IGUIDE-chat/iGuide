import { type StreamChunk } from "./ai/types"

type StreamLanguage = "en" | "zh"

interface WorkerToolStartPayload {
  name?: string
  tool?: string
  args?: unknown
}

interface WorkerToolResultPayload {
  name?: string
  tool?: string
  status?: string
  summary?: string
}

interface WorkerContentPayload {
  delta?: string
  content?: string
}

export interface SSEParserState {
  currentEvent: string
  reasoningBuffer: string
  isInReasoning: boolean
}

export function createSSEParserState(): SSEParserState {
  return {
    currentEvent: "",
    reasoningBuffer: "",
    isInReasoning: false,
  }
}

function getReasoningLabel(lang: StreamLanguage): string {
  return lang === "zh" ? "正在思考..." : "Thinking..."
}

function stringifyDetail(value: unknown): string | undefined {
  if (value == null) {
    return undefined
  }
  if (typeof value === "string") {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}

function getWorkerToolName(
  payload: WorkerToolStartPayload | WorkerToolResultPayload
) {
  return payload.name ?? payload.tool ?? "unknown"
}

function parseLegacyDelta(
  payload: unknown,
  state: SSEParserState,
  lang: StreamLanguage
): StreamChunk[] {
  const delta = (
    payload as { choices?: Array<{ delta?: Record<string, unknown> }> }
  ).choices?.[0]?.delta

  if (!delta) {
    return []
  }

  if (typeof delta.reasoning_content === "string" && delta.reasoning_content) {
    if (!state.isInReasoning) {
      state.isInReasoning = true
      state.reasoningBuffer = ""
    }

    state.reasoningBuffer += delta.reasoning_content

    return [
      {
        text: "",
        thinkingStep: {
          type: "reasoning",
          label: getReasoningLabel(lang),
          detail: state.reasoningBuffer,
        },
      },
    ]
  }

  if (typeof delta.content === "string" && delta.content) {
    state.isInReasoning = false
    state.reasoningBuffer = ""

    return [{ text: delta.content }]
  }

  return []
}

function parseWorkerEvent(
  eventName: string,
  payload: unknown,
  lang: StreamLanguage
): StreamChunk[] {
  if (eventName === "tool_start") {
    const data = payload as WorkerToolStartPayload
    const toolName = getWorkerToolName(data)
    return [
      {
        text: "",
        thinkingStep: {
          type: "tool_call",
          label:
            lang === "zh"
              ? `调用工具: ${toolName}`
              : `Calling tool: ${toolName}`,
          detail: stringifyDetail(data.args),
        },
      },
    ]
  }

  if (eventName === "tool_result") {
    const data = payload as WorkerToolResultPayload
    const toolName = getWorkerToolName(data)
    const detail = [data.status, data.summary].filter(Boolean).join(" — ")

    return [
      {
        text: "",
        thinkingStep: {
          type: "processing",
          label:
            lang === "zh"
              ? `工具完成: ${toolName}`
              : `Tool finished: ${toolName}`,
          detail: detail || undefined,
        },
      },
    ]
  }

  if (eventName === "content") {
    const data = payload as WorkerContentPayload
    const text = data.delta ?? data.content ?? ""
    return text ? [{ text }] : []
  }

  return []
}

export function parseDeepSeekSSELine(
  line: string,
  state: SSEParserState,
  lang: StreamLanguage
): StreamChunk[] {
  const trimmed = line.trim()

  if (!trimmed || trimmed === "data: [DONE]") {
    return []
  }

  if (trimmed.startsWith("event:")) {
    state.currentEvent = trimmed.slice(6).trim()
    return []
  }

  if (!trimmed.startsWith("data:")) {
    return []
  }

  const jsonStr = trimmed.slice(5).trim()
  if (!jsonStr || jsonStr === "[DONE]" || jsonStr === '"[DONE]"') {
    return []
  }

  try {
    const payload = JSON.parse(jsonStr)

    if (state.currentEvent) {
      const workerChunks = parseWorkerEvent(state.currentEvent, payload, lang)
      if (workerChunks.length > 0 || state.currentEvent === "done") {
        return workerChunks
      }
    }

    return parseLegacyDelta(payload, state, lang)
  } catch {
    return []
  }
}

export async function* parseDeepSeekSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  lang: StreamLanguage
): AsyncGenerator<StreamChunk> {
  const decoder = new TextDecoder("utf-8")
  const state = createSSEParserState()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      if (buffer.trim()) {
        for (const chunk of parseDeepSeekSSELine(buffer, state, lang)) {
          yield chunk
        }
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      for (const chunk of parseDeepSeekSSELine(line, state, lang)) {
        yield chunk
      }
    }
  }
}
