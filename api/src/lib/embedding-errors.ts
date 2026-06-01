interface EmbeddingProviderErrorDetails {
  provider: string
  url: string
  status?: number
  body?: string
  cause?: unknown
}

export class EmbeddingConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EmbeddingConfigError"
  }
}

export class EmbeddingDimensionError extends Error {
  readonly expected: number
  readonly actual: number
  readonly provider: string

  constructor(expected: number, actual: number, provider: string) {
    super(
      `Embedding provider returned ${actual} dimensions, expected ${expected}`
    )
    this.name = "EmbeddingDimensionError"
    this.expected = expected
    this.actual = actual
    this.provider = provider
  }
}

export class EmbeddingProviderError extends Error {
  readonly details: EmbeddingProviderErrorDetails

  constructor(message: string, details: EmbeddingProviderErrorDetails) {
    super(message)
    this.name = "EmbeddingProviderError"
    this.details = details
  }
}
