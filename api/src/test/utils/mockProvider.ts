interface MockProviderToolCallInput {
  id?: string
  name: string
  arguments?: Record<string, unknown> | string
}

export interface MockProviderResponseInput {
  content?: string
  reasoningContent?: string
  toolCalls?: MockProviderToolCallInput[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  stream?: boolean
  status?: number
  error?: string
}

export interface RecordedProviderRequest {
  input: Parameters<typeof fetch>[0]
  init?: RequestInit
  body: unknown
}

export type MockProviderFetch = typeof fetch & {
  readonly requests: RecordedProviderRequest[]
}

const encoder = new TextEncoder()

function normalizeToolCall(
  toolCall: MockProviderToolCallInput,
  index: number
): Record<string, unknown> {
  return {
    id: toolCall.id ?? `call_${index + 1}`,
    type: 'function',
    function: {
      name: toolCall.name,
      arguments:
        typeof toolCall.arguments === 'string'
          ? toolCall.arguments
          : JSON.stringify(toolCall.arguments ?? {}),
    },
  }
}

function buildJsonBody(
  response: MockProviderResponseInput
): Record<string, unknown> {
  const content = response.content ?? ''
  const toolCalls = response.toolCalls?.map(normalizeToolCall)

  return {
    id: 'chatcmpl_mock',
    object: 'chat.completion',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
          ...(response.reasoningContent
            ? { reasoning_content: response.reasoningContent }
            : {}),
          ...(toolCalls && toolCalls.length > 0
            ? { tool_calls: toolCalls }
            : {}),
        },
        finish_reason:
          toolCalls && toolCalls.length > 0 ? 'tool_calls' : 'stop',
      },
    ],
    usage: response.usage ?? {
      prompt_tokens: 1,
      completion_tokens: 1,
      total_tokens: 2,
    },
  }
}

function createJsonResponse(response: MockProviderResponseInput): Response {
  if (response.error) {
    return new Response(
      JSON.stringify({ error: { message: response.error } }),
      {
        status: response.status ?? 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify(buildJsonBody(response)), {
    status: response.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createStreamResponse(response: MockProviderResponseInput): Response {
  if (response.error) {
    return createJsonResponse(response)
  }

  const toolCalls = response.toolCalls?.map(normalizeToolCall) ?? []
  const chunks: string[] = []

  if (response.content) {
    chunks.push(
      `data: ${JSON.stringify({
        choices: [{ delta: { role: 'assistant', content: response.content } }],
      })}\n\n`
    )
  }

  for (const [index, toolCall] of toolCalls.entries()) {
    chunks.push(
      `data: ${JSON.stringify({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index,
                  id: toolCall.id,
                  type: 'function',
                  function: toolCall.function,
                },
              ],
            },
          },
        ],
      })}\n\n`
    )
  }

  chunks.push(
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {},
          finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
        },
      ],
      usage: response.usage ?? {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
    })}\n\n`
  )
  chunks.push('data: [DONE]\n\n')

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      },
    }),
    {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }
  )
}

function shouldStream(init: RequestInit | undefined): boolean {
  if (!init?.body || typeof init.body !== 'string') {
    return false
  }

  try {
    const body = JSON.parse(init.body) as { stream?: unknown }
    return body.stream === true
  } catch {
    return false
  }
}

function parseRequestBody(init: RequestInit | undefined): unknown {
  if (!init?.body || typeof init.body !== 'string') {
    return null
  }

  try {
    return JSON.parse(init.body)
  } catch {
    return init.body
  }
}

export function createMockProviderFetch(
  responses: MockProviderResponseInput[] = [{ content: 'mock response' }]
): MockProviderFetch {
  const queue = [...responses]
  const requests: RecordedProviderRequest[] = []

  const mockFetch = (async (input, init) => {
    requests.push({ input, init, body: parseRequestBody(init) })
    const response = queue.shift() ??
      responses[responses.length - 1] ?? {
        content: 'mock response',
      }

    if (response.stream ?? shouldStream(init)) {
      return createStreamResponse(response)
    }

    return createJsonResponse(response)
  }) as MockProviderFetch

  Object.defineProperty(mockFetch, 'requests', {
    value: requests,
  })

  return mockFetch
}
