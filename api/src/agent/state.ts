import type { Observation } from "./observation.ts"

export const LoopState = Symbol("LoopState")

export interface LoopToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface LoopMessage {
  role: string
  content: string | null
}

export interface LoopState {
  stepIndex: number
  iterationCount: number
  currentToolCalls: LoopToolCall[]
  observations: Observation[]
  stopReason: string | null
  messages: LoopMessage[]
}

export function createInitialState(): LoopState {
  return {
    stepIndex: 0,
    iterationCount: 0,
    currentToolCalls: [],
    observations: [],
    stopReason: null,
    messages: [],
  }
}

export function advanceStep(state: LoopState): LoopState {
  return {
    ...state,
    stepIndex: state.stepIndex + 1,
  }
}

export function getCurrentToolCalls(state: LoopState): LoopToolCall[] {
  return state.currentToolCalls
}

export function getObservations(state: LoopState): Observation[] {
  return state.observations
}

export function getStopReason(state: LoopState): string | null {
  return state.stopReason
}

export function isFirstTurn(state: LoopState): boolean {
  return state.stepIndex === 0
}

export function isReplayTurn(state: LoopState): boolean {
  return state.observations.length > 0
}
