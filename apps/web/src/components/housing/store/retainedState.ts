import { Dispatch, SetStateAction, useEffect, useState } from "react"

// Lives as long as the page: dorm providers unmount when the user leaves
// /dorms, and this is what brings their state back on return. A reload clears it.
const retained = new Map<string, unknown>()

/** `useState` whose latest value is restored the next time a component with the same key mounts. */
export const useRetainedState = <T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    if (retained.has(key)) return retained.get(key) as T
    return typeof initial === "function" ? (initial as () => T)() : initial
  })

  useEffect(() => {
    retained.set(key, value)
  }, [key, value])

  return [value, setValue]
}
