/**
 * @file ./src/app/routes.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Language } from '../types';

const ChatPage = React.lazy(() => import('../pages/chat/ChatPage'));
const LibraryHomePage = React.lazy(() => import('../pages/library/LibraryHomePage'));
const LibraryCategoryPage = React.lazy(() => import('../pages/library/LibraryCategoryPage'));
const LibraryArticlePage = React.lazy(() => import('../pages/library/LibraryArticlePage'));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage'));
const CoursesLandingPage = React.lazy(() => import('../pages/courses/CoursesLandingPage'));
const ResumeLandingPage = React.lazy(() => import('../pages/resume/ResumeLandingPage'));
const DormListPage = React.lazy(() => import('../pages/dorms/DormListPage'));
const DormDetailPage = React.lazy(() => import('../pages/dorms/DormDetailPage'));

export interface AppRoutesProps {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated: (conversationId: string) => void;
}

const LegacyDormRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/dorms/${id}` : '/dorms'} replace />;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  language,
  currentConversationId,
  onConversationCreated,
}) => {
  const loadingText = language === 'zh' ? '页面加载中...' : 'Loading page...';

  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-600">{loadingText}</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route
          path="/chat"
          element={
            <ChatPage
              language={language}
              currentConversationId={currentConversationId}
              onConversationCreated={onConversationCreated}
            />
          }
        />
        <Route path="/library" element={<LibraryHomePage language={language} />} />
        <Route path="/library/category/:categoryId" element={<LibraryCategoryPage language={language} />} />
        <Route path="/library/article/:articleId" element={<LibraryArticlePage language={language} />} />
        <Route path="/profile" element={<ProfilePage language={language} />} />
        <Route path="/courses" element={<CoursesLandingPage language={language} />} />
        <Route path="/resume" element={<ResumeLandingPage language={language} />} />
        <Route path="/dorms" element={<DormListPage language={language} />} />
        <Route path="/dorms/:id" element={<DormDetailPage language={language} />} />
        <Route path="/dorm/:id" element={<LegacyDormRedirect />} />
      </Routes>
    </Suspense>
  );
};
