export const DEFAULT_EMBEDDING_MODEL = "multilingual-e5-small"
export const DEFAULT_EMBEDDING_DIMENSIONS = 384
export const MAX_EMBEDDING_BATCH_SIZE = 32

export interface EmbeddingConfig {
  apiBaseUrl: string
  apiKey: string
  model: string
  dimensions: number
  fallbackUrl?: string
}

export function getEmbeddingConfig(
  env: Record<string, string>
): EmbeddingConfig {
  const dimensions = parseInt(
    env.EMBEDDING_DIMENSIONS || String(DEFAULT_EMBEDDING_DIMENSIONS),
    10
  )

  return {
    apiBaseUrl: env.EMBEDDING_API_BASE_URL || "",
    apiKey: env.EMBEDDING_API_KEY || "",
    model: env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    dimensions:
      Number.isFinite(dimensions) && dimensions > 0
        ? dimensions
        : DEFAULT_EMBEDDING_DIMENSIONS,
    fallbackUrl: env.EMBEDDING_FALLBACK_URL || undefined,
  }
}
