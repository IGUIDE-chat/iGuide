import type { ToolSource } from "../tools/types.ts"

const textEncoder = new TextEncoder()

type SSEWriter = WritableStreamDefaultWriter<string>

function encodeSSEEvent(type: string, payload: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`
}

async function writeEvent(writer: SSEWriter, type: string, payload: unknown): Promise<void> {
  await writer.write(encodeSSEEvent(type, payload))
}

export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>
  writer: SSEWriter
} {
  const transform = new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(textEncoder.encode(chunk))
    },
  })

  return {
    stream: transform.readable,
    writer: transform.writable.getWriter(),
  }
}

export async function sendToolStart(
  writer: SSEWriter,
  toolName: string,
  args: Record<string, unknown>,
): Promise<void> {
  await writeEvent(writer, "tool_start", {
    name: toolName,
    args,
  })
}

export async function sendToolResult(
  writer: SSEWriter,
  toolName: string,
  status: "success" | "error",
  summary: string,
): Promise<void> {
  await writeEvent(writer, "tool_result", {
    name: toolName,
    status,
    summary,
  })
}

/**
 * One `source-url` event per page the model read, shaped like the AI SDK
 * `source-url` stream part and written as a single chunk so they stay in
 * order. The URL doubles as `sourceId` so repeated hits on a page collapse
 * client-side.
 */
export async function sendSourceUrls(
  writer: SSEWriter,
  sources: readonly ToolSource[],
): Promise<void> {
  if (sources.length === 0) return

  await writer.write(
    sources
      .map((source) =>
        encodeSSEEvent("source-url", {
          sourceId: source.url,
          url: source.url,
          title: source.title,
          ...(source.snippet ? { snippet: source.snippet } : {}),
        }),
      )
      .join(""),
  )
}

export async function sendContent(
  writer: SSEWriter,
  delta: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await writeEvent(writer, "content", {
    choices: [
      {
        delta: {
          content: delta,
          ...(metadata ? { metadata } : {}),
        },
        index: 0,
      },
    ],
  })
}

export async function sendFallback(writer: SSEWriter, reason: string): Promise<void> {
  await writeEvent(writer, "fallback", {
    type: "fallback",
    reason,
  })
}

export async function sendDone(writer: SSEWriter, usage: Record<string, unknown>): Promise<void> {
  await writeEvent(writer, "done", {
    usage,
  })
}

export async function emitAgentStep(
  writer: SSEWriter,
  stepIndex: number,
  iterationCount: number,
): Promise<void> {
  await writeEvent(writer, "agent_step", {
    step: stepIndex,
    iterations: iterationCount,
  })
}

export async function emitToolDecision(
  writer: SSEWriter,
  toolName: string,
  reason: string,
): Promise<void> {
  await writeEvent(writer, "tool_decision", {
    name: toolName,
    reason,
  })
}

export async function emitObservation(
  writer: SSEWriter,
  toolName: string,
  status: "success" | "error",
  summary: string,
): Promise<void> {
  await writeEvent(writer, "observation", {
    name: toolName,
    status,
    summary,
  })
}

export async function emitToolBlocked(
  writer: SSEWriter,
  toolName: string,
  reason: string,
): Promise<void> {
  await writeEvent(writer, "tool_blocked", {
    name: toolName,
    reason,
  })
}

export async function emitFinalizing(writer: SSEWriter, stopReason: string): Promise<void> {
  await writeEvent(writer, "finalizing", {
    reason: stopReason,
  })
}
