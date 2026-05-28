/**
 * @file ./src/app/routes.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { Suspense, useMemo } from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { type Language } from "../types"

const ChatPage = React.lazy(() => import("../pages/chat/ChatPage"))
const LibraryHomePage = React.lazy(
  () => import("../pages/library/LibraryHomePage")
)
const LibraryCategoryPage = React.lazy(
  () => import("../pages/library/LibraryCategoryPage")
)
const LibraryArticlePage = React.lazy(
  () => import("../pages/library/LibraryArticlePage")
)
const ProfilePage = React.lazy(() => import("../pages/profile/ProfilePage"))
const CoursesLandingPage = React.lazy(
  () => import("../pages/courses/CoursesLandingPage")
)
const ResumeLandingPage = React.lazy(
  () => import("../pages/resume/ResumeLandingPage")
)
const DormListPage = React.lazy(() => import("../pages/dorms/DormListPage"))
const DormDetailPage = React.lazy(() => import("../pages/dorms/DormDetailPage"))

export interface AppRoutesProps {
  language: Language
  currentConversationId: string | null
  onConversationCreated: (conversationId: string) => void
}

const LegacyDormRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? `/dorms/${id}` : "/dorms"} replace />
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  language,
  currentConversationId,
  onConversationCreated,
}) => {
  const loadingText = language === "zh" ? "页面加载中..." : "Loading page..."

  const fallbackEl = useMemo(
    () => (
      <div className="p-6 text-center text-slate-600">{loadingText}</div>
    ),
    [loadingText]
  )

  const navigateHome = useMemo(() => <Navigate to="/chat" replace />, [])
  const chatEl = useMemo(
    () => (
      <ChatPage
        language={language}
        currentConversationId={currentConversationId}
        onConversationCreated={onConversationCreated}
      />
    ),
    [language, currentConversationId, onConversationCreated]
  )
  const libraryEl = useMemo(
    () => <LibraryHomePage language={language} />,
    [language]
  )
  const libraryCategoryEl = useMemo(
    () => <LibraryCategoryPage language={language} />,
    [language]
  )
  const libraryArticleEl = useMemo(
    () => <LibraryArticlePage language={language} />,
    [language]
  )
  const profileEl = useMemo(
    () => <ProfilePage language={language} />,
    [language]
  )
  const coursesEl = useMemo(
    () => <CoursesLandingPage language={language} />,
    [language]
  )
  const resumeEl = useMemo(
    () => <ResumeLandingPage language={language} />,
    [language]
  )
  const dormListEl = useMemo(
    () => <DormListPage language={language} />,
    [language]
  )
  const dormDetailEl = useMemo(
    () => <DormDetailPage language={language} />,
    [language]
  )
  const legacyRedirectEl = useMemo(() => <LegacyDormRedirect />, [])

  return (
    <Suspense fallback={fallbackEl}>
      <Routes>
        <Route path="/" element={navigateHome} />
        <Route path="/chat" element={chatEl} />
        <Route path="/library" element={libraryEl} />
        <Route path="/library/category/:categoryId" element={libraryCategoryEl} />
        <Route path="/library/article/:articleId" element={libraryArticleEl} />
        <Route path="/profile" element={profileEl} />
        <Route path="/courses" element={coursesEl} />
        <Route path="/resume" element={resumeEl} />
        <Route path="/dorms" element={dormListEl} />
        <Route path="/dorms/:id" element={dormDetailEl} />
        <Route path="/dorm/:id" element={legacyRedirectEl} />
      </Routes>
    </Suspense>
  )
}
