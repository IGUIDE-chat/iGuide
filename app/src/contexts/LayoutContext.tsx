/**
 * @file ./src/contexts/LayoutContext.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, {
  type ReactNode,
  type RefObject,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

interface LayoutContextType {
  isSidebarOpen: boolean
  /** Ref for the sidebar favorites heart icon SVG (flying-heart target when sidebar open) */
  favoritesIconRef: RefObject<SVGSVGElement | null>
  /** Ref for the desktop sidebar toggle button (flying-heart target when sidebar closed, md+) */
  sidebarToggleButtonRef: RefObject<HTMLButtonElement | null>
  /** Ref for the mobile sidebar toggle button (flying-heart target when sidebar closed, &lt;md) */
  mobileSidebarButtonRef: RefObject<HTMLButtonElement | null>
  /** Custom mobile header slot — when set, replaces the default mobileHeader content */
  mobileHeaderSlot: ReactNode | null
  setMobileHeaderSlot: (node: ReactNode | null) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export const LayoutProvider: React.FC<{
  children: ReactNode
  isSidebarOpen: boolean
  favoritesIconRef: RefObject<SVGSVGElement | null>
  sidebarToggleButtonRef: RefObject<HTMLButtonElement | null>
  mobileSidebarButtonRef: RefObject<HTMLButtonElement | null>
}> = ({
  children,
  isSidebarOpen,
  favoritesIconRef,
  sidebarToggleButtonRef,
  mobileSidebarButtonRef,
}) => {
  const [mobileHeaderSlot, setMobileHeaderSlotState] =
    useState<ReactNode | null>(null)
  const setMobileHeaderSlot = useCallback(
    (node: ReactNode | null) => setMobileHeaderSlotState(node),
    []
  )
  const value = useMemo(
    () => ({
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      mobileHeaderSlot,
      setMobileHeaderSlot,
    }),
    [
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      mobileHeaderSlot,
      setMobileHeaderSlot,
    ]
  )
  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  )
}

const NOOP = () => {
  /* intentional no-op for fallback context */
}

const FALLBACK_LAYOUT: LayoutContextType = {
  isSidebarOpen: true,
  favoritesIconRef: {
    current: null,
  } as React.RefObject<SVGSVGElement | null>,
  sidebarToggleButtonRef: {
    current: null,
  } as React.RefObject<HTMLButtonElement | null>,
  mobileSidebarButtonRef: {
    current: null,
  } as React.RefObject<HTMLButtonElement | null>,
  mobileHeaderSlot: null,
  setMobileHeaderSlot: NOOP,
}

export const useLayout = (): LayoutContextType => {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    return FALLBACK_LAYOUT
  }
  return ctx
}
