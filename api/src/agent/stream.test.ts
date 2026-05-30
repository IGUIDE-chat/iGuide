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

  const toolStartIdx = parsed.findIndex((e) => e.event === "tool_start")
  const toolResultIdx = parsed.findIndex((e) => e.event === "tool_result")
  const contentIdx = parsed.findIndex((e) => e.event === "content")
  const doneIdx = parsed.findIndex((e) => e.event === "done")

  assert.notEqual(toolStartIdx, -1, "Must have tool_start event")
  assert.notEqual(toolResultIdx, -1, "Must have tool_result event")
  assert.notEqual(contentIdx, -1, "Must have content event")
  assert.notEqual(doneIdx, -1, "Must have done event")

  assert.ok(
    toolStartIdx < toolResultIdx,
    "tool_start must come before tool_result"
  )
  assert.ok(toolResultIdx < contentIdx, "tool_result must come before content")
  assert.ok(contentIdx < doneIdx, "content must come before done")
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
    assert.notEqual(
      parsed.findIndex((e) => e.event === eventType),
      -1,
      `Must have ${eventType} event`
    )
  }

  const toolStartIdx = parsed.findIndex((e) => e.event === "tool_start")
  const toolResultIdx = parsed.findIndex((e) => e.event === "tool_result")
  const contentIdx = parsed.findIndex((e) => e.event === "content")
  const doneIdx = parsed.findIndex((e) => e.event === "done")

  assert.ok(
    toolStartIdx < toolResultIdx,
    "tool_start must come before tool_result"
  )
  assert.ok(contentIdx < doneIdx, "content must come before done")
})
