// [COMPONENT] Renders a single knowledge base article with Markdown support.
// [组件] 支持 Markdown 的知识库文章渲染组件。
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Article, Language } from '../types';
import { CATEGORIES, getArticleText, getCategoryText, UI_TEXT } from '../constants';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onSearch: (query: string) => void;
  language: Language;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onSearch, language }) => {
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
        <div className="p-6 sm:p-8 prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-illini-blue prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl whitespace-pre-wrap">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a {...props} className="text-illini-orange hover:underline" target="_blank" rel="noopener noreferrer" />
              ),
              ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
              li: ({ node, ...props }) => <li className="marker:text-slate-400" {...props} />,
              p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-slate-900" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-2 text-slate-800" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-slate-800" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-illini-blue pl-4 italic my-4 bg-slate-50 py-2 rounded-r" {...props} />,
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-illini-blue" {...props}>{children}</code>
                ) : (
                  <code className="block bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto font-mono my-3 border border-slate-200" {...props}>{children}</code>
                );
              },
              img: ({ node, ...props }) => (
                <img
                  {...props}
                  className="rounded-xl shadow-sm max-w-full h-auto my-4 border border-slate-200"
                  loading="lazy"
                />
              ),
            }}
          >
            {articleText.content}
          </ReactMarkdown>
        </div>

        {/* Footer Tags */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t.relatedTopics}:</span>
          <div className="flex flex-wrap gap-2">
            {articleText.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onSearch(tag)}
                className="text-xs text-slate-500 hover:text-illini-blue hover:underline cursor-pointer transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};