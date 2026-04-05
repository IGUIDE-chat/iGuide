/**
 * @file ./src/pages/library/LibraryHomePage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ARTICLES,
  CATEGORIES,
  getArticleText,
  getCategoryText,
} from '../../constants'
import { UI_TEXT } from '../../i18n/uiText'
import { Language } from '../../types'

interface LibraryHomePageProps {
  language: Language
}

const LibraryHomePage: React.FC<LibraryHomePageProps> = ({ language }) => {
  const t = UI_TEXT[language]
  const navigate = useNavigate()
  const [localQuery, setLocalQuery] = useState('')

  const localizedArticles = useMemo(() => {
    return ARTICLES.map((article) => ({
      ...article,
      ...getArticleText(article, language),
    }))
  }, [language])

  const filteredArticles = useMemo(() => {
    if (!localQuery) return []
    const query = localQuery.toLowerCase()
    return localizedArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [localQuery, localizedArticles])

  return (
    <div className="
      animate-fade-in-up no-scrollbar min-w-0 size-full overflow-y-auto
    ">
      <div className="min-w-0 max-w-3xl px-4 py-8 pb-24 mx-auto">
        <div className="py-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
            {t.knowledgeBaseTitle}
          </h2>
          <p className="mb-8 max-w-2xl text-base text-slate-500 mx-auto">
            {t.knowledgeBaseSubtitle}
          </p>

          <div className="mb-16 max-w-xl relative mx-auto">
            <input
              type="text"
              className="
                border-slate-200 bg-white py-3.5 pl-5 pr-5 text-base
                text-slate-900 placeholder-slate-400 shadow-sm
                shadow-slate-200/50
                hover:shadow-md
                focus:border-slate-300 focus:ring-illini-blue/10
                block w-full rounded-full border transition-all
                focus:ring-2 focus:outline-none
              "
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
                {t.searchTitle}{' '}
                <span className="text-illini-orange">"{localQuery}"</span>
              </h2>
              <button
                type="button"
                onClick={() => setLocalQuery('')}
                className="
                  px-3 py-1 text-xs font-medium text-slate-500
                  hover:bg-slate-100 hover:text-illini-blue
                  rounded-full transition-colors
                "
              >
                {t.clear}
              </button>
            </div>
            {filteredArticles.length === 0 ? (
              <div className="
                rounded-2xl border-slate-200 bg-white/50 py-16 border
                border-dashed text-center
              ">
                <p className="text-base text-slate-500">{t.noResults}</p>
              </div>
            ) : (
              <div className="gap-4 grid grid-cols-1">
                {filteredArticles.map((article) => {
                  const category = CATEGORIES.find(
                    (item) => item.id === article.category
                  )
                  const categoryText = category
                    ? getCategoryText(category, language)
                    : null
                  return (
                    <div
                      key={article.id}
                      onClick={() => navigate(`/library/article/${article.id}`)}
                      className="
                        group rounded-3xl border-slate-100 bg-white p-6
                        shadow-sm
                        hover:-translate-y-1 hover:border-illini-blue/20
                        hover:shadow-xl hover:shadow-slate-200/50
                        cursor-pointer border transition-all duration-300
                      "
                    >
                      <span className="
                        mb-4 bg-slate-100 px-3 py-1 font-bold tracking-wider
                        text-slate-500
                        group-hover:bg-illini-blue/10
                        group-hover:text-illini-blue
                        inline-block rounded-full text-[10px] uppercase
                        transition-colors
                      ">
                        {categoryText?.label}
                      </span>
                      <h3 className="
                        mb-3 text-lg font-bold leading-tight text-slate-900
                        group-hover:text-illini-blue
                        transition-colors
                      ">
                        {article.title}
                      </h3>
                      <p className="
                        text-sm leading-relaxed text-slate-500 line-clamp-3
                      ">
                        {article.summary}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="
            gap-5
            sm:grid-cols-2
            grid grid-cols-1
          ">
            {CATEGORIES.map((category) => {
              const categoryText = getCategoryText(category, language)
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(`/library/category/${category.id}`)}
                  className="
                    group rounded-2xl border-slate-100 bg-white p-7 shadow-sm
                    hover:-translate-y-1 hover:shadow-md
                    hover:shadow-slate-200/50
                    cursor-pointer border transition-all duration-300
                  "
                >
                  <div className="
                    mb-6 h-14 w-14 rounded-2xl bg-slate-50 text-3xl shadow-inner
                    group-hover:bg-illini-blue group-hover:text-white
                    flex items-center justify-center transition-colors
                    duration-300
                  ">
                    {category.icon}
                  </div>
                  <h3 className="
                    mb-3 text-xl font-bold text-slate-900
                    group-hover:text-illini-blue
                    transition-colors
                  ">
                    {categoryText.label}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {categoryText.description}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default LibraryHomePage
