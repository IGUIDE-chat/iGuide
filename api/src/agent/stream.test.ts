import assert from "node:assert/strict"
import test from "node:test"

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
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

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
  assert.equal(parsed.length, 1, "Should emit exactly one event")
  assert.equal(parsed[0].event, "tool_start")

  const payload = parsed[0].data as Record<string, unknown>
  assert.equal(
    payload.name,
    "search_knowledge_base",
    "tool_start payload must use 'name' field"
  )
  assert.ok(!("tool" in payload), "tool_start must NOT have 'tool' field")
  assert.deepEqual(payload.args, { query: "housing" })
})

test("tool_result payload uses 'name' field (not 'tool')", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolResult(writer, "search_knowledge_base", "success", "2 results")
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].event, "tool_result")

  const payload = parsed[0].data as Record<string, unknown>
  assert.equal(
    payload.name,
    "search_knowledge_base",
    "tool_result payload must use 'name' field"
  )
  assert.ok(!("tool" in payload), "tool_result must NOT have 'tool' field")
  assert.equal(payload.status, "success")
  assert.equal(payload.summary, "2 results")
})

test("tool_start payload includes args object", async () => {
  const { writer, events } = createTestWriterPair()

  const args = { query: "PAR dorm", limit: 5, filters: { type: "dorm" } }
  await sendToolStart(writer, "search_knowledge_base", args)
  await writer.close()

  const parsed = await events
  const payload = parsed[0].data as Record<string, unknown>
  assert.deepEqual(payload.args, args, "Args should be preserved exactly")
})

test("tool_result payload includes status and summary", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolResult(writer, "web_search", "error", "API timeout")
  await writer.close()

  const parsed = await events
  const payload = parsed[0].data as Record<string, unknown>
  assert.equal(payload.status, "error")
  assert.equal(payload.summary, "API timeout")
})

test("content payload uses choices[].delta.content structure", async () => {
  const { writer, events } = createTestWriterPair()

  await sendContent(writer, "Housing options are available.")
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].event, "content")

  const payload = parsed[0].data as {
    choices: Array<{ delta: { content: string } }>
  }
  assert.ok(Array.isArray(payload.choices), "content must have choices array")
  assert.equal(payload.choices.length, 1)
  assert.equal(
    payload.choices[0].delta.content,
    "Housing options are available."
  )
  assert.equal(payload.choices[0].index, 0)
})

test("content payload includes optional metadata in delta", async () => {
  const { writer, events } = createTestWriterPair()

  await sendContent(writer, "result", { source: "test" })
  await writer.close()

  const parsed = await events
  const payload = parsed[0].data as {
    choices: Array<{
      delta: { content: string; metadata?: Record<string, unknown> }
    }>
  }
  assert.deepEqual(payload.choices[0].delta.metadata, { source: "test" })
})

test("fallback payload includes type and reason", async () => {
  const { writer, events } = createTestWriterPair()

  await sendFallback(writer, "max iterations reached")
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].event, "fallback")

  const payload = parsed[0].data as Record<string, unknown>
  assert.equal(payload.type, "fallback")
  assert.equal(payload.reason, "max iterations reached")
})

test("done payload includes usage object", async () => {
  const { writer, events } = createTestWriterPair()

  await sendDone(writer, { prompt_tokens: 100, completion_tokens: 50 })
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].event, "done")

  const payload = parsed[0].data as { usage: Record<string, unknown> }
  assert.deepEqual(payload.usage, { prompt_tokens: 100, completion_tokens: 50 })
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
  assert.equal(parsed.length, 4, "Should have exactly 4 events")

  assert.equal(parsed[0].event, "tool_start", "First event must be tool_start")
  assert.equal(
    parsed[1].event,
    "tool_result",
    "Second event must be tool_result"
  )
  assert.equal(parsed[2].event, "content", "Third event must be content")
  assert.equal(parsed[3].event, "done", "Fourth event must be done")
})

test("multiple tool calls maintain sequential order", async () => {
  const { writer, events } = createTestWriterPair()

  await sendToolStart(writer, "search_knowledge_base", { query: "housing" })
  await sendToolResult(writer, "search_knowledge_base", "success", "5 results")

  await sendToolStart(writer, "web_search", { query: "UIUC dorms" })
  await sendToolResult(writer, "web_search", "success", "3 results")

  await sendContent(writer, "Combined results...")
  await sendDone(writer, { prompt_tokens: 100, completion_tokens: 60 })
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 6)

  const eventNames = parsed.map((e) => e.event)
  assert.deepEqual(eventNames, [
    "tool_start",
    "tool_result",
    "tool_start",
    "tool_result",
    "content",
    "done",
  ])
})

test("content-only response (no tools) emits content then done", async () => {
  const { writer, events } = createTestWriterPair()

  await sendContent(writer, "Hello! How can I help?")
  await sendDone(writer, { prompt_tokens: 10, completion_tokens: 5 })
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].event, "content")
  assert.equal(parsed[1].event, "done")
})

test("fallback response emits fallback then done", async () => {
  const { writer, events } = createTestWriterPair()

  await sendFallback(writer, "max iterations reached")
  await sendDone(writer, { prompt_tokens: 200, completion_tokens: 100 })
  await writer.close()

  const parsed = await events
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].event, "fallback")
  assert.equal(parsed[1].event, "done")
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
  assert.equal(parsed.length, 8)

  const eventNames = parsed.map((e) => e.event)
  assert.deepEqual(eventNames, [
    "agent_step",
    "tool_decision",
    "tool_start",
    "observation",
    "tool_result",
    "content",
    "finalizing",
    "done",
  ])
})
