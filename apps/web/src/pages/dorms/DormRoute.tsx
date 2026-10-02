import { configureDormServices, DormLayoutBridge, DormRoutes } from "@iguide/dorm"
import React, { useMemo } from "react"

import { useAuth } from "../../contexts/AuthContext"
import { useLayout } from "../../contexts/LayoutContext"
import { streamChatResponse } from "../../services/ai"
import { supabase } from "../../services/supabase"
import { Language } from "../../types"

// This module is lazy-loaded with the /dorms route, so the dorm package and its
// services are wired up only when someone opens a dorm page.
configureDormServices({ supabase, streamChatResponse })

const DormRoute: React.FC<{ language: Language }> = ({ language }) => {
  const { user, requestLogin } = useAuth()
  const {
    isSidebarOpen,
    favoritesIconRef,
    sidebarToggleButtonRef,
    mobileSidebarButtonRef,
    setMobileHeaderSlot,
    setSidebarSlot,
  } = useLayout()

  const layout = useMemo<DormLayoutBridge>(
    () => ({
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      setMobileHeaderSlot,
      setSidebarSlot,
    }),
    [
      isSidebarOpen,
      favoritesIconRef,
      sidebarToggleButtonRef,
      mobileSidebarButtonRef,
      setMobileHeaderSlot,
      setSidebarSlot,
    ],
  )

  return <DormRoutes language={language} user={user} requestLogin={requestLogin} layout={layout} />
}

export default DormRoute
