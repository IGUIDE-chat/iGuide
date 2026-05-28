/**
 * @file ./src/pages/library/LibraryHomePage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ARTICLES,
  CATEGORIES,
  getArticleText,
  getCategoryText,
} from "../../constants"
import { UI_TEXT } from "../../i18n/uiText"
import { type Language } from "../../types"

interface LibraryHomePageProps {
  language: Language
}

const LibraryHomePage: React.FC<LibraryHomePageProps> = ({ language }) => {
  const t = UI_TEXT[language]
  const navigate = useNavigate()
  const [localQuery, setLocalQuery] = useState("")

  const localizedArticles = useMemo(() => {
    return ARTICLES.map((article) => {
      const text = getArticleText(article, language)
      return Object.assign({}, article, text)
    })
  }, [language])

  const filteredArticles = useMemo(() => {
    if (!localQuery) {
      return []
    }
    const query = localQuery.toLowerCase()
    return localizedArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [localQuery, localizedArticles])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setLocalQuery(e.target.value),
    []
  )

  const handleClearSearch = useCallback(() => setLocalQuery(""), [])

  const handleArticleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const articleId = e.currentTarget.dataset.articleId
      if (articleId) {
        navigate(`/library/article/${articleId}`)
      }
    },
    [navigate]
  )

  const handleCategoryClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const categoryId = e.currentTarget.dataset.categoryId
      if (categoryId) {
        navigate(`/library/category/${categoryId}`)
      }
    },
    [navigate]
  )

  return (
    <div className="animate-fade-in-up no-scrollbar size-full min-w-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl min-w-0 px-4 py-8 pb-24">
        <div className="py-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
            {t.knowledgeBaseTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-slate-500">
            {t.knowledgeBaseSubtitle}
          </p>

          <div className="relative mx-auto mb-16 max-w-xl">
            <input
              type="text"
              aria-label={t.searchPlaceholder}
              className="focus:ring-illini-blue/10 block w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 text-base text-slate-900 placeholder-slate-400 shadow-sm shadow-slate-200/50 transition-all hover:shadow-md focus:border-slate-300 focus:ring-2 focus:outline-none"
              placeholder={t.searchPlaceholder}
              value={localQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {localQuery ? (
          <div className="animate-fade-in-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {t.searchTitle}{" "}
                <span className="text-illini-orange">
                  &quot;{localQuery}&quot;
                </span>
              </h2>
              <button
                type="button"
                onClick={handleClearSearch}
                className="hover:text-illini-blue rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
              >
                {t.clear}
              </button>
            </div>
            {filteredArticles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 py-16 text-center">
                <p className="text-base text-slate-500">{t.noResults}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArticles.map((article) => {
                  const category = CATEGORIES.find(
                    (item) => item.id === article.category
                  )
                  const categoryText = category
                    ? getCategoryText(category, language)
                    : null
                  return (
                    <button
                      type="button"
                      key={article.id}
                      data-article-id={article.id}
                      onClick={handleArticleClick}
                      className="group hover:border-illini-blue/20 cursor-pointer rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
                    >
                      <span className="group-hover:bg-illini-blue/10 group-hover:text-illini-blue mb-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-colors">
                        {categoryText?.label}
                      </span>
                      <h3 className="group-hover:text-illini-blue mb-3 text-lg/tight font-bold text-slate-900 transition-colors">
                        {article.title}
                      </h3>
                      <p className="line-clamp-3 text-sm/relaxed text-slate-500">
                        {article.summary}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {CATEGORIES.map((category) => {
              const categoryText = getCategoryText(category, language)
              return (
                <button
                  type="button"
                  key={category.id}
                  data-category-id={category.id}
                  onClick={handleCategoryClick}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-200/50"
                >
                  <div className="group-hover:bg-illini-blue mb-6 flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-3xl shadow-inner transition-colors duration-300 group-hover:text-white">
                    {category.icon}
                  </div>
                  <h3 className="group-hover:text-illini-blue mb-3 text-xl font-bold text-slate-900 transition-colors">
                    {categoryText.label}
                  </h3>
                  <p className="text-sm/relaxed text-slate-500">
                    {categoryText.description}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default LibraryHomePage
