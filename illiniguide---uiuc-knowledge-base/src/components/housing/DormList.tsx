/**
 * @file ./src/components/housing/DormList.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCompareArrows, X, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Language } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import SortingDropdown from './SortingDropdown';
import { FilterModal } from './FilterModal';
import DormListHeader from './dorm-list/DormListHeader';
import DormGrid from './dorm-list/DormGrid';
import { FavoriteFlyEffect } from './dorm-list/FavoriteFlyEffect';
import { ListEmptyState } from './dorm-list/EmptyStates';
import { DormListMapPane } from './dorm-list/DormListMapPane';
import { useDormListController } from './dorm-list/useDormListController';
import { useDormCommentStats } from './hooks/useDormCommentStats';
import { useCompare } from './store/CompareContext';
import DormComparison from './DormComparison';

const COMPARE_TEXT = {
  en: {
    compareBar: (n: number) => `${n} dorm${n > 1 ? 's' : ''} selected`,
    compare: 'Compare',
    clear: 'Clear',
  },
  zh: {
    compareBar: (n: number) => `已选 ${n} 个宿舍`,
    compare: '对比',
    clear: '清除',
  },
};

interface DormListProps {
  language: Language;
}

const DormList: React.FC<DormListProps> = ({ language }) => {
  const controller = useDormListController(language);
  const commentStats = useDormCommentStats();
  const { compareIds, compareDorms, isCompareOpen, toggleCompare, clearCompare, openCompare, closeCompare } = useCompare();
  const { user, requestLogin } = useAuth();
  const navigate = useNavigate();
  const ct = COMPARE_TEXT[language];

  const handleRatingClick = useCallback((dorm: { id: string }) => {
    if (!user) {
      requestLogin();
    } else {
      navigate(`/dorms/${dorm.id}#reviews`);
    }
  }, [user, requestLogin, navigate]);

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

      {/* Mobile toolbar (search + filter + sort) */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-full text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-illini-blue/20 focus:border-illini-blue/30"
            placeholder={controller.t.searchPlaceholder}
            value={controller.searchTerm}
            onChange={(e) => controller.setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => controller.setIsFilterModalOpen(true)}
            type="button"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
              controller.hasActiveFilters
                ? 'border-illini-orange/40 text-illini-orange bg-illini-orange/10'
                : 'border-gray-200 text-gray-500 bg-white'
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
          {controller.hasActiveFilters && (
            <div className="absolute -top-1 -right-1 bg-illini-orange text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
              {controller.activeFilterCount}
            </div>
          )}
        </div>
        <div className="shrink-0">
          <SortingDropdown sortBy={controller.sortBy} onSortChange={controller.setSortBy} viewMode={controller.viewMode} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50/50 relative z-0 flex flex-row min-w-0">
        <div
          className={`
            h-full overflow-y-auto transition-opacity duration-200 scrollbar-thin min-w-0
            ${
              controller.isListView
                ? 'w-full p-4 xl:p-6 opacity-100 z-10'
                : 'absolute inset-0 xl:static xl:w-[360px] 2xl:w-[40%] xl:shrink-0 xl:min-w-0 xl:opacity-100 xl:border-r xl:border-gray-200 xl:z-auto opacity-0 pointer-events-none xl:pointer-events-auto p-3 xl:p-3 2xl:p-4'
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
              onRatingClick={handleRatingClick}
              compareIds={compareIds}
              onToggleCompare={(dorm) => toggleCompare(dorm.id)}
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

      {/* Floating compare bar */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-illini-blue px-5 py-3 text-white shadow-xl"
          >
            <GitCompareArrows className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{ct.compareBar(compareIds.length)}</span>
            <button
              onClick={openCompare}
              disabled={compareIds.length < 2}
              className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ct.compare}
            </button>
            <button
              onClick={clearCompare}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              aria-label={ct.clear}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison modal */}
      {isCompareOpen && compareDorms.length >= 2 && (
        <DormComparison
          dorms={compareDorms}
          onClose={closeCompare}
          language={language}
        />
      )}
    </div>
  );
};

export default DormList;
