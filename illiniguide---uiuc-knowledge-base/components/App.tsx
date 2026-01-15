import React, { useState, useMemo } from 'react';
import { Layout } from './Layout';
import { ArticleView } from './ArticleView';
import { ChatScreen } from './ChatScreen';
import { Login } from './Login';
import { Register } from './Register';
import { AuthProvider, useAuth } from './AuthContext';
import { CATEGORIES, ARTICLES, getArticleText, getCategoryText, UI_TEXT } from '../constants';
import { ViewState, CategoryId, Language } from '../types';

function AppContent() {
  const { user } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');
  const [libraryState, setLibraryState] = useState<ViewState>({ type: 'HOME' });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 强制默认语言为中文 'zh'
  const [language, setLanguage] = useState<Language>('zh');

  const t = UI_TEXT[language];

  // Helper to get localized article list
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

  const handleCategoryClick = (categoryId: CategoryId) => {
    setLibraryState({ type: 'CATEGORY', categoryId });
    setSearchQuery('');
  };

  const handleArticleClick = (articleId: string) => {
    setLibraryState({ type: 'ARTICLE', articleId });
  };

  const renderLibrary = () => {
    // 统一容器样式：最大宽度 3xl，居中，与 ChatScreen 保持一致
    // pt-14 (3.5rem/56px) to clear the top-left sidebar toggle button
    const containerClass = "w-full max-w-3xl mx-auto px-4 pt-14 pb-20";

    // 1. Article View
    if (libraryState.type === 'ARTICLE') {
      const article = ARTICLES.find(a => a.id === libraryState.articleId);
      if (!article) return <div className={containerClass}>Article not found</div>;
      return (
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className={containerClass}>
            <ArticleView
              article={article}
              onBack={() => setLibraryState({ type: 'HOME' })}
              language={language}
            />
          </div>
        </div>
      );
    }

    // 2. Search View
    if (searchQuery) {
      return (
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className={containerClass}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t.searchTitle} <span className="text-illini-orange">"{searchQuery}"</span>
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              >
                {t.clear}
              </button>
            </div>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 rounded-lg border border-slate-200 border-dashed">
                <p className="text-slate-500 text-sm">{t.noResults}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredArticles.map((article) => {
                  const cat = CATEGORIES.find(c => c.id === article.category);
                  const catText = cat ? getCategoryText(cat, language) : null;
                  return (
                    <div
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                      className="bg-white p-4 rounded-lg border border-slate-200 hover:border-illini-blue/40 cursor-pointer transition-all hover:shadow-sm group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {catText?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-illini-blue transition-colors">{article.title}</h3>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{article.summary}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Category View
    if (libraryState.type === 'CATEGORY') {
      const category = CATEGORIES.find(c => c.id === libraryState.categoryId);
      const categoryArticles = localizedArticles.filter(a => a.category === libraryState.categoryId);
      const categoryText = category ? getCategoryText(category, language) : null;

      return (
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className={containerClass}>
            <button
              onClick={() => setLibraryState({ type: 'HOME' })}
              className="mb-6 text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              ← {t.backToCategories}
            </button>

            <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="text-4xl select-none">
                {category?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{categoryText?.label}</h2>
                <p className="text-slate-600 text-sm">{categoryText?.description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {categoryArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)}
                  className="bg-white p-4 rounded-lg border border-slate-200 hover:border-illini-blue/40 cursor-pointer transition-all hover:shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-xs">{article.summary}</p>
                </div>
              ))}
              {categoryArticles.length === 0 && (
                <p className="text-slate-400 text-sm italic">{t.emptyCategory}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. Library Home
    return (
      <div className="h-full overflow-y-auto no-scrollbar">
        <div className={containerClass}>
          <div className="py-6 mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t.knowledgeBaseTitle}</h2>
            <p className="text-slate-500 text-sm mb-6">
              {t.knowledgeBaseSubtitle}
            </p>

            {/* Compact Search Bar */}
            <div className="relative">
              <input
                type="text"
                className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/10 focus:border-illini-blue transition-all"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((category) => {
              const categoryText = getCategoryText(category, language);
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white p-4 rounded-lg border border-slate-200 hover:border-illini-blue/40 hover:bg-slate-50/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{category.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-illini-blue transition-colors">{categoryText.label}</h3>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 pl-8">
                    {categoryText.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Show login/register if not authenticated
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Show main app if authenticated
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      language={language}
      onLanguageChange={setLanguage}
    >
      {activeTab === 'chat' && (
        <ChatScreen
          onNavigateToLibrary={() => setActiveTab('library')}
          language={language}
        />
      )}
      {activeTab === 'library' && renderLibrary()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}