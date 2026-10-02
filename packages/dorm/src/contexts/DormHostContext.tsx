import React, { createContext, ReactNode, RefObject, useContext } from "react"

/** The signed-in user fields dorm features read. The host's user type is a superset. */
export interface DormUser {
  id: string
  email: string
  isAdmin: boolean
}

/** The parts of the host shell the dorm UI drives. */
export interface DormLayoutBridge {
  isSidebarOpen: boolean
  /** Flying-heart target while the sidebar is open. */
  favoritesIconRef: RefObject<SVGSVGElement | null>
  /** Flying-heart target while the sidebar is closed (md+). */
  sidebarToggleButtonRef: RefObject<HTMLButtonElement | null>
  /** Flying-heart target while the sidebar is closed (<md). */
  mobileSidebarButtonRef: RefObject<HTMLButtonElement | null>
  /** Replaces the shell's mobile header content; null restores the default. */
  setMobileHeaderSlot: (node: ReactNode | null) => void
  /** Adds content below the shell's primary nav; null removes it. */
  setSidebarSlot: (node: ReactNode | null) => void
}

export interface DormHost {
  user: DormUser | null
  /** Sends a guest to the host's login screen. */
  requestLogin: () => void
  layout: DormLayoutBridge
}

const DormHostContext = createContext<DormHost | null>(null)

export const DormHostProvider: React.FC<{ value: DormHost; children: ReactNode }> = ({
  value,
  children,
}) => <DormHostContext.Provider value={value}>{children}</DormHostContext.Provider>

const useDormHost = (): DormHost => {
  const ctx = useContext(DormHostContext)
  if (!ctx) {
    throw new Error("@iguide/dorm: dorm components must render inside DormRoutes")
  }
  return ctx
}

export const useAuth = (): Pick<DormHost, "user" | "requestLogin"> => {
  const { user, requestLogin } = useDormHost()
  return { user, requestLogin }
}

export const useLayout = (): DormLayoutBridge => useDormHost().layout
