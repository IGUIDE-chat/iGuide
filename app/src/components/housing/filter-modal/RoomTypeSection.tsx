/**
 * @file ./src/components/housing/filter-modal/RoomTypeSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo } from "react"
import { Check } from "lucide-react"
import { type RoomType } from "../types/index"
import { ROOM_TYPES } from "../constants/filters"
import { type FilterLanguage } from "./modalText"

interface RoomTypeSectionProps {
  title: string
  language: FilterLanguage
  selectedValues: RoomType[]
  onToggle: (value: RoomType) => void
}

const RoomTypeSection: React.FC<RoomTypeSectionProps> = ({
  title,
  language,
  selectedValues,
  onToggle,
}) => (
  <section>
    <h3 className="mb-6 text-xl font-bold">{title}</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ROOM_TYPES.map((type) => {
        const isSelected = selectedValues.includes(type.id)
        return (
          <label
            key={type.id}
            className="group flex cursor-pointer items-center gap-3 py-1 select-none"
          >
            <div
              className={`flex size-6 items-center justify-center rounded-[4px] border transition-all duration-200 ${
                isSelected
                  ? `border-illini-blue bg-illini-blue text-white active:border-[#0e2240] active:bg-[#0e2240]`
                  : `group-hover:border-illini-blue active:border-illini-blue border-gray-300 bg-white active:bg-blue-50/50`
              } `}
            >
              {isSelected && <Check size={16} strokeWidth={3} />}
              <input
                aria-label="Toggle option"
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => onToggle(type.id)}
              />
            </div>
            <span className="group-hover:text-illini-blue relative -top-0.5 text-gray-700 transition-colors">
              {type.label[language] || type.label.en}
            </span>
          </label>
        )
      })}
    </div>
  </section>
)

export default memo(RoomTypeSection)
