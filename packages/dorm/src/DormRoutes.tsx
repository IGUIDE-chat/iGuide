import React, { Suspense, useMemo } from "react"
import { createPortal } from "react-dom"
import { Navigate, Route, Routes, useMatch } from "react-router-dom"

import { CompareProvider } from "./components/housing/store/CompareContext"
import { DormDataProvider } from "./components/housing/store/DormDataContext"
import { DormUserInteractionProvider } from "./components/housing/store/DormUserInteractionContext"
import { HousingProvider } from "./components/housing/store/HousingContext"
import { DormSidebar } from "./components/layout/DormSidebar"
import { useShellSlot } from "./components/layout/useShellSlot"
import { DormHost, DormHostProvider, useLayout } from "./contexts/DormHostContext"
import { Language } from "./types"

import "./dorm.css"

const DormListPage = React.lazy(() => import("./pages/dorms/DormListPage"))
const DormDetailPage = React.lazy(() => import("./pages/dorms/DormDetailPage"))

export interface DormRoutesProps extends DormHost {
  language: Language
}

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
 * so no other page pays for it.
 */
export const DormRoutes: React.FC<DormRoutesProps> = ({ language, user, requestLogin, layout }) => {
  const host = useMemo(() => ({ user, requestLogin, layout }), [user, requestLogin, layout])
  const loadingText = language === "zh" ? "页面加载中..." : "Loading page..."

  return (
    <DormHostProvider value={host}>
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
    </DormHostProvider>
  )
}
