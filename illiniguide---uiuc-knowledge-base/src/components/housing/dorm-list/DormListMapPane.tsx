/**
 * @file ./src/components/housing/dorm-list/DormListMapPane.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react';
import { Dorm } from '../types/index';
import { Language } from '../../../types';
import DormMap from '../DormMap';
import MapCarousel from './MapCarousel';
import { MapEmptyViewportOverlay, MapNoResultsOverlay } from './EmptyStates';
import { DormListText } from './types';

interface DormListMapPaneProps {
  isMapView: boolean;
  filteredDorms: Dorm[];
  visibleInMap: Dorm[];
  favoritesSet: Set<string>;
  language: Language;
  t: DormListText;
  hasPriceFilter: boolean;
  highlightedDormId: string | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  disableScrollZoom: boolean;
  onVisibleDormsChange: (dorms: Dorm[]) => void;
  onToggleFavorite: (dorm: Dorm, event?: React.MouseEvent) => void;
  onViewDetails: (dorm: Dorm) => void;
  onHoverDorm: (id: string | null) => void;
  onHoveringChange: (hovering: boolean) => void;
  onMapNoResultAction: () => void;
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
    return null;
  }

  return (
    <div
      className={`
        h-full transition-opacity duration-200 flex flex-col min-w-0
        ${
          isMapView
            ? 'absolute inset-0 xl:static xl:flex-1 xl:min-w-0 opacity-100 z-20 xl:z-auto'
            : 'absolute inset-0 xl:static xl:hidden opacity-0 pointer-events-none'
        }
      `}
    >
      <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
        <div className="flex-1 min-h-[200px] w-full bg-gray-100">
          <DormMap
            dorms={filteredDorms}
            onSelectDorm={onViewDetails}
            language={language}
            isVisible={isMapView}
            highlightedDormId={highlightedDormId}
            disableScrollZoom={disableScrollZoom}
            onVisibleDormsChange={onVisibleDormsChange}
          />

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
  );
};
