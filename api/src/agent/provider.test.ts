import assert from "node:assert/strict"
import { mock, test } from "node:test"

const capturedCalls: Array<{ baseURL?: string; apiKey?: string }> = []

await mock.module("@ai-sdk/deepseek", {
  exports: {
    createDeepSeek(options: { baseURL?: string; apiKey?: string }) {
      capturedCalls.push({ baseURL: options.baseURL, apiKey: options.apiKey })
      const provider = (modelId: string) => ({
        modelId,
        baseURL: options.baseURL,
      })
      provider.languageModel = (modelId: string) => ({ modelId })
      provider.chat = (modelId: string) => ({ modelId })
      provider.textEmbeddingModel = () => {
        throw new Error("not supported")
      }
      return provider
    },
  },
})

const { resolveProvider } = await import("./provider.ts")

test("CN region with SiliconFlow key uses api.siliconflow.cn", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { SILICONFLOW_API_KEY: "sf-key", DEEPSEEK_API_KEY: undefined },
    region: "CN",
  })

  provider("deepseek-v4-flash")

  assert.equal(capturedCalls.length, 1)
  assert.equal(capturedCalls[0].baseURL, "https://api.siliconflow.cn/v1")
  assert.equal(capturedCalls[0].apiKey, "sf-key")
})

test("CN region without SiliconFlow key falls back to DeepSeek endpoint", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { SILICONFLOW_API_KEY: undefined, DEEPSEEK_API_KEY: "ds-key" },
    region: "CN",
  })

  provider("deepseek-v4-flash")

  assert.equal(capturedCalls.length, 1)
  assert.equal(capturedCalls[0].baseURL, "https://api.deepseek.com")
  assert.equal(capturedCalls[0].apiKey, "ds-key")
})

test("Global region uses api.deepseek.com", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { DEEPSEEK_API_KEY: "ds-key-global" },
    region: "Global",
  })

  provider("deepseek-v4-flash")

  assert.equal(capturedCalls.length, 1)
  assert.equal(capturedCalls[0].baseURL, "https://api.deepseek.com")
  assert.equal(capturedCalls[0].apiKey, "ds-key-global")
})

test("throws when no key is configured", () => {
  assert.throws(
    () => resolveProvider({ env: {}, region: "Global" }),
    /No provider key configured/
  )
})
