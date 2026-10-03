import React, {
  createContext,
  useContext,
  ReactNode,
  RefObject,
  useState,
  useCallback,
  useMemo,
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
  /** Feature-owned sidebar content, rendered below the primary nav while set */
  sidebarSlot: ReactNode | null
  setSidebarSlot: (node: ReactNode | null) => void
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
  const [mobileHeaderSlot, setMobileHeaderSlotState] = useState<ReactNode | null>(null)
  const setMobileHeaderSlot = useCallback(
    (node: ReactNode | null) => setMobileHeaderSlotState(node),
    [],
  )
  const [sidebarSlot, setSidebarSlotState] = useState<ReactNode | null>(null)
  const setSidebarSlot = useCallback((node: ReactNode | null) => setSidebarSlotState(node), [])
  const value = useMemo<LayoutContextType>(
    () => ({
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      mobileHeaderSlot,
      setMobileHeaderSlot,
      sidebarSlot,
      setSidebarSlot,
    }),
    [
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      mobileHeaderSlot,
      setMobileHeaderSlot,
      sidebarSlot,
      setSidebarSlot,
    ],
  )
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export const useLayout = (): LayoutContextType => {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    return {
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
      setMobileHeaderSlot: () => {},
      sidebarSlot: null,
      setSidebarSlot: () => {},
    }
  }
  return ctx
}
