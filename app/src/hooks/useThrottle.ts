import { useCallback, useRef } from "react"

export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const throttledFn = useCallback(
    (...args: unknown[]) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        lastRun.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(
          () => {
            lastRun.current = Date.now()
            callback(...args)
          },
          delay - (now - lastRun.current)
        )
      }
    },
    [callback, delay]
  )

  return throttledFn as unknown as T
}
