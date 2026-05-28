import {
  type EmbeddingConfig,
  MAX_EMBEDDING_BATCH_SIZE,
} from "./embedding-config"

export interface EmbeddingResult {
  embeddings: number[][]
  provider: string
  dimensions: number
}

interface EmbeddingResponse {
  data?: Array<{
    embedding?: number[]
  }>
}

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

export class EmbeddingClient {
  constructor(private config: EmbeddingConfig) {
    if (!config.apiBaseUrl) {
      throw new EmbeddingConfigError("EMBEDDING_API_BASE_URL is required")
    }

    if (!config.apiKey) {
      throw new EmbeddingConfigError("EMBEDDING_API_KEY is required")
    }
  }

  async embed(
    texts: string[],
    type: "query" | "document"
  ): Promise<EmbeddingResult> {
    if (texts.length === 0) {
      return {
        embeddings: [],
        provider: this.getProviderLabel(this.config.apiBaseUrl),
        dimensions: this.config.dimensions,
      }
    }

    const prefix = type === "query" ? "query: " : "passage: "
    const formattedTexts = texts.map((text) => `${prefix}${text}`)
    const embeddings: number[][] = []
    let provider = this.getProviderLabel(this.config.apiBaseUrl)

    for (
      let index = 0;
      index < formattedTexts.length;
      index += MAX_EMBEDDING_BATCH_SIZE
    ) {
      const batch = formattedTexts.slice(
        index,
        index + MAX_EMBEDDING_BATCH_SIZE
      )
      const batchResult = await this.embedBatch(batch)
      embeddings.push(...batchResult.embeddings)
      provider = batchResult.provider
    }

    return {
      embeddings,
      provider,
      dimensions: this.config.dimensions,
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    const result = await this.embed([text], "query")
    return result.embeddings[0] || []
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const result = await this.embed(texts, "document")
    return result.embeddings
  }

  private async embedBatch(texts: string[]): Promise<EmbeddingResult> {
    try {
      return await this.requestEmbeddings(this.config.apiBaseUrl, texts)
    } catch (error) {
      if (!this.config.fallbackUrl) {
        throw error
      }

      return this.requestEmbeddings(this.config.fallbackUrl, texts)
    }
  }

  private async requestEmbeddings(
    baseUrl: string,
    texts: string[]
  ): Promise<EmbeddingResult> {
    const endpoint = this.buildEmbeddingsUrl(baseUrl)
    const provider = this.getProviderLabel(baseUrl)

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          input: texts,
        }),
      })
    } catch (cause) {
      throw new EmbeddingProviderError(
        `Embedding provider request failed for ${provider}`,
        {
          provider,
          url: endpoint,
          cause,
        }
      )
    }

    if (!response.ok) {
      const body = await response.text()
      throw new EmbeddingProviderError(
        `Embedding provider returned ${response.status} for ${provider}`,
        {
          provider,
          url: endpoint,
          status: response.status,
          body,
        }
      )
    }

    const json = (await response.json()) as EmbeddingResponse
    const embeddings = (json.data || []).map((item) => item.embedding || [])

    if (embeddings.length !== texts.length) {
      throw new EmbeddingProviderError(
        `Embedding provider returned ${embeddings.length} embeddings for ${texts.length} inputs`,
        {
          provider,
          url: endpoint,
        }
      )
    }

    for (const embedding of embeddings) {
      if (embedding.length !== this.config.dimensions) {
        throw new EmbeddingDimensionError(
          this.config.dimensions,
          embedding.length,
          provider
        )
      }
    }

    return {
      embeddings,
      provider,
      dimensions: this.config.dimensions,
    }
  }

  private buildEmbeddingsUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, "")}/v1/embeddings`
  }

  private getProviderLabel(baseUrl: string): string {
    try {
      return new URL(baseUrl).host
    } catch {
      return baseUrl
    }
  }
}
