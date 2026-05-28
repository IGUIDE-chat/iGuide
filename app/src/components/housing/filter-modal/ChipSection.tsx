/**
 * @file ./src/components/housing/filter-modal/ChipSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo, useCallback } from "react"

interface ChipSectionProps {
  title: string
  options: Array<{ value: string; label: string }>
  selectedValues: string[]
  onToggle: (value: string) => void
  /** 'blue' for location section hover/active border; default 'orange' */
  accentColor?: "orange" | "blue"
}

interface ChipButtonProps {
  value: string
  label: string
  isSelected: boolean
  onToggle: (value: string) => void
  unselectedClass: string
}

const ChipButton = memo(function ChipButton({
  value,
  label,
  isSelected,
  onToggle,
  unselectedClass,
}: ChipButtonProps) {
  const handleClick = useCallback(() => onToggle(value), [onToggle, value])
  return (
    <button
      key={value}
      onClick={handleClick}
      type="button"
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        isSelected
          ? `border-illini-blue bg-illini-blue text-white active:border-[#0e2240] active:bg-[#0e2240]`
          : unselectedClass
      } `}
    >
      {label}
    </button>
  )
})

const ChipSection: React.FC<ChipSectionProps> = ({
  title,
  options,
  selectedValues,
  onToggle,
  accentColor = "orange",
}) => {
  const unselectedClass =
    accentColor === "blue"
      ? "bg-white text-gray-700 border-gray-300 hover:border-illini-blue active:border-illini-blue active:bg-blue-50/50"
      : "bg-white text-gray-700 border-gray-300 hover:border-illini-orange active:border-illini-orange active:bg-illini-orange/10"
  return (
    <section className="mb-8">
      <h3 className="mb-4 text-xl font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((value) => {
          const isSelected = selectedValues.includes(value.value)
          return (
            <ChipButton
              key={value.value}
              value={value.value}
              label={value.label}
              isSelected={isSelected}
              onToggle={onToggle}
              unselectedClass={unselectedClass}
            />
          )
        })}
      </div>
    </section>
  )
}

export default memo(ChipSection)
