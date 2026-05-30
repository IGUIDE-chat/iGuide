import { expect, test } from "vite-plus/test"

import type { Observation } from "./observation.ts"
import {
  advanceStep,
  createInitialState,
  getCurrentToolCalls,
  getObservations,
  getStopReason,
  isFirstTurn,
  isReplayTurn,
} from "./state.ts"

function createMinimalToolCall() {
  return {
    id: "call_123",
    name: "search_knowledge_base",
    input: { query: "test query" },
  }
}

function createMinimalObservation(): Observation {
  return {
    toolCallId: "call_123",
    toolName: "search_knowledge_base",
    input: { query: "test query" },
    output: { content: "test result" },
    status: "success",
    summary: "Found 1 result",
    raw: '{"content":"test result"}',
    truncated: false,
    error: null,
  }
}

test("advanceStep increments step index", () => {
  const state = createInitialState()
  expect(state.stepIndex).toBe(0)

  const nextState = advanceStep(state)
  expect(nextState.stepIndex).toBe(1)

  const finalState = advanceStep(nextState)
  expect(finalState.stepIndex).toBe(2)
})

test("advanceStep preserves other state fields", () => {
  const state = createInitialState()
  const toolCall = createMinimalToolCall()
  state.currentToolCalls.push(toolCall)

  const nextState = advanceStep(state)

  expect(nextState.stepIndex).toBe(1)
  expect(nextState.currentToolCalls.length).toBe(1)
  expect(nextState.currentToolCalls[0].id).toBe("call_123")
})

test("observations can be added to state", () => {
  const state = createInitialState()
  const observation = createMinimalObservation()

  state.observations.push(observation)

  const observations = getObservations(state)
  expect(observations.length).toBe(1)
  expect(observations[0].toolCallId).toBe("call_123")
})

test("observations maintain order", () => {
  const state = createInitialState()

  const obs1: Observation = {
    toolCallId: "call_1",
    toolName: "search_knowledge_base",
    input: { query: "first" },
    output: { content: "result 1" },
    status: "success",
    summary: "First result",
    raw: "{}",
    truncated: false,
    error: null,
  }

  const obs2: Observation = {
    toolCallId: "call_2",
    toolName: "web_search",
    input: { query: "second" },
    output: { content: "result 2" },
    status: "success",
    summary: "Second result",
    raw: "{}",
    truncated: false,
    error: null,
  }

  state.observations.push(obs1)
  state.observations.push(obs2)

  const observations = getObservations(state)
  expect(observations.length).toBe(2)
  expect(observations[0].toolCallId).toBe("call_1")
  expect(observations[1].toolCallId).toBe("call_2")
})

test("stop reason can be set and retrieved", () => {
  const state = createInitialState()
  expect(getStopReason(state)).toBe(null)

  state.stopReason = "stop"
  expect(getStopReason(state)).toBe("stop")

  state.stopReason = "tool_calls"
  expect(getStopReason(state)).toBe("tool_calls")
})

test("stop reason tracks max iterations", () => {
  const state = createInitialState()
  state.stopReason = "max_iterations"

  expect(getStopReason(state)).toBe("max_iterations")
})

test("initial state is first turn", () => {
  const state = createInitialState()
  expect(isFirstTurn(state)).toBe(true)
  expect(isReplayTurn(state)).toBe(false)
})

test("state after advance is not first turn", () => {
  const state = createInitialState()
  const nextState = advanceStep(state)

  expect(isFirstTurn(nextState)).toBe(false)
})

test("replay turn has prior observations", () => {
  const state = createInitialState()

  expect(isReplayTurn(state)).toBe(false)

  state.observations.push(createMinimalObservation())

  expect(isReplayTurn(state)).toBe(true)
})

test("replay turn preserves conversation context", () => {
  const state = createInitialState()

  state.messages.push({ role: "user", content: "What are dorm options?" })
  state.messages.push({ role: "assistant", content: "Let me search..." })
  state.observations.push(createMinimalObservation())
  state.stopReason = "tool_calls"

  expect(isReplayTurn(state)).toBe(true)

  expect(state.messages.length).toBe(2)
  expect(state.messages[0].role).toBe("user")
  expect(state.messages[1].role).toBe("assistant")
})

test("advanceStep returns new state object", () => {
  const state = createInitialState()
  const nextState = advanceStep(state)

  expect(state).not.toBe(nextState)
  expect(state.stepIndex).toBe(0)
  expect(nextState.stepIndex).toBe(1)
})

test("state can track multiple concurrent tool calls", () => {
  const state = createInitialState()

  state.currentToolCalls.push({
    id: "call_1",
    name: "search_knowledge_base",
    input: { query: "dorms" },
  })

  state.currentToolCalls.push({
    id: "call_2",
    name: "web_search",
    input: { query: "UIUC housing" },
  })

  const calls = getCurrentToolCalls(state)
  expect(calls.length).toBe(2)

  expect(calls[0].id).toBe("call_1")
  expect(calls[1].id).toBe("call_2")
  expect(calls[0].name).not.toBe(calls[1].name)
})
