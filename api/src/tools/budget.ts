import type { Tool } from "ai"

/**
 * Thrown when the tool call budget (maxCalls) is exceeded.
 */
export class ToolBudgetExceededError extends Error {
  constructor() {
    super("tool_budget_exceeded")
    this.name = "ToolBudgetExceededError"
  }
}

/**
 * Thrown when a tool execution exceeds the configured timeout.
 */
export class ToolTimeoutError extends Error {
  constructor() {
    super("tool_timeout")
    this.name = "ToolTimeoutError"
  }
}

export interface BudgetOptions {
  /** Max allowed tool calls per request (default: 10). */
  maxCalls?: number
  /** Max execution time per tool in ms (default: 10000). */
  timeoutMs?: number
  /** Max result byte length before truncation (default: 4096). */
  maxResultBytes?: number
}

const DEFAULTS = {
  maxCalls: 10,
  timeoutMs: 10_000,
  maxResultBytes: 4096,
} as const satisfies BudgetOptions

const TRUNCATION_SUFFIX = "\n...[truncated]"

function truncateResult(result: string, maxBytes: number): string {
  if (maxBytes <= 0) {
    return TRUNCATION_SUFFIX
  }

  const encoder = new TextEncoder()
  const bytes = encoder.encode(result)

  if (bytes.length <= maxBytes) {
    return result
  }

  const suffixBytes = encoder.encode(TRUNCATION_SUFFIX).length
  const contentLimit = Math.max(0, maxBytes - suffixBytes)

  if (contentLimit <= 0) {
    return TRUNCATION_SUFFIX
  }

  // Decode from bytes to maintain UTF-8 character boundaries
  const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true })
  return decoder.decode(bytes.slice(0, contentLimit)) + TRUNCATION_SUFFIX
}

/**
 * Wrap a `Record<string, Tool>` with budget, timeout, and truncation guards.
 *
 * Each call to `withGuards` creates a fresh per-request call counter.
 * The returned record preserves the original tool shapes so it can be
 * passed directly to `streamText({ tools })`.
 */
export function withGuards<T extends Record<string, Tool>>(
  rawTools: T,
  opts: BudgetOptions = {}
): T {
  const maxCalls = opts.maxCalls ?? DEFAULTS.maxCalls
  const timeoutMs = opts.timeoutMs ?? DEFAULTS.timeoutMs
  const maxResultBytes = opts.maxResultBytes ?? DEFAULTS.maxResultBytes

  // Per-request closure counter (NOT global): each withGuards call is fresh
  const budget = { callCount: 0 }

  const guarded: Record<string, Tool> = {}

  for (const [name, rawTool] of Object.entries(rawTools)) {
    const rawExecute = rawTool.execute as
      | ((input: unknown, options?: unknown) => unknown)
      | undefined

    if (typeof rawExecute !== "function") {
      guarded[name] = rawTool
      continue
    }

    guarded[name] = {
      ...rawTool,
      execute: createGuardedExecute(rawExecute, {
        budget,
        maxCalls,
        timeoutMs,
        maxResultBytes,
      }),
    }
  }

  return guarded as T
}

function createGuardedExecute(
  rawExecute: (input: unknown, options?: unknown) => unknown,
  opts: {
    budget: { callCount: number }
    maxCalls: number
    timeoutMs: number
    maxResultBytes: number
  }
) {
  const { budget, maxCalls, timeoutMs, maxResultBytes } = opts
  return async (input: unknown, options?: unknown) => {
    budget.callCount++
    if (budget.callCount > maxCalls) {
      throw new ToolBudgetExceededError()
    }

    // Promise.race with proper timer cleanup to avoid unhandled rejections
    const result = await new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolTimeoutError())
      }, timeoutMs)

      try {
        const returned = rawExecute(input, options)
        Promise.resolve(returned)
          .then((value) => {
            clearTimeout(timer)
            resolve(value)
            return null
          })
          .catch((error: unknown) => {
            clearTimeout(timer)
            reject(error)
          })
      } catch (error) {
        clearTimeout(timer)
        reject(error)
      }
    })

    if (typeof result === "string" && maxResultBytes > 0) {
      return truncateResult(result, maxResultBytes)
    }

    return result
  }
}
