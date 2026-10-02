import { ReactNode, useLayoutEffect, useState } from "react"

/**
 * Claims a slot in the host shell and returns a DOM node to portal into.
 *
 * Nodes handed to a shell slot render in the shell's tree, out of reach of the
 * dorm providers. Portaling into a placeholder instead keeps dorm context and
 * state, and `contents` lets the portaled children lay out as the slot's own.
 * The layout effect fills the slot before paint, so the shell default never
 * flashes.
 */
export const useShellSlot = (setSlot: (node: ReactNode | null) => void): HTMLElement | null => {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    setSlot(<div ref={setTarget} className="contents" />)
    return () => setSlot(null)
  }, [setSlot])

  return target
}
