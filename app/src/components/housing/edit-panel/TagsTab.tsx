/**
 * @file ./src/components/housing/edit-panel/TagsTab.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react'
import {
  CATEGORY_LABELS,
  getTagDisplay,
  LLC_OPTIONS,
  TAGS_BY_CATEGORY,
} from '../constants/metadata'
import { DormEditFormState } from './useDormEditForm'

interface TagsTabProps {
  form: DormEditFormState
}

export const TagsTab: React.FC<TagsTabProps> = ({ form }) => {
  const { t } = form

  return (
    <div className="space-y-5">
      {(['livingConditions', 'facilities', 'lifestyle'] as const).map(
        (category) => (
          <div key={category}>
            <p
              className="
                mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase
              "
            >
              {CATEGORY_LABELS[category][form.language]}
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS_BY_CATEGORY[category].map((tagId) => {
                const checked = form.categorizedTags[category].includes(
                  tagId as never
                )
                return (
                  <button
                    key={tagId}
                    type="button"
                    onClick={() =>
                      form.setCategorizedTags((prev) => ({
                        ...prev,
                        [category]: checked
                          ? prev[category].filter((tag) => tag !== tagId)
                          : [...prev[category], tagId],
                      }))
                    }
                    className={`
                      rounded-lg border px-3 py-1.5 text-sm font-medium
                      transition-all
                      ${
                        checked
                          ? `
                            border-illini-blue bg-illini-blue text-white
                            shadow-sm
                          `
                          : `
                            border-gray-300 bg-white text-gray-600
                            hover:border-illini-blue hover:text-illini-blue
                          `
                      }
                    `}
                  >
                    {getTagDisplay(tagId, form.language)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}

      <div>
        <p
          className="
            mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase
          "
        >
          {form.language === 'zh' ? '社区' : 'Community'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => form.setPetFriendly(!form.petFriendly)}
            className={`
              rounded-lg border px-3 py-1.5 text-sm font-medium transition-all
              ${
                form.petFriendly
                  ? 'border-illini-blue bg-illini-blue text-white shadow-sm'
                  : `
                    border-gray-300 bg-white text-gray-600
                    hover:border-illini-blue hover:text-illini-blue
                  `
              }
            `}
          >
            {form.language === 'zh' ? '允许宠物' : 'Pet-Friendly'}
          </button>
        </div>
      </div>

      <div>
        <p
          className="
            mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase
          "
        >
          {t.labels.llc}
        </p>
        <div className="flex flex-wrap gap-2">
          {LLC_OPTIONS.map((llc) => {
            const selected =
              form.categorizedTags.llcNames?.includes(llc) ?? false
            return (
              <button
                key={llc}
                type="button"
                onClick={() =>
                  form.setCategorizedTags((prev) => {
                    const current = prev.llcNames ?? []
                    const next = selected
                      ? current.filter((name) => name !== llc)
                      : [...current, llc]
                    return {
                      ...prev,
                      lifestyle:
                        next.length > 0
                          ? Array.from(new Set([...prev.lifestyle, 'llc']))
                          : prev.lifestyle.filter((tag) => tag !== 'llc'),
                      llcNames: next,
                    }
                  })
                }
                className={`
                  rounded-lg border px-3 py-1.5 text-sm font-medium
                  transition-all
                  ${
                    selected
                      ? 'border-illini-blue bg-illini-blue text-white shadow-sm'
                      : `
                        border-gray-300 bg-white text-gray-600
                        hover:border-illini-blue hover:text-illini-blue
                      `
                  }
                `}
              >
                {llc}
              </button>
            )
          })}
        </div>
        {(form.categorizedTags.llcNames?.length ?? 0) === 0 && (
          <p className="mt-2 text-xs text-gray-400">{t.hints.llc}</p>
        )}
      </div>
    </div>
  )
}
