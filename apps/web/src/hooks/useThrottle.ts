import { useRef, useCallback } from "react"

export const useThrottle = <T extends (...args: any[]) => void>(callback: T, delay: number): T => {
  const lastRun = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const throttledFn = useCallback(
    (...args: any[]) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        // A trailing call can still be pending when its timer fires late (e.g. a
        // busy render). Drop it, or it would replay older args after these.
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        lastRun.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(
          () => {
            lastRun.current = Date.now()
            callback(...args)
          },
          delay - (now - lastRun.current),
        )
      }
    },
    [callback, delay],
  )

  return throttledFn as unknown as T
}
