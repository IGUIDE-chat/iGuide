import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARTICLES, CATEGORIES, getArticleText, getCategoryText } from '../../constants';
import { UI_TEXT } from '../../i18n/uiText';
import { Language } from '../../types';

interface LibraryHomePageProps {
  language: Language;
}

const LibraryHomePage: React.FC<LibraryHomePageProps> = ({ language }) => {
  const t = UI_TEXT[language];
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState('');

  const localizedArticles = useMemo(() => {
    return ARTICLES.map((article) => ({
      ...article,
      ...getArticleText(article, language),
    }));
  }, [language]);

  const filteredArticles = useMemo(() => {
    if (!localQuery) return [];
    const query = localQuery.toLowerCase();
    return localizedArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [localQuery, localizedArticles]);

  return (
    <div className="h-full overflow-y-auto w-full animate-fade-in-up no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="text-center py-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{t.knowledgeBaseTitle}</h2>
          <p className="text-slate-500 text-base mb-8 max-w-2xl mx-auto">{t.knowledgeBaseSubtitle}</p>

          <div className="max-w-xl mx-auto relative mb-16">
            <input
              type="text"
              className="block w-full pl-5 pr-5 py-3.5 bg-white border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/10 focus:border-slate-300 shadow-sm shadow-slate-200/50 transition-all text-base hover:shadow-md"
              placeholder={t.searchPlaceholder}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </div>
        </div>

        {localQuery ? (
          <div className="animate-fade-in-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {t.searchTitle} <span className="text-illini-orange">"{localQuery}"</span>
              </h2>
              <button
                type="button"
                onClick={() => setLocalQuery('')}
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
                  const category = CATEGORIES.find((item) => item.id === article.category);
                  const categoryText = category ? getCategoryText(category, language) : null;
                  return (
                    <div
                      key={article.id}
                      onClick={() => navigate(`/library/article/${article.id}`)}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-illini-blue/20 cursor-pointer transition-all duration-300 group"
                    >
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 mb-4 group-hover:bg-illini-blue/10 group-hover:text-illini-blue transition-colors">
                        {categoryText?.label}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-illini-blue transition-colors leading-tight">
                        {article.title}
                      </h3>
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
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-illini-blue transition-colors">
                    {categoryText.label}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{categoryText.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryHomePage;
