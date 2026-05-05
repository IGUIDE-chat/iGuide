export type FallbackReason =
  | 'tool_timeout'
  | 'tool_failure'
  | 'max_iterations_exceeded'

export interface FallbackEvent {
  timestamp: string
  query: string
  failure_reason: FallbackReason
  fallback_level: 1 | 2 | 3
}

interface FallbackDecision {
  shouldFallback: boolean
  reason?: FallbackReason
}

interface WithFallbackOptions<T> {
  query: string
  evaluate: (result: T) => FallbackDecision
  retryOnce: (reason: FallbackReason, previousResult?: T) => Promise<T>
  directResponse: (reason: FallbackReason) => Promise<T>
  onFallbackEvent?: (event: FallbackEvent) => Promise<void> | void
  onError?: (error: unknown) => FallbackReason
}

function createFallbackEvent(
  query: string,
  reason: FallbackReason,
  level: 1 | 2 | 3
): FallbackEvent {
  return {
    timestamp: new Date().toISOString(),
    query,
    failure_reason: reason,
    fallback_level: level,
  }
}

export function logFallbackEvent(event: FallbackEvent): void {
  console.warn(JSON.stringify(event))
}

export async function withFallback<T>(
  fn: () => Promise<T>,
  options: WithFallbackOptions<T>
): Promise<T> {
  const emit = async (
    reason: FallbackReason,
    level: 1 | 2 | 3
  ): Promise<void> => {
    const event = createFallbackEvent(options.query, reason, level)
    logFallbackEvent(event)
    await options.onFallbackEvent?.(event)
  }

  let initialResult: T

  try {
    initialResult = await fn()
  } catch (error) {
    const reason = options.onError?.(error) ?? 'tool_failure'
    await emit(reason, 1)
    try {
      const retryResult = await options.retryOnce(reason)
      const retryDecision = options.evaluate(retryResult)
      if (!retryDecision.shouldFallback || !retryDecision.reason) {
        return retryResult
      }
      await emit(retryDecision.reason, 2)
      const directResult = await options.directResponse(retryDecision.reason)
      await emit(retryDecision.reason, 3)
      return directResult
    } catch (retryError) {
      const retryReason = options.onError?.(retryError) ?? reason
      await emit(retryReason, 2)
      const directResult = await options.directResponse(retryReason)
      await emit(retryReason, 3)
      return directResult
    }
  }

  const initialDecision = options.evaluate(initialResult)
  if (!initialDecision.shouldFallback || !initialDecision.reason) {
    return initialResult
  }

  await emit(initialDecision.reason, 1)

  let retryResult: T
  try {
    retryResult = await options.retryOnce(initialDecision.reason, initialResult)
  } catch (error) {
    const retryReason = options.onError?.(error) ?? initialDecision.reason
    await emit(retryReason, 2)
    const directResult = await options.directResponse(retryReason)
    await emit(retryReason, 3)
    return directResult
  }

  const retryDecision = options.evaluate(retryResult)
  if (!retryDecision.shouldFallback || !retryDecision.reason) {
    return retryResult
  }

  await emit(retryDecision.reason, 2)
  const directResult = await options.directResponse(retryDecision.reason)
  await emit(retryDecision.reason, 3)
  return directResult
}
