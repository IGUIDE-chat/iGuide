/**
 * @file ./src/components/housing/DormList.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompareArrows, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Language } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { FilterModal } from "./FilterModal";
import DormListHeader from "./dorm-list/DormListHeader";
import DormGrid from "./dorm-list/DormGrid";
import { FavoriteFlyEffect } from "./dorm-list/FavoriteFlyEffect";
import { ListEmptyState } from "./dorm-list/EmptyStates";
import { DormListMapPane } from "./dorm-list/DormListMapPane";
import { useDormListController } from "./dorm-list/useDormListController";
import { useDormCommentStats } from "./hooks/useDormCommentStats";
import { useCompare } from "./store/CompareContext";

const DormComparison = React.lazy(() => import("./DormComparison"));

const COMPARE_TEXT = {
  en: {
    compareBar: (n: number) => `${n} dorm${n > 1 ? "s" : ""} selected`,
    compare: "Compare",
    clear: "Clear",
  },
  zh: {
    compareBar: (n: number) => `已选 ${n} 个宿舍`,
    compare: "对比",
    clear: "清除",
  },
};

interface DormListProps {
  language: Language;
}

const DormList: React.FC<DormListProps> = ({ language }) => {
  const controller = useDormListController(language);
  const commentStats = useDormCommentStats();
  const {
    compareIds,
    compareDorms,
    isCompareOpen,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
  } = useCompare();
  const { user, requestLogin } = useAuth();
  const navigate = useNavigate();
  const ct = COMPARE_TEXT[language];

  const handleRatingClick = useCallback(
    (dorm: { id: string }) => {
      if (!user) {
        requestLogin();
      } else {
        navigate(`/dorms/${dorm.id}#reviews`);
      }
    },
    [user, requestLogin, navigate]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50">
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

      <div
        className="
          relative z-0 flex min-w-0 flex-1 flex-row overflow-hidden
          bg-gray-50/50
        "
      >
        <div
          className={`
            scrollbar-thin h-full min-w-0 overflow-y-auto transition-opacity
            duration-200
            ${
              controller.isListView
                ? `
                  z-10 w-full p-4 opacity-100
                  xl:p-6
                `
                : `
                  pointer-events-none absolute inset-0 p-3 opacity-0
                  xl:pointer-events-auto xl:static xl:z-auto xl:w-[360px]
                  xl:min-w-0 xl:shrink-0 xl:border-r xl:border-gray-200 xl:p-3
                  xl:opacity-100
                  2xl:w-[40%] 2xl:p-4
                `
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
            <ListEmptyState
              t={controller.t}
              onClearFilters={controller.clearAllFilters}
            />
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
        language={language === "zh" ? "zh" : "en"}
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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              fixed inset-x-4 bottom-6 z-50 mx-auto flex w-fit
              max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full
              bg-illini-blue px-3 py-2.5 text-white shadow-xl
              md:gap-3 md:px-5 md:py-3
            "
          >
            <GitCompareArrows className="size-4 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              {ct.compareBar(compareIds.length)}
            </span>
            <button
              onClick={openCompare}
              disabled={compareIds.length < 2}
              className="
                rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold
                transition-colors
                hover:bg-white/30
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              {ct.compare}
            </button>
            <button
              onClick={clearCompare}
              className="
                rounded-full p-1.5 transition-colors
                hover:bg-white/20
              "
              aria-label={ct.clear}
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison modal */}
      {isCompareOpen && compareDorms.length >= 2 && (
        <Suspense fallback={null}>
          <DormComparison
            dorms={compareDorms}
            onClose={closeCompare}
            language={language}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DormList;
