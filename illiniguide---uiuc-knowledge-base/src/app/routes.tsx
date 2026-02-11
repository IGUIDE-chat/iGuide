import React from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Language } from '../types';
import ChatPage from '../pages/chat/ChatPage';
import LibraryHomePage from '../pages/library/LibraryHomePage';
import LibraryCategoryPage from '../pages/library/LibraryCategoryPage';
import LibraryArticlePage from '../pages/library/LibraryArticlePage';
import ProfilePage from '../pages/profile/ProfilePage';
import CoursesLandingPage from '../pages/courses/CoursesLandingPage';
import ResumeLandingPage from '../pages/resume/ResumeLandingPage';
import DormListPage from '../pages/dorms/DormListPage';
import DormDetailPage from '../pages/dorms/DormDetailPage';

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
  return (
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
  );
};
