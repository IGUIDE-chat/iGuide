import { expect, test } from "vite-plus/test"

import {
  createSSEStream,
  emitAgentStep,
  emitFinalizing,
  emitObservation,
  emitToolDecision,
  sendContent,
  sendDone,
  sendFallback,
  sendToolResult,
  sendToolStart,
} from "./stream.ts"

interface ParsedSSEEvent {
  event: string
  data: unknown
}

async function collectSSEEvents(
  stream: ReadableStream<Uint8Array>
): Promise<ParsedSSEEvent[]> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const events: ParsedSSEEvent[] = []
  let currentEvent = ""

  while (true) {
    // eslint-disable-next-line no-await-in-loop -- streaming read requires sequential consumption
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }

      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim()
      } else if (trimmed.startsWith("data:")) {
        const jsonStr = trimmed.slice(5).trim()
        try {
          const data = JSON.parse(jsonStr)
          events.push({ event: currentEvent, data })
          currentEvent = ""
        } catch {
          /* JSON parse failure during SSE parsing */
        }
      }
    }
  }

  return events
}

function createTestWriterPair(): {
  writer: WritableStreamDefaultWriter<string>
  events: Promise<ParsedSSEEvent[]>
} {
  const { stream, writer } = createSSEStream()
  const events = collectSSEEvents(stream)
  return { writer, events }
}

test("tool_start payload uses 'name' field (not 'tool')", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolStart(writer, "search_knowledge_base", { query: "housing" })
  await writer.close()

  const parsed = await events
  expect(parsed.length).toBe(1)
  expect(parsed[0].event).toBe("tool_start")

  const payload = parsed[0].data as Record<string, unknown>
  expect(payload.name).toBe("search_knowledge_base")
  expect(!("tool" in payload)).toBeTruthy()
  expect(payload.args).toEqual({ query: "housing" })
})

test("tool_result payload uses 'name' field (not 'tool')", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolResult(writer, "search_knowledge_base", "success", "2 results")
  await writer.close()

  const parsed = await events
  expect(parsed.length).toBe(1)
  expect(parsed[0].event).toBe("tool_result")

  const payload = parsed[0].data as Record<string, unknown>
  expect(payload.name).toBe("search_knowledge_base")
  expect(!("tool" in payload)).toBeTruthy()
  expect(payload.status).toBe("success")
  expect(payload.summary).toBe("2 results")
})

test("content payload uses choices[].delta.content structure", async () => {
  const { writer, events } = createTestWriterPair()

  await sendContent(writer, "Housing options are available.")
  await writer.close()

  const parsed = await events
  expect(parsed.length).toBe(1)
  expect(parsed[0].event).toBe("content")

  const payload = parsed[0].data as {
    choices: Array<{ delta: { content: string } }>
  }
  expect(Array.isArray(payload.choices)).toBeTruthy()
  expect(payload.choices.length).toBe(1)
  expect(payload.choices[0].delta.content).toBe(
    "Housing options are available."
  )
  // @ts-expect-error -- index field present at runtime
  expect(payload.choices[0].index).toBe(0)
})

test("fallback payload includes type and reason", async () => {
  const { writer, events } = createTestWriterPair()

  await sendFallback(writer, "max iterations reached")
  await writer.close()

  const parsed = await events
  expect(parsed.length).toBe(1)
  expect(parsed[0].event).toBe("fallback")

  const payload = parsed[0].data as Record<string, unknown>
  expect(payload.type).toBe("fallback")
  expect(payload.reason).toBe("max iterations reached")
})

test("done payload includes usage object", async () => {
  const { writer, events } = createTestWriterPair()

  await sendDone(writer, { prompt_tokens: 100, completion_tokens: 50 })
  await writer.close()

  const parsed = await events
  expect(parsed.length).toBe(1)
  expect(parsed[0].event).toBe("done")

  const payload = parsed[0].data as { usage: Record<string, unknown> }
  expect(payload.usage).toEqual({ prompt_tokens: 100, completion_tokens: 50 })
})

test("tool_start -> tool_result -> content -> done order is stable", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolStart(writer, "search_knowledge_base", { query: "test" })
  await sendToolResult(
    writer,
    "search_knowledge_base",
    "success",
    "found 3 results"
  )
  await sendContent(writer, "Here are the results...")
  await sendDone(writer, { prompt_tokens: 50, completion_tokens: 30 })
  await writer.close()

  const parsed = await events

  const toolStartIdx = parsed.findIndex((e) => e.event === "tool_start")
  const toolResultIdx = parsed.findIndex((e) => e.event === "tool_result")
  const contentIdx = parsed.findIndex((e) => e.event === "content")
  const doneIdx = parsed.findIndex((e) => e.event === "done")

  expect(toolStartIdx).not.toBe(-1)
  expect(toolResultIdx).not.toBe(-1)
  expect(contentIdx).not.toBe(-1)
  expect(doneIdx).not.toBe(-1)

  expect(toolStartIdx < toolResultIdx).toBeTruthy()
  expect(toolResultIdx < contentIdx).toBeTruthy()
  expect(contentIdx < doneIdx).toBeTruthy()
})

test("trace events do not break existing event order", async () => {
  const { writer, events } = createTestWriterPair()

  await emitAgentStep(writer, 1, 0)
  await emitToolDecision(
    writer,
    "search_knowledge_base",
    "user query about housing"
  )
  await sendToolStart(writer, "search_knowledge_base", { query: "housing" })
  await emitObservation(writer, "search_knowledge_base", "success", "5 results")
  await sendToolResult(writer, "search_knowledge_base", "success", "5 results")
  await sendContent(writer, "Here are the results...")
  await emitFinalizing(writer, "complete")
  await sendDone(writer, { prompt_tokens: 50, completion_tokens: 30 })
  await writer.close()

  const parsed = await events

  const expectedEventTypes = [
    "agent_step",
    "tool_decision",
    "tool_start",
    "observation",
    "tool_result",
    "content",
    "finalizing",
    "done",
  ]

  for (const eventType of expectedEventTypes) {
    expect(parsed.findIndex((e) => e.event === eventType)).not.toBe(-1)
  }

  const toolStartIdx = parsed.findIndex((e) => e.event === "tool_start")
  const toolResultIdx = parsed.findIndex((e) => e.event === "tool_result")
  const contentIdx = parsed.findIndex((e) => e.event === "content")
  const doneIdx = parsed.findIndex((e) => e.event === "done")

  expect(toolStartIdx < toolResultIdx).toBeTruthy()
  expect(contentIdx < doneIdx).toBeTruthy()
})
