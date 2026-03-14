/**
 * @file ./src/components/housing/DormList.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react';
import { Language } from '../../types';
import { FilterModal } from './FilterModal';
import DormListHeader from './dorm-list/DormListHeader';
import DormGrid from './dorm-list/DormGrid';
import { FavoriteFlyEffect } from './dorm-list/FavoriteFlyEffect';
import { ListEmptyState } from './dorm-list/EmptyStates';
import { DormListMapPane } from './dorm-list/DormListMapPane';
import { useDormListController } from './dorm-list/useDormListController';
import { useDormCommentStats } from './hooks/useDormCommentStats';

interface DormListProps {
  language: Language;
}

const DormList: React.FC<DormListProps> = ({ language }) => {
  const controller = useDormListController(language);
  const commentStats = useDormCommentStats();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <DormListHeader
        t={controller.t}
        searchTerm={controller.searchTerm}
        setSearchTerm={controller.setSearchTerm}
        hasActiveFilters={controller.hasActiveFilters}
        activeFilterCount={controller.activeFilterCount}
        onOpenFilters={() => controller.setIsFilterModalOpen(true)}
        sortBy={controller.sortBy}
        setSortBy={controller.setSortBy}
        viewMode={controller.viewMode}
        setViewMode={controller.setViewMode}
      />

      <div className="flex-1 overflow-hidden bg-gray-50/50 relative z-0 flex flex-row min-w-0">
        <div
          className={`
            h-full overflow-y-auto transition-opacity duration-200 scrollbar-thin min-w-0
            ${
              controller.isListView
                ? 'w-full p-4 xl:p-6 opacity-100 z-10'
                : 'absolute inset-0 xl:static xl:w-[360px] xl:shrink-0 xl:min-w-0 xl:opacity-100 xl:border-r xl:border-gray-200 xl:z-auto opacity-0 pointer-events-none xl:pointer-events-auto p-3 xl:p-3'
            }
          `}
        >
          {controller.filteredDorms.length > 0 ? (
            <DormGrid
              dorms={controller.filteredDorms}
              isListView={controller.isListView}
              favoritesSet={controller.favoritesSet}
              onToggleFavorite={controller.handleToggleFavorite}
              onViewDetails={controller.handleViewDetails}
              onHoverDorm={controller.setHoveredDormId}
              language={language}
              commentStats={commentStats}
            />
          ) : (
            <ListEmptyState t={controller.t} onClearFilters={controller.clearAllFilters} />
          )}
        </div>

        <DormListMapPane
          isMapView={controller.isMapView}
          filteredDorms={controller.filteredDorms}
          visibleInMap={controller.visibleInMap}
          favoritesSet={controller.favoritesSet}
          language={language}
          t={controller.t}
          hasPriceFilter={controller.hasPriceFilter}
          highlightedDormId={controller.hoveredDormId}
          scrollContainerRef={controller.scrollContainerRef}
          disableScrollZoom={controller.isCarouselHovering}
          onVisibleDormsChange={controller.setVisibleInMap}
          onToggleFavorite={controller.handleToggleFavorite}
          onViewDetails={controller.handleViewDetails}
          onHoverDorm={controller.setHoveredDormId}
          onHoveringChange={controller.setIsCarouselHovering}
          onMapNoResultAction={controller.handleMapNoResultAction}
        />
      </div>

      <FilterModal
        isOpen={controller.isFilterModalOpen}
        onClose={() => controller.setIsFilterModalOpen(false)}
        language={language === 'zh' ? 'zh' : 'en'}
      />

      {controller.flyingHeart && (
        <FavoriteFlyEffect
          startX={controller.flyingHeart.x}
          startY={controller.flyingHeart.y}
          targetX={controller.flyingHeart.targetX}
          targetY={controller.flyingHeart.targetY}
          onComplete={() => controller.setFlyingHeart(null)}
        />
      )}
    </div>
  );
};

export default DormList;
