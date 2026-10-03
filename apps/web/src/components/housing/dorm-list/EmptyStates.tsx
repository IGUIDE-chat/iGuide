import { Search } from "lucide-react"
import React from "react"

import { DormListText } from "./types"

interface ListEmptyStateProps {
  t: DormListText
  onClearFilters: () => void
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({ t, onClearFilters }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Search size={32} />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{t.noResults}</h3>
      <p className="mx-auto mb-6 max-w-md text-gray-500">{t.noResultsDesc}</p>
      <button
        onClick={onClearFilters}
        type="button"
        className="text-illini-blue rounded-full bg-blue-50 px-6 py-2 font-medium transition-colors hover:underline"
      >
        {t.clearFilters}
      </button>
    </div>
  )
}

interface MapNoResultsOverlayProps {
  t: DormListText
  hasPriceFilter: boolean
  onAction: () => void
}

export const MapNoResultsOverlay: React.FC<MapNoResultsOverlayProps> = ({
  t,
  hasPriceFilter,
  onAction,
}) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-1100 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-gray-200 bg-white/95 p-5 text-center shadow-xl">
        <p className="mb-4 text-sm font-medium text-gray-800">{t.mapNoResults}</p>
        <button
          onClick={onAction}
          type="button"
          className="bg-illini-blue hover:bg-illini-blue/90 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          {hasPriceFilter ? t.clearPrice : t.clearFilters}
        </button>
      </div>
    </div>
  )
}

interface MapEmptyViewportOverlayProps {
  t: DormListText
}

export const MapEmptyViewportOverlay: React.FC<MapEmptyViewportOverlayProps> = ({ t }) => {
  return (
    <div className="absolute inset-x-0 bottom-6 z-10 px-6 xl:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white/95 p-4 text-center shadow-xl backdrop-blur-sm">
        <p className="mb-0.5 text-sm font-medium text-gray-800">{t.noDormsInArea}</p>
        <p className="text-xs text-gray-500">{t.panToSeeDorms}</p>
      </div>
    </div>
  )
}
