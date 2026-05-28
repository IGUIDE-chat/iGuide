/**
 * @file ./src/components/library/ArticleView.tsx
 * @description Library feature UI
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [COMPONENT] Renders a single knowledge base article with Markdown support.
// [组件] 支持 Markdown 的知识库文章渲染组件。
import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { type Article, type Language } from "../../types"
import { CATEGORIES, getArticleText, getCategoryText } from "../../constants"
import { UI_TEXT } from "../../i18n/uiText"

interface ArticleViewProps {
  article: Article
  onBack: () => void
  onSearch: (query: string) => void
  language: Language
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onBack,
  onSearch,
  language,
}) => {
  const category = CATEGORIES.find((c) => c.id === article.category)
  const t = UI_TEXT[language]

  // Get localized content
  const articleText = getArticleText(article, language)
  const categoryText = category ? getCategoryText(category, language) : null

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        ← {t.backToBrowse}
      </button>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Header Section */}
        <div className="border-b border-slate-100 bg-white p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            {category && categoryText && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {category.icon} {categoryText.label}
              </span>
            )}
            <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              {t.updated} {article.lastUpdated}
            </span>
          </div>

          <h1 className="mb-4 text-2xl/tight font-bold text-slate-900 sm:text-3xl">
            {articleText.title}
          </h1>

          <p className="border-illini-orange rounded-r-md border-l-2 bg-slate-50 py-2 pl-4 text-base/relaxed text-slate-600 italic">
            {articleText.summary}
          </p>
        </div>

        {/* Content Section */}
        <div className="prose prose-slate prose-sm sm:prose-base prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-illini-blue prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl max-w-none p-6 whitespace-pre-wrap sm:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  className="text-illini-orange hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              ul: ({ ...props }) => (
                <ul
                  className="my-2 list-inside list-disc space-y-1"
                  {...props}
                />
              ),
              ol: ({ ...props }) => (
                <ol
                  className="my-2 list-inside list-decimal space-y-1"
                  {...props}
                />
              ),
              li: ({ ...props }) => (
                <li className="marker:text-slate-400" {...props} />
              ),
              p: ({ ...props }) => (
                <p className="mb-4 leading-relaxed last:mb-0" {...props} />
              ),
              h1: ({ ...props }) => (
                <h1
                  className="mt-6 mb-3 text-2xl font-bold text-slate-900"
                  {...props}
                />
              ),
              h2: ({ ...props }) => (
                <h2
                  className="mt-5 mb-2 text-xl font-bold text-slate-800"
                  {...props}
                />
              ),
              h3: ({ ...props }) => (
                <h3
                  className="mt-4 mb-2 text-lg font-bold text-slate-800"
                  {...props}
                />
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  className="border-illini-blue my-4 rounded-r border-l-4 bg-slate-50 py-2 pl-4 italic"
                  {...props}
                />
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className
                return isInline ? (
                  <code
                    className="text-illini-blue rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="my-3 block overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-3 font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              img: ({ ...props }) => (
                <img
                  {...props}
                  className="my-4 h-auto max-w-full rounded-xl border border-slate-200 shadow-sm"
                  loading="lazy"
                />
              ),
            }}
          >
            {articleText.content}
          </ReactMarkdown>
        </div>

        {/* Footer Tags */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            {t.relatedTopics}:
          </span>
          <div className="flex flex-wrap gap-2">
            {articleText.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSearch(tag)}
                className="hover:text-illini-blue cursor-pointer text-xs text-slate-500 transition-colors hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
