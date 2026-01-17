import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ArticleView } from './components/ArticleView';
import { ChatScreen } from './components/ChatScreen';
import { LoginScreen } from './components/LoginScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AgentLandingPage } from './components/AgentLandingPage';
import { CATEGORIES, ARTICLES, getArticleText, getCategoryText, UI_TEXT } from './constants';
import { CategoryId, Language } from './types';
import { useAuth } from './contexts/AuthContext';
import { libraryService } from './services/libraryService';

// --- Page Components ---

const LibraryPage = ({ language }: { language: Language }) => {
  const t = UI_TEXT[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const navigate = useNavigate();

  const localizedArticles = useMemo(() => {
    return ARTICLES.map(a => ({
      ...a,
      ...getArticleText(a, language)
    }));
  }, [language]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return localizedArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, localizedArticles]);

  const setSearchQuery = (query: string) => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="h-full overflow-y-auto w-full animate-fade-in-up no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="text-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={language}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{t.knowledgeBaseTitle}</h2>
              <p className="text-slate-500 text-base mb-8 max-w-2xl mx-auto">
                {t.knowledgeBaseSubtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Library Search */}
          <div className="max-w-xl mx-auto relative mb-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-illini-blue to-illini-orange opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity"></div>
            <input
              type="text"
              className="relative block w-full pl-5 pr-5 py-3.5 bg-white border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/10 focus:border-slate-300 shadow-md shadow-slate-200/50 transition-all text-base"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {searchQuery ? (
          <div className="animate-fade-in-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {t.searchTitle} <span className="text-illini-orange">"{searchQuery}"</span>
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-slate-500 hover:text-illini-blue px-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                {t.clear}
              </button>
            </div>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white/50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-500 text-base">{t.noResults}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArticles.map((article) => {
                  const cat = CATEGORIES.find(c => c.id === article.category);
                  const catText = cat ? getCategoryText(cat, language) : null;
                  return (
                    <div
                      key={article.id}
                      onClick={() => navigate(`/library/article/${article.id}`)}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-illini-blue/20 cursor-pointer transition-all duration-300 group"
                    >
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 mb-4 group-hover:bg-illini-blue/10 group-hover:text-illini-blue transition-colors">
                        {catText?.label}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-illini-blue transition-colors leading-tight">{article.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{article.summary}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CATEGORIES.map((category) => {
              const categoryText = getCategoryText(category, language);
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(`/library/category/${category.id}`)}
                  className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-illini-blue group-hover:text-white transition-colors duration-300 shadow-inner">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-illini-blue transition-colors">{categoryText.label}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {categoryText.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryPage = ({ language }: { language: Language }) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const t = UI_TEXT[language];

  // Cast categoryId to known type for safety if needed, or simple find
  const category = CATEGORIES.find(c => c.id === categoryId);
  const localizedArticles = useMemo(() => {
    return ARTICLES.map(a => ({
      ...a,
      ...getArticleText(a, language)
    }));
  }, [language]);

  if (!category) {
    return <div className="p-8 text-center text-slate-500">Category not found</div>;
  }

  const categoryArticles = localizedArticles.filter(a => a.category === categoryId);
  const categoryText = getCategoryText(category, language);

  return (
    <div className="h-full overflow-y-auto w-full animate-fade-in-up no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <button
          onClick={() => navigate('/library')}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-illini-blue transition-colors group"
        >
          <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-illini-blue group-hover:text-white group-hover:border-illini-blue transition-all">←</span>
          {t.backToCategories}
        </button>

        <div className="glass-card p-8 rounded-2xl mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden">
          {/* Decorative Background Blob */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-illini-orange/20 to-illini-blue/20 blur-3xl rounded-full pointer-events-none"></div>

          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md z-10">
            {category.icon}
          </div>
          <div className="z-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{categoryText.label}</h2>
            <p className="text-slate-600 text-base leading-relaxed max-w-2xl">{categoryText.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categoryArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/library/article/${article.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-illini-orange/30 cursor-pointer transition-all duration-300 group"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-illini-orange transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{article.summary}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-illini-blue opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                {t.readGuide}
              </div>
            </div>
          ))}
          {categoryArticles.length === 0 && (
            <p className="text-slate-500 italic">{t.emptyCategory}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticlePage = ({ language }: { language: Language }) => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const article = ARTICLES.find(a => a.id === articleId);

  useEffect(() => {
    if (article) {
      libraryService.addToHistory(article);
    }
  }, [article]);

  if (!article) {
    return <div className="p-8 text-center text-slate-500">Article not found</div>;
  }

  return (
    <div className="h-full overflow-y-auto w-full no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <ArticleView
          article={article}
          onBack={() => navigate('/library')}
          onSearch={(query) => {
            navigate(`/library?q=${encodeURIComponent(query)}`);
          }}
          language={language}
        />
      </div>
    </div>
  );
};

export default function App() {
  const { user, isLoading } = useAuth();
  // Initialize language from browser preference
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith('zh') ? 'zh' : 'en';
    }
    return 'zh';
  });
  const [isGuest, setIsGuest] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Sync guest state with user auth status
  useEffect(() => {
    if (user) {
      setIsGuest(false);
    }
  }, [user]);

  // Load last conversation on mount
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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-illini-blue/10 via-white to-illini-orange/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-illini-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full w-full"
        >
          <Layout
            language={language}
            onLanguageChange={setLanguage}
            isGuest={isGuest}
            onExitGuest={() => setIsGuest(false)}
            currentConversationId={currentConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route
                path="/chat"
                element={
                  <ChatScreen
                    onNavigateToLibrary={() => { /* Navigation handled by Layout link, but can add check here if needed */ }}
                    language={language}
                    currentConversationId={currentConversationId}
                    onConversationCreated={setCurrentConversationId}
                  />
                }
              />
              <Route path="/library" element={<LibraryPage language={language} />} />
              <Route path="/library/category/:categoryId" element={<CategoryPage language={language} />} />
              <Route path="/library/article/:articleId" element={<ArticlePage language={language} />} />
              <Route path="/profile" element={<ProfileScreen language={language} onBack={() => window.history.back()} />} />

              {/* Agent Landing Pages */}
              <Route path="/courses" element={<AgentLandingPage type="courses" language={language} />} />
              <Route path="/dorms" element={<AgentLandingPage type="dorms" language={language} />} />
              <Route path="/resume" element={<AgentLandingPage type="resume" language={language} />} />
            </Routes>
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}