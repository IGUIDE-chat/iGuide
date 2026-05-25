import { createDeepSeek } from '@ai-sdk/deepseek'
import type { DeepSeekProvider } from '@ai-sdk/deepseek'

export interface ProviderConfig {
  env: Record<string, string | undefined>
  region: 'CN' | 'Global'
}

export function resolveProvider(config: ProviderConfig): DeepSeekProvider {
  const { env, region } = config
  const siliconFlowKey = env.SILICONFLOW_API_KEY
  const deepSeekKey = env.DEEPSEEK_API_KEY

  if (region === 'CN' && siliconFlowKey) {
    // SiliconFlow model alias: deepseek-v4-flash — verify at https://api.siliconflow.cn/v1/models
    return createDeepSeek({
      baseURL: 'https://api.siliconflow.cn/v1',
      apiKey: siliconFlowKey,
    })
  }

  if (deepSeekKey) {
    return createDeepSeek({
      baseURL: env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com',
      apiKey: deepSeekKey,
    })
  }

  throw new Error('No provider key configured')
}
