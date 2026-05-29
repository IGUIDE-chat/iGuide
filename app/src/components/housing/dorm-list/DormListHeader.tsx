/**
 * @file ./src/components/housing/dorm-list/DormListHeader.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { motion } from "framer-motion"
import { List, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react"
import React from "react"

import SortingDropdown from "../SortingDropdown"
import { type DormListText } from "./types"

interface DormListHeaderProps {
  t: DormListText
  searchTerm: string
  setSearchTerm: (term: string) => void
  hasActiveFilters: boolean
  activeFilterCount: number
  onOpenFilters: () => void
  sortBy: string
  setSortBy: (sortBy: string) => void
  viewMode: "list" | "map"
  setViewMode: (mode: "list" | "map") => void
}

const DormListHeader: React.FC<DormListHeaderProps> = ({
  t,
  searchTerm,
  setSearchTerm,
  hasActiveFilters,
  activeFilterCount,
  onOpenFilters,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}) => {
  const isMapView = viewMode === "map"
  const isListView = !isMapView
  const activePillLeft = isListView ? "4px" : "calc(50% - 2px)"

  return (
    <div className="sticky top-0 z-30 hidden border-b border-gray-200 bg-white shadow-sm transition-all md:block">
      <div className="flex min-w-0 items-center gap-4 px-6 py-4 md:pl-16">
        <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
          <div className="relative w-full min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="size-4 text-gray-400" />
            </div>
            <input
              aria-label="Input field"
              type="text"
              className="block w-full rounded-full border border-gray-200 bg-gray-50/50 py-2 pr-3 pl-9 leading-5 placeholder-gray-400 shadow-sm transition-all hover:bg-white hover:shadow-md focus:border-black/20 focus:bg-white focus:shadow-md focus:ring-2 focus:ring-black/5 focus:outline-none sm:text-sm"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
              }}
            />
          </div>

          <div className="relative shrink-0">
            <button
              onClick={onOpenFilters}
              type="button"
              aria-label={t.filters}
              className={`focus:ring-illini-orange/20 flex size-10 items-center justify-center rounded-full border transition-all duration-200 focus:ring-2 focus:outline-none ${
                hasActiveFilters
                  ? `border-illini-orange/40 bg-illini-orange/10 text-illini-orange hover:border-illini-orange/60 hover:bg-illini-orange/15 hover:text-illini-orange active:border-illini-orange/70 active:bg-illini-orange/20 active:text-illini-orange`
                  : `hover:border-illini-orange/40 hover:bg-illini-orange/10 hover:text-illini-orange/90 active:border-illini-orange/50 active:bg-illini-orange/10 active:text-illini-orange border-gray-200 bg-white text-gray-700`
              } `}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
            </button>
            {hasActiveFilters && (
              <div className="bg-illini-orange absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm">
                {activeFilterCount}
              </div>
            )}
          </div>

          <div className="hidden shrink-0 sm:block">
            <SortingDropdown
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
            />
          </div>
        </div>

        <div className="flex w-auto shrink-0 items-center justify-end gap-3 xl:w-fit">
          <div className="relative hidden rounded-lg bg-gray-100 p-1 sm:flex">
            <motion.div
              className="absolute rounded-md border border-gray-200/50 bg-white shadow-sm"
              initial={{ left: activePillLeft, scaleX: 0.6, opacity: 0 }}
              animate={{ left: activePillLeft, scaleX: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                width: "calc(50% - 6px)",
                height: "calc(100% - 8px)",
                top: "4px",
                transformOrigin: "center",
              }}
            />

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setViewMode("list")
              }}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                isListView ? "text-black" : `text-gray-500 hover:text-gray-700`
              } `}
              title={t.viewList}
              type="button"
            >
              <List size={16} />
              <span className="hidden lg:inline">{t.viewList}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setViewMode("map")
              }}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                isMapView ? "text-black" : `text-gray-500 hover:text-gray-700`
              } `}
              title={t.viewMap}
              type="button"
            >
              <MapIcon size={16} />
              <span className="hidden lg:inline">{t.viewMap}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DormListHeader
