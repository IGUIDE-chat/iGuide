import { expect, test, vi } from "vite-plus/test"

import { resolveProvider } from "./provider.ts"

const capturedCalls: Array<{ baseURL?: string; apiKey?: string }> = []

vi.mock("@ai-sdk/deepseek", () => ({
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
}))

test("CN region with SiliconFlow key uses api.siliconflow.cn", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { SILICONFLOW_API_KEY: "sf-key", DEEPSEEK_API_KEY: undefined },
    region: "CN",
  })

  provider("deepseek-v4-flash")

  expect(capturedCalls.length).toBe(1)
  expect(capturedCalls[0].baseURL).toBe("https://api.siliconflow.cn/v1")
  expect(capturedCalls[0].apiKey).toBe("sf-key")
})

test("CN region without SiliconFlow key falls back to DeepSeek endpoint", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { SILICONFLOW_API_KEY: undefined, DEEPSEEK_API_KEY: "ds-key" },
    region: "CN",
  })

  provider("deepseek-v4-flash")

  expect(capturedCalls.length).toBe(1)
  expect(capturedCalls[0].baseURL).toBe("https://api.deepseek.com")
  expect(capturedCalls[0].apiKey).toBe("ds-key")
})

test("Global region uses api.deepseek.com", () => {
  capturedCalls.length = 0

  const provider = resolveProvider({
    env: { DEEPSEEK_API_KEY: "ds-key-global" },
    region: "Global",
  })

  provider("deepseek-v4-flash")

  expect(capturedCalls.length).toBe(1)
  expect(capturedCalls[0].baseURL).toBe("https://api.deepseek.com")
  expect(capturedCalls[0].apiKey).toBe("ds-key-global")
})

test("throws when no key is configured", () => {
  expect(() => resolveProvider({ env: {}, region: "Global" })).toThrow(
    /No provider key configured/
  )
})
