/**
 * @file ./src/pages/library/LibraryCategoryPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ARTICLES,
  CATEGORIES,
  getArticleText,
  getCategoryText,
} from '../../constants'
import { UI_TEXT } from '../../i18n/uiText'
import { Language } from '../../types'

interface LibraryCategoryPageProps {
  language: Language
}

const LibraryCategoryPage: React.FC<LibraryCategoryPageProps> = ({
  language,
}) => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const t = UI_TEXT[language]

  const category = CATEGORIES.find((item) => item.id === categoryId)
  const localizedArticles = useMemo(() => {
    return ARTICLES.map((article) => ({
      ...article,
      ...getArticleText(article, language),
    }))
  }, [language])

  if (!category) {
    return (
      <div className="p-8 text-center text-slate-500">Category not found</div>
    )
  }

  const categoryArticles = localizedArticles.filter(
    (item) => item.category === categoryId
  )
  const categoryText = getCategoryText(category, language)

  return (
    <div
      className="
        animate-fade-in-up no-scrollbar size-full min-w-0 overflow-y-auto
      "
    >
      <div className="mx-auto max-w-3xl min-w-0 px-4 py-8 pb-24">
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="
            group mb-8 flex items-center gap-2 text-sm font-semibold
            text-slate-500 transition-colors
            hover:text-illini-blue
          "
        >
          <span
            className="
              flex size-8 items-center justify-center rounded-full border
              border-slate-200 bg-white transition-all
              group-hover:border-illini-blue group-hover:bg-illini-blue
              group-hover:text-white
            "
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </span>
          {t.backToCategories}
        </button>

        <div
          className="
            glass-card relative mb-10 flex flex-col items-start gap-6
            overflow-hidden rounded-2xl p-8
            sm:flex-row sm:items-center
          "
        >
          <div
            className="
              pointer-events-none absolute -top-10 -right-10 size-40
              rounded-full bg-linear-to-br from-illini-orange/20
              to-illini-blue/20 blur-3xl
            "
          />

          <div
            className="
              z-10 flex size-16 items-center justify-center rounded-2xl bg-white
              text-3xl shadow-md
            "
          >
            {category.icon}
          </div>
          <div className="z-10">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {categoryText.label}
            </h2>
            <p className="max-w-2xl text-base/relaxed text-slate-600">
              {categoryText.description}
            </p>
          </div>
        </div>

        <div
          className="
            grid grid-cols-1 gap-5
            md:grid-cols-2
          "
        >
          {categoryArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/library/article/${article.id}`)}
              className="
                group cursor-pointer rounded-2xl border border-slate-100
                bg-white p-6 shadow-sm transition-all duration-300
                hover:-translate-y-1 hover:border-illini-orange/30
                hover:shadow-md hover:shadow-slate-200/50
              "
            >
              <h3
                className="
                  mb-3 text-lg font-bold text-slate-800 transition-colors
                  group-hover:text-illini-orange
                "
              >
                {article.title}
              </h3>
              <p className="text-sm/relaxed text-slate-500">
                {article.summary}
              </p>
              <div
                className="
                  mt-4 flex translate-y-2 transform items-center text-sm
                  font-semibold text-illini-blue opacity-0 transition-opacity
                  group-hover:translate-y-0 group-hover:opacity-100
                "
              >
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
  )
}

export default LibraryCategoryPage
