import { useRef, useCallback } from "react";

export const useThrottle = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const throttledFn = useCallback(
    (...args: unknown[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );

  return throttledFn as T;
};
