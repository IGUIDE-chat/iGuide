/**
 * @file ./src/components/housing/dorm-list/DormListMapPane.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { Suspense } from "react"
import { type Dorm } from "../types/index"
import { type Language } from "../../../types"
import MapCarousel from "./MapCarousel"
import { MapEmptyViewportOverlay, MapNoResultsOverlay } from "./EmptyStates"
import { type DormListText } from "./types"

// Lazy-load DormMap to defer mapbox-gl (~700KB) until map view is actually used
const DormMap = React.lazy(() => import("../DormMap"))

/** Skeleton placeholder while mapbox is loading */
const MapLoadingSkeleton: React.FC = () => (
  <div className="flex size-full animate-pulse items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="border-illini-orange mx-auto mb-3 size-10 animate-spin rounded-full border-3 border-t-transparent" />
      <p className="text-sm text-gray-400">Loading map...</p>
    </div>
  </div>
)

interface DormListMapPaneProps {
  isMapView: boolean
  filteredDorms: Dorm[]
  visibleInMap: Dorm[]
  favoritesSet: Set<string>
  language: Language
  t: DormListText
  hasPriceFilter: boolean
  highlightedDormId: string | null
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  disableScrollZoom: boolean
  onVisibleDormsChange: (dorms: Dorm[]) => void
  onToggleFavorite: (dorm: Dorm, event?: React.MouseEvent) => void
  onViewDetails: (dorm: Dorm) => void
  onHoverDorm: (id: string | null) => void
  onHoveringChange: (hovering: boolean) => void
  onMapNoResultAction: () => void
}

export const DormListMapPane: React.FC<DormListMapPaneProps> = ({
  isMapView,
  filteredDorms,
  visibleInMap,
  favoritesSet,
  language,
  t,
  hasPriceFilter,
  highlightedDormId,
  scrollContainerRef,
  disableScrollZoom,
  onVisibleDormsChange,
  onToggleFavorite,
  onViewDetails,
  onHoverDorm,
  onHoveringChange,
  onMapNoResultAction,
}) => {
  if (!isMapView) {
    return null
  }

  return (
    <div
      className={`flex h-full min-w-0 flex-col transition-opacity duration-200 ${
        isMapView
          ? `absolute inset-0 z-20 opacity-100 xl:static xl:z-auto xl:min-w-0 xl:flex-1`
          : `pointer-events-none absolute inset-0 opacity-0 xl:static xl:hidden`
      } `}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-[200px] w-full flex-1 bg-gray-100">
          <Suspense fallback={<MapLoadingSkeleton />}>
            <DormMap
              dorms={filteredDorms}
              onSelectDorm={onViewDetails}
              language={language}
              isVisible={isMapView}
              highlightedDormId={highlightedDormId}
              disableScrollZoom={disableScrollZoom}
              onVisibleDormsChange={onVisibleDormsChange}
            />
          </Suspense>

          {isMapView && filteredDorms.length === 0 && (
            <MapNoResultsOverlay
              t={t}
              hasPriceFilter={hasPriceFilter}
              onAction={onMapNoResultAction}
            />
          )}
        </div>
      </div>

      {isMapView && visibleInMap.length > 0 && (
        <MapCarousel
          dorms={visibleInMap}
          language={language}
          favoritesSet={favoritesSet}
          onToggleFavorite={onToggleFavorite}
          onViewDetails={onViewDetails}
          onHoverDorm={onHoverDorm}
          scrollContainerRef={scrollContainerRef}
          onHoveringChange={onHoveringChange}
        />
      )}

      {isMapView && filteredDorms.length > 0 && visibleInMap.length === 0 && (
        <MapEmptyViewportOverlay t={t} />
      )}
    </div>
  )
}
