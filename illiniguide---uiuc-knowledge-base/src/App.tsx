import * as React from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';
import { AppRoutes } from './app/routes';
import { useAuth } from './contexts/AuthContext';
import { HousingProvider } from './contexts/HousingContext';
import { DormUserInteractionProvider } from './contexts/DormUserInteractionContext';
import { Language } from './types';

export default function App() {
  const { user, isLoading } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith('zh') ? 'zh' : 'en';
    }
    return 'zh';
  });
  const [isGuest, setIsGuest] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsGuest(false);
    }
  }, [user]);

  useEffect(() => {
    const lastId = localStorage.getItem('lastConversationId');
    if (lastId && !isGuest) {
      setCurrentConversationId(lastId);
    }
  }, [isGuest]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      localStorage.setItem('lastConversationId', conversationId);
    } else {
      localStorage.removeItem('lastConversationId');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-illini-blue/10 via-white to-illini-orange/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-illini-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const showLogin = !user && !isGuest;

  return (
    <AnimatePresence mode="wait">
      {showLogin ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          <LoginScreen
            onGuestLogin={() => setIsGuest(true)}
            language={language}
            onLanguageChange={setLanguage}
          />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full w-full"
        >
          <HousingProvider>
            <DormUserInteractionProvider>
              <Layout
                language={language}
                onLanguageChange={setLanguage}
                isGuest={isGuest}
                onExitGuest={() => setIsGuest(false)}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onSelectConversation={handleSelectConversation}
              >
                <AppRoutes
                  language={language}
                  currentConversationId={currentConversationId}
                  onConversationCreated={setCurrentConversationId}
                />
              </Layout>
            </DormUserInteractionProvider>
          </HousingProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
