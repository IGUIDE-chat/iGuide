import React, { Suspense } from "react"
import { createPortal } from "react-dom"
import { Navigate, Route, Routes, useMatch } from "react-router-dom"

import { CompareProvider } from "../../components/housing/store/CompareContext"
import { DormDataProvider } from "../../components/housing/store/DormDataContext"
import { DormUserInteractionProvider } from "../../components/housing/store/DormUserInteractionContext"
import { HousingProvider } from "../../components/housing/store/HousingContext"
import { DormSidebar } from "../../components/layout/DormSidebar"
import { useShellSlot } from "../../components/layout/useShellSlot"
import { useLayout } from "../../contexts/LayoutContext"
import { Language } from "../../types"

import "../../components/housing/dorm.css"

const DormListPage = React.lazy(() => import("./DormListPage"))
const DormDetailPage = React.lazy(() => import("./DormDetailPage"))

/**
 * The shell's sidebar lives outside this route tree, so the dorm sidebar is
 * portaled into the slot the shell reserves for it. It still renders from here,
 * inside the dorm providers, which is what lets it read the same dorm state the
 * pages do.
 */
const DormSidebarPortal: React.FC<{ language: Language }> = ({ language }) => {
  const { setSidebarSlot, favoritesIconRef } = useLayout()
  const target = useShellSlot(setSidebarSlot)
  const detailMatch = useMatch("/dorms/:id")
  if (!target) return null
  return createPortal(
    <DormSidebar
      language={language}
      currentDormId={detailMatch?.params.id}
      favoritesIconRef={favoritesIconRef}
    />,
    target,
  )
}

/**
 * Everything under `/dorms`. Mount it at `/dorms/*`.
 *
 * Dorm state (data, filters, compare, favorites) lives and dies with this tree,
 * so no other page pays for it; `useRetainedState` is what brings it back on a
 * later visit. This module is lazy-loaded with the route, so no other page
 * loads dorm code.
 */
const DormRoute: React.FC<{ language: Language }> = ({ language }) => {
  const loadingText = language === "zh" ? "页面加载中..." : "Loading page..."

  return (
    <DormDataProvider>
      <CompareProvider>
        <HousingProvider>
          <DormUserInteractionProvider>
            <DormSidebarPortal language={language} />
            <Suspense
              fallback={<div className="p-6 text-center text-slate-600">{loadingText}</div>}
            >
              <Routes>
                <Route index element={<DormListPage language={language} />} />
                <Route path=":id" element={<DormDetailPage language={language} />} />
                <Route path="*" element={<Navigate to="/dorms" replace />} />
              </Routes>
            </Suspense>
          </DormUserInteractionProvider>
        </HousingProvider>
      </CompareProvider>
    </DormDataProvider>
  )
}

export default DormRoute
