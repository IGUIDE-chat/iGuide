/**
 * @file ./src/components/housing/SortingDropdown.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo, useRef, useEffect, useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'

interface SortingDropdownProps {
  sortBy: string
  onSortChange: (value: string) => void
  viewMode: 'list' | 'map'
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price (Low-High)' },
  { value: 'price-desc', label: 'Price (High-Low)' },
] as const

const SortingDropdown: React.FC<SortingDropdownProps> = memo(
  ({ sortBy, onSortChange, viewMode }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const previousViewModeRef = useRef<'list' | 'map' | null>(null)

    useEffect(() => {
      // Close dropdown if view mode changes
      if (
        previousViewModeRef.current !== null &&
        previousViewModeRef.current !== viewMode
      ) {
        setIsOpen(false)
      }
      previousViewModeRef.current = viewMode
    }, [viewMode])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentLabel =
      SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Sort'

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className={`
            flex size-10 items-center justify-center rounded-full border
            transition-all duration-200
            focus:ring-2 focus:ring-illini-blue/20 focus:outline-none
            ${
              isOpen
                ? 'border-illini-blue/50 bg-illini-blue/10 text-illini-blue'
                : `
                  border-gray-200 bg-white text-gray-700
                  hover:border-illini-blue/40 hover:bg-illini-blue/5
                  hover:text-illini-blue/80
                  active:border-illini-blue/50 active:bg-illini-blue/10
                  active:text-illini-blue
                `
            }
          `}
          title={`Sort by: ${currentLabel}`}
        >
          <ArrowUpDown size={18} strokeWidth={2} />
        </button>

        {isOpen && (
          <div
            className="
              animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-48
              origin-top-right rounded-xl border border-gray-100 bg-white py-1
              shadow-lg duration-100
            "
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value)
                  setIsOpen(false)
                }}
                type="button"
                className="
                  group flex w-full items-center justify-between px-4 py-2
                  text-left text-sm transition-colors
                  first:rounded-t-lg
                  last:rounded-b-lg
                  hover:bg-illini-blue/5
                "
              >
                <span
                  className={
                    sortBy === option.value
                      ? 'font-medium text-illini-blue'
                      : `
                        text-gray-600
                        group-hover:text-illini-blue/80
                      `
                  }
                >
                  {option.label}
                </span>
                {sortBy === option.value && (
                  <Check size={14} className="text-illini-blue" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.sortBy === nextProps.sortBy &&
      prevProps.onSortChange === nextProps.onSortChange &&
      prevProps.viewMode === nextProps.viewMode
    ) // Changed: viewMode might matter for closing
  }
)

SortingDropdown.displayName = 'SortingDropdown'

export default SortingDropdown
