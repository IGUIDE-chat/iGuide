/**
 * @file ./src/components/housing/filter-modal/TagFilterSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo } from 'react'
import { Check } from 'lucide-react'
import { DormTag } from '../types/index'
import { getTagDisplay } from '../constants/metadata'
import { FilterLanguage } from './modalText'

interface TagFilterSectionProps {
  title: string
  language: FilterLanguage
  tags: DormTag[]
  selectedValues: DormTag[]
  onToggle: (tag: DormTag) => void
}

const TagFilterSection: React.FC<TagFilterSectionProps> = ({
  title,
  language,
  tags,
  selectedValues,
  onToggle,
}) => (
  <section className="mb-8">
    <h3 className="mb-6 text-xl font-bold">{title}</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tags.map((tag) => {
        const isSelected = selectedValues.includes(tag)
        return (
          <label
            key={tag}
            className="group flex cursor-pointer select-none items-center gap-3 py-1"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-[4px] border transition-all duration-200 ${
                isSelected
                  ? 'border-illini-blue bg-illini-blue text-white active:border-[#0e2240] active:bg-[#0e2240]'
                  : 'border-gray-300 bg-white active:border-illini-blue active:bg-blue-50/50 group-hover:border-illini-blue'
              } `}
            >
              {isSelected && <Check size={16} strokeWidth={3} />}
              <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => onToggle(tag)}
              />
            </div>
            <span className="text-gray-700 transition-colors group-hover:text-illini-blue">
              {getTagDisplay(tag, language)}
            </span>
          </label>
        )
      })}
    </div>
  </section>
)

export default memo(TagFilterSection)
