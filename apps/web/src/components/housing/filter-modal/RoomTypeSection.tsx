import { RoomType } from "@iguide/dorm"
import { Check } from "lucide-react"
import React, { memo } from "react"

import { ROOM_TYPES } from "../constants/filters"
import { FilterLanguage } from "./modalText"

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
