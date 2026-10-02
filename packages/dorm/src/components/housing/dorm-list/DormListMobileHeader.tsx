import { Search, SlidersHorizontal, Map as MapIcon, List, ArrowUpDown } from "lucide-react"
import * as React from "react"
import { createPortal } from "react-dom"

import { useLayout } from "../../../contexts/DormHostContext"
import { Language } from "../../../types"
import { useShellSlot } from "../../layout/useShellSlot"
import { useDormFilterBadge } from "../hooks/useDormFilterBadge"
import { useHousingFilters } from "../store/HousingContext"

const SORT_OPTIONS = [
  { value: "name-asc", label: "A-Z" },
  { value: "name-desc", label: "Z-A" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
] as const

const SortDropdownMobile: React.FC<{
  sortBy: string
  onSortChange: (v: string) => void
}> = ({ sortBy, onSortChange }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex size-10 items-center justify-center rounded-full border transition-all duration-200 ${
          open
            ? "border-illini-blue/50 bg-illini-blue/10 text-illini-blue"
            : "border-gray-200 bg-white text-gray-700"
        } `}
      >
        <ArrowUpDown size={18} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onSortChange(o.value)
                setOpen(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                sortBy === o.value
                  ? `bg-illini-blue/5 text-illini-blue font-medium`
                  : `text-gray-600 hover:bg-gray-50`
              } `}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const DormListMobileHeader: React.FC<{ language: Language }> = ({ language }) => {
  const {
    searchTerm,
    setSearchTerm,
    setIsFilterModalOpen,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
  } = useHousingFilters()
  const { hasActiveDormFilters, activeDormFilterCount } = useDormFilterBadge()

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="block h-10 w-full rounded-full border border-gray-200 bg-gray-50/50 pr-3 pl-9 text-sm/5 placeholder-gray-400 shadow-sm transition-all focus:border-black/20 focus:ring-2 focus:ring-black/5 focus:outline-none"
          placeholder={language === "zh" ? "输入搜索宿舍..." : "Type to search dorms..."}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label={language === "zh" ? "筛选" : "Filters"}
          onClick={() => setIsFilterModalOpen(true)}
          className={`focus:ring-illini-orange/20 flex size-10 items-center justify-center rounded-full border transition-all duration-200 focus:ring-2 focus:outline-none ${
            hasActiveDormFilters
              ? `border-illini-orange/40 bg-illini-orange/10 text-illini-orange`
              : "border-gray-200 bg-white text-gray-700"
          } `}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
        {hasActiveDormFilters && (
          <div className="bg-illini-orange absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm">
            {activeDormFilterCount}
          </div>
        )}
      </div>
      <SortDropdownMobile sortBy={sortBy} onSortChange={setSortBy} />
      <button
        type="button"
        aria-label={
          viewMode === "list"
            ? language === "zh"
              ? "地图"
              : "Map"
            : language === "zh"
              ? "列表"
              : "List"
        }
        onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-all duration-200 active:scale-95"
      >
        {viewMode === "list" ? (
          <MapIcon size={18} strokeWidth={2} />
        ) : (
          <List size={18} strokeWidth={2} />
        )}
      </button>
    </div>
  )
}

/** Search, filter, sort, and view toggle in the shell's mobile header. */
export const DormListMobileHeaderPortal: React.FC<{ language: Language }> = ({ language }) => {
  const { setMobileHeaderSlot } = useLayout()
  const target = useShellSlot(setMobileHeaderSlot)
  return target ? createPortal(<DormListMobileHeader language={language} />, target) : null
}
