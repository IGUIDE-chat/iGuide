import assert from "node:assert/strict"
import test from "node:test"

import type { Env } from "../types.ts"
import { handleQuizRequest } from "./quiz.ts"

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
} as Env

test("the quiz API refuses guests before touching storage or DeepSeek", async () => {
  let touched = false
  const response = await handleQuizRequest(
    new Request("https://iguide.chat/api/quiz/status"),
    env,
    {
      createStore: () => {
        touched = true
        throw new Error("must not build a store for a guest")
      },
    },
  )
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: "Sign in to use the daily quiz",
    code: "SIGN_IN_REQUIRED",
  })
  assert.equal(touched, false)
})
