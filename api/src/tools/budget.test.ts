import assert from "node:assert/strict"
import test from "node:test"

import { tool } from "ai"
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
      execute: async () => {
        callCount++
        return "ok"
      },
    }),
  }

  const guarded = withGuards(tools, { maxCalls: 10 })

  for (let i = 0; i < 9; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential test assertions
    const result = await guarded.test_tool.execute!({})
    assert.equal(result, "ok")
  }
  assert.equal(callCount, 9)
})

test("over budget rejects 11th call when maxCalls=10", async () => {
  const tools = {
    test_tool: tool({
      description: "test",
      parameters: z.object({}),
      execute: async () => "ok",
    }),
  }

  const guarded = withGuards(tools, { maxCalls: 10 })

  for (let i = 0; i < 10; i++) {
    // eslint-disable-next-line no-await-in-loop -- sequential test assertions
    await guarded.test_tool.execute!({})
  }

  await assert.rejects(
    () => guarded.test_tool.execute!({}),
    ToolBudgetExceededError
  )
})

test("timeout rejects after timeoutMs", async () => {
  const tools = {
    slow_tool: tool({
      description: "slow",
      parameters: z.object({}),
      execute: async () => {
        await new Promise<void>((resolve) => { setTimeout(resolve, 200) })
        return "too late"
      },
    }),
  }

  const guarded = withGuards(tools, { timeoutMs: 50, maxCalls: 10 })

  await assert.rejects(() => guarded.slow_tool.execute!({}), ToolTimeoutError)
})

test("truncation kicks in past maxResultBytes", async () => {
  const tools = {
    big_tool: tool({
      description: "big",
      parameters: z.object({}),
      execute: async () => "x".repeat(500),
    }),
  }

  const guarded = withGuards(tools, { maxResultBytes: 100, maxCalls: 10 })

  const result = await guarded.big_tool.execute!({})
  assert.equal(typeof result, "string")
  assert.ok(result.includes("[truncated]"))
  assert.ok(result.length < 500)
})
