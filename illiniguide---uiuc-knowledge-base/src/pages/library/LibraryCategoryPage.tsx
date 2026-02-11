import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ARTICLES, CATEGORIES, getArticleText, getCategoryText, UI_TEXT } from '../../constants';
import { Language } from '../../types';

interface LibraryCategoryPageProps {
  language: Language;
}

const LibraryCategoryPage: React.FC<LibraryCategoryPageProps> = ({ language }) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const t = UI_TEXT[language];

  const category = CATEGORIES.find((item) => item.id === categoryId);
  const localizedArticles = useMemo(() => {
    return ARTICLES.map((article) => ({
      ...article,
      ...getArticleText(article, language),
    }));
  }, [language]);

  if (!category) {
    return <div className="p-8 text-center text-slate-500">Category not found</div>;
  }

  const categoryArticles = localizedArticles.filter((item) => item.category === categoryId);
  const categoryText = getCategoryText(category, language);

  return (
    <div className="h-full overflow-y-auto w-full animate-fade-in-up no-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-illini-blue transition-colors group"
        >
          <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-illini-blue group-hover:text-white group-hover:border-illini-blue transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          {t.backToCategories}
        </button>

        <div className="glass-card p-8 rounded-2xl mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-illini-orange/20 to-illini-blue/20 blur-3xl rounded-full pointer-events-none" />

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
          {categoryArticles.length === 0 && <p className="text-slate-500 italic">{t.emptyCategory}</p>}
        </div>
      </div>
    </div>
  );
};

export default LibraryCategoryPage;
