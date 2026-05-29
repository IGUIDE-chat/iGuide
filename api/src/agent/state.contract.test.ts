import assert from "node:assert/strict"
import test from "node:test"

import { type Observation } from "./observation.ts"
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
  assert.equal(state.stepIndex, 0)

  const nextState = advanceStep(state)
  assert.equal(
    nextState.stepIndex,
    1,
    "After one advance, stepIndex should be 1"
  )

  const finalState = advanceStep(nextState)
  assert.equal(
    finalState.stepIndex,
    2,
    "After two advances, stepIndex should be 2"
  )
})

test("advanceStep preserves other state fields", () => {
  const state = createInitialState()
  const toolCall = createMinimalToolCall()
  state.currentToolCalls.push(toolCall)

  const nextState = advanceStep(state)

  assert.equal(nextState.stepIndex, 1)
  assert.equal(nextState.currentToolCalls.length, 1)
  assert.equal(nextState.currentToolCalls[0].id, "call_123")
})

test("observations can be added to state", () => {
  const state = createInitialState()
  const observation = createMinimalObservation()

  state.observations.push(observation)

  const observations = getObservations(state)
  assert.equal(observations.length, 1)
  assert.equal(observations[0].toolCallId, "call_123")
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
  assert.equal(observations.length, 2)
  assert.equal(observations[0].toolCallId, "call_1")
  assert.equal(observations[1].toolCallId, "call_2")
})

test("stop reason can be set and retrieved", () => {
  const state = createInitialState()
  assert.equal(getStopReason(state), null)

  state.stopReason = "stop"
  assert.equal(getStopReason(state), "stop")

  state.stopReason = "tool_calls"
  assert.equal(getStopReason(state), "tool_calls")
})

test("stop reason tracks max iterations", () => {
  const state = createInitialState()
  state.stopReason = "max_iterations"

  assert.equal(getStopReason(state), "max_iterations")
})

test("initial state is first turn", () => {
  const state = createInitialState()
  assert.equal(isFirstTurn(state), true, "Initial state should be first turn")
  assert.equal(isReplayTurn(state), false, "Initial state should not be replay")
})

test("state after advance is not first turn", () => {
  const state = createInitialState()
  const nextState = advanceStep(state)

  assert.equal(
    isFirstTurn(nextState),
    false,
    "After advance should not be first turn"
  )
})

test("replay turn has prior observations", () => {
  const state = createInitialState()

  assert.equal(isReplayTurn(state), false)

  state.observations.push(createMinimalObservation())

  assert.equal(
    isReplayTurn(state),
    true,
    "State with prior observations should be replay"
  )
})

test("replay turn preserves conversation context", () => {
  const state = createInitialState()

  state.messages.push({ role: "user", content: "What are dorm options?" })
  state.messages.push({ role: "assistant", content: "Let me search..." })
  state.observations.push(createMinimalObservation())
  state.stopReason = "tool_calls"

  assert.equal(isReplayTurn(state), true)

  assert.equal(state.messages.length, 2)
  assert.equal(state.messages[0].role, "user")
  assert.equal(state.messages[1].role, "assistant")
})

test("advanceStep returns new state object", () => {
  const state = createInitialState()
  const nextState = advanceStep(state)

  assert.notEqual(state, nextState, "advanceStep should return new state")
  assert.equal(state.stepIndex, 0, "Original state should be unchanged")
  assert.equal(nextState.stepIndex, 1, "New state should have advanced index")
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
  assert.equal(calls.length, 2, "Should support multiple concurrent tool calls")

  assert.equal(calls[0].id, "call_1")
  assert.equal(calls[1].id, "call_2")
  assert.notEqual(calls[0].name, calls[1].name)
})
