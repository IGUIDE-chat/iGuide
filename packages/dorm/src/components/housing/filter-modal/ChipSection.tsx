import React, { memo } from "react"

interface ChipSectionProps {
  title: string
  options: Array<{ value: string; label: string }>
  selectedValues: string[]
  onToggle: (value: string) => void
  /** 'blue' for location section hover/active border; default 'orange' */
  accentColor?: "orange" | "blue"
}

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
            <button
              key={value.value}
              onClick={() => onToggle(value.value)}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? `border-illini-blue bg-illini-blue text-white active:border-[#0e2240] active:bg-[#0e2240]`
                  : unselectedClass
              } `}
            >
              {value.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default memo(ChipSection)
