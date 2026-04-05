/**
 * @file ./src/components/housing/dorm-list/EmptyStates.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react'
import { Search } from 'lucide-react'
import { DormListText } from './types'

interface ListEmptyStateProps {
  t: DormListText
  onClearFilters: () => void
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  t,
  onClearFilters,
}) => {
  return (
    <div
      className="
        p-8 flex h-full flex-col items-center justify-center text-center
      "
    >
      <div
        className="
          mb-4 h-16 w-16 bg-gray-100 text-gray-400 flex items-center
          justify-center rounded-full
        "
      >
        <Search size={32} />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{t.noResults}</h3>
      <p className="mb-6 max-w-md text-gray-500 mx-auto">{t.noResultsDesc}</p>
      <button
        onClick={onClearFilters}
        type="button"
        className="
          bg-blue-50 px-6 py-2 font-medium text-illini-blue rounded-full
          transition-colors
          hover:underline
        "
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
    <div
      className="
        inset-x-0 top-4 px-4 pointer-events-none absolute z-1100 flex
        justify-center
      "
    >
      <div
        className="
          max-w-sm rounded-2xl border-gray-200 bg-white/95 p-5 shadow-xl
          pointer-events-auto w-full border text-center
        "
      >
        <p className="mb-4 text-sm font-medium text-gray-800">
          {t.mapNoResults}
        </p>
        <button
          onClick={onAction}
          type="button"
          className="
            rounded-lg bg-illini-blue px-4 py-2 text-sm font-semibold text-white
            hover:bg-illini-blue/90
            transition-colors
          "
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

export const MapEmptyViewportOverlay: React.FC<
  MapEmptyViewportOverlayProps
> = ({ t }) => {
  return (
    <div
      className="
        bottom-6 left-0 right-0 px-6
        xl:hidden
        absolute z-10
      "
    >
      <div
        className="
          max-w-md rounded-2xl border-gray-200 bg-white/95 p-4 shadow-xl
          backdrop-blur-sm mx-auto border text-center
        "
      >
        <p className="mb-0.5 text-sm font-medium text-gray-800">
          {t.noDormsInArea}
        </p>
        <p className="text-xs text-gray-500">{t.panToSeeDorms}</p>
      </div>
    </div>
  )
}
