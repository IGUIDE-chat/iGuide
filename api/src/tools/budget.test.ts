import { tool } from "ai"
import { expect, test } from "vite-plus/test"
import { z } from "zod"

import {
  ToolBudgetExceededError,
  ToolTimeoutError,
  withGuards,
} from "./budget.ts"

test("under budget passes through (9 of 10 succeeds)", async () => {
  let callCount = 0
  const tools = {
    test_tool: tool({
      description: "test",
      parameters: z.object({}),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- pre-existing ai package version mismatch
      execute: async () => {
        callCount++
        return "ok"
      },
    }),
  }

  const guarded = withGuards(tools, { maxCalls: 10 })

  for (let i = 0; i < 9; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential test assertions
    // @ts-expect-error -- ai package expects 2 args
    const result = await guarded.test_tool.execute!({})
    expect(result).toBe("ok")
  }
  expect(callCount).toBe(9)
})

test("over budget rejects 11th call when maxCalls=10", async () => {
  const tools = {
    test_tool: tool({
      description: "test",
      parameters: z.object({}),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- pre-existing ai package version mismatch
      execute: async () => "ok",
    }),
  }

  const guarded = withGuards(tools, { maxCalls: 10 })

  for (let i = 0; i < 10; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential test assertions
    // @ts-expect-error -- ai package expects 2 args
    await guarded.test_tool.execute!({})
  }

  // @ts-expect-error -- ai package expects 2 args
  await expect(guarded.test_tool.execute!({})).rejects.toThrow(
    ToolBudgetExceededError
  )
})

test("timeout rejects after timeoutMs", async () => {
  const tools = {
    slow_tool: tool({
      description: "slow",
      parameters: z.object({}),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- pre-existing ai package version mismatch
      execute: async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 200)
        })
        return "too late"
      },
    }),
  }

  const guarded = withGuards(tools, { timeoutMs: 50, maxCalls: 10 })

  // @ts-expect-error -- ai package expects 2 args
  await expect(guarded.slow_tool.execute!({})).rejects.toThrow(ToolTimeoutError)
})

test("truncation kicks in past maxResultBytes", async () => {
  const tools = {
    big_tool: tool({
      description: "big",
      parameters: z.object({}),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- pre-existing ai package version mismatch
      execute: async () => "x".repeat(500),
    }),
  }

  const guarded = withGuards(tools, { maxResultBytes: 100, maxCalls: 10 })

  // @ts-expect-error -- ai package expects 2 args
  const result = await guarded.big_tool.execute!({})
  expect(typeof result).toBe("string")
  expect((result as string).includes("[truncated]")).toBeTruthy()
  expect((result as string).length < 500).toBeTruthy()
})
