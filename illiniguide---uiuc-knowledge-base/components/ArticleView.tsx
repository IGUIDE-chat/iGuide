import React from 'react';
import { Article, Language } from '../types';
import { CATEGORIES, getArticleText, getCategoryText, UI_TEXT } from '../constants';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  language: Language;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, language }) => {
  const category = CATEGORIES.find(c => c.id === article.category);
  const t = UI_TEXT[language];

  // Get localized content
  const articleText = getArticleText(article, language);
  const categoryText = category ? getCategoryText(category, language) : null;

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        ← {t.backToBrowse}
      </button>

      <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            {category && categoryText && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                {category.icon} {categoryText.label}
              </span>
            )}
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              {t.updated} {article.lastUpdated}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
            {articleText.title}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed border-l-2 border-illini-orange pl-4 italic bg-slate-50 py-2 rounded-r-md">
            {articleText.summary}
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-illini-blue prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
          <div className="whitespace-pre-line">
            {articleText.content}
          </div>
        </div>

        {/* Footer Tags */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t.relatedTopics}:</span>
          <div className="flex flex-wrap gap-2">
            {articleText.tags.map(tag => (
              <span key={tag} className="text-xs text-slate-500 hover:text-illini-blue cursor-default">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};