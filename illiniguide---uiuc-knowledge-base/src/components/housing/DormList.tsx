import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dorm } from '../../types/housing';
import { getPriceRangeFromData } from '../../constants/housing/pricing';
import { useDormData } from '../../contexts/DormDataContext';
import DormMap from './DormMap';
import { FilterModal } from './FilterModal';
import { useHousingFilters } from '../../contexts/HousingContext';
import { useSharedDormInteraction } from '../../contexts/DormUserInteractionContext';
import { useLayout } from '../../contexts/LayoutContext';
import { Language } from '../../types';
import DormListHeader from './dorm-list/DormListHeader';
import DormGrid from './dorm-list/DormGrid';
import MapCarousel from './dorm-list/MapCarousel';
import { ListEmptyState, MapEmptyViewportOverlay, MapNoResultsOverlay } from './dorm-list/EmptyStates';
import { filterAndSortDorms, normalizePriceRange } from './dorm-list/filtering';
import { DormListText } from './dorm-list/types';

/** 侧栏打开时：飞向收藏区域（侧栏中部偏下）；侧栏关闭时：飞向打开目录按钮（左上角） */
const TARGET_FAVORITES = { x: 90, y: 360 };
const TARGET_TOGGLE_BUTTON = { x: 30, y: 30 };

/** 飞心 SVG 为 24px，侧栏收藏爱心为 12px，scale 0.5 时落地与收藏爱心完美重合 */
const FAVORITES_HEART_SCALE = 12 / 24;

const FlyingHeart: React.FC<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    onComplete: () => void;
}> = ({ startX, startY, targetX, targetY, onComplete }) => (
    <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] origin-center"
        initial={{ x: startX, y: startY, scale: 1 }}
        animate={{
            x: targetX,
            y: targetY,
            scale: FAVORITES_HEART_SCALE
        }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        onAnimationComplete={onComplete}
        style={{ willChange: 'transform' }}
    >
        <div className="-translate-x-1/2 -translate-y-1/2">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-red-500 drop-shadow-md"
            >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
        </div>
    </motion.div>
);

interface DormListProps {
    language: Language;
}

const DORM_LIST_TEXT: Record<Language, DormListText> = {
    en: {
        searchPlaceholder: 'Type to search dorms...',
        noResults: 'No dorms found',
        noResultsDesc:
            "We couldn't find any dorms matching your current filters. Try adjusting your search or clearing some filters.",
        clearFilters: 'Clear all filters',
        viewMap: 'Map View',
        viewList: 'List View',
        results: 'results',
        mapNoResults: 'No dorms match your current filters.',
        clearPrice: 'Clear price filter',
        filters: 'Filters',
        noDormsInArea: 'No dorms in this area',
        panToSeeDorms: 'Pan or zoom map to see dorms in other areas'
    },
    zh: {
        searchPlaceholder: '输入搜索宿舍...',
        noResults: '未找到匹配宿舍',
        noResultsDesc: '没有宿舍匹配当前筛选条件，请尝试调整筛选或清空部分条件。',
        clearFilters: '清空全部筛选',
        viewMap: '地图视图',
        viewList: '列表视图',
        results: '个结果',
        mapNoResults: '当前筛选条件下暂无宿舍。',
        clearPrice: '清除价格筛选',
        filters: '筛选',
        noDormsInArea: '该区域暂无宿舍',
        panToSeeDorms: '请移动或缩放地图查看其他区域的宿舍'
    }
};

const DormList: React.FC<DormListProps> = ({ language }) => {
    const navigate = useNavigate();
    const { dorms: allDorms } = useDormData();
    const { isSidebarOpen, favoritesIconRef, sidebarToggleButtonRef, mobileSidebarButtonRef } = useLayout();
    const { toggleFavorite, addToHistory, favorites } = useSharedDormInteraction();
    const [hasMountedMap, setHasMountedMap] = useState(false);
    const [flyingHeart, setFlyingHeart] = useState<{ x: number; y: number; targetX: number; targetY: number } | null>(null);
    const [hoveredDormId, setHoveredDormId] = useState<string | null>(null);
    const [isCarouselHovering, setIsCarouselHovering] = useState(false);
    const [visibleInMap, setVisibleInMap] = useState<Dorm[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const {
        searchTerm,
        setSearchTerm,
        isFilterModalOpen,
        setIsFilterModalOpen,
        activeFilters,
        priceRange,
        setPriceRange,
        locationFilters,
        bedCountFilters,
        bathroomCountFilters,
        housingTypeDetails,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        amenityFilters,
        communityFilters,
        llcFilters,
        proximityFilters,
        livingConditionFilters,
        facilityFilters,
        lifestyleFilters,
        requireAc,
        bathroomTypeFilters,
        clearAllFilters
    } = useHousingFilters();

    useEffect(() => {
        if (viewMode === 'map') {
            setHasMountedMap(true);
        }
    }, [viewMode]);

    const t = DORM_LIST_TEXT[language];
    const isMapView = viewMode === 'map';
    const isListView = !isMapView;
    const priceLimits = useMemo<[number, number]>(() => getPriceRangeFromData(allDorms), [allDorms]);
    const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

    const hasPriceFilter = useMemo(
        () => priceRange[0] !== priceLimits[0] || priceRange[1] !== priceLimits[1],
        [priceRange, priceLimits]
    );

    const hasActiveFilters = useMemo(
        () =>
            activeFilters.length > 0 ||
            hasPriceFilter ||
            housingTypeDetails !== 'ALL' ||
            locationFilters.length > 0 ||
            bedCountFilters.length > 0 ||
            bathroomCountFilters.length > 0 ||
            amenityFilters.length > 0 ||
            communityFilters.length > 0 ||
            llcFilters.length > 0 ||
            proximityFilters.length > 0 ||
            livingConditionFilters.length > 0 ||
            facilityFilters.length > 0 ||
            lifestyleFilters.length > 0 ||
            requireAc ||
            bathroomTypeFilters.length > 0,
        [
            activeFilters.length,
            hasPriceFilter,
            housingTypeDetails,
            locationFilters.length,
            bedCountFilters.length,
            bathroomCountFilters.length,
            amenityFilters.length,
            communityFilters.length,
            llcFilters.length,
            proximityFilters.length,
            livingConditionFilters.length,
            facilityFilters.length,
            lifestyleFilters.length,
            requireAc,
            bathroomTypeFilters.length
        ]
    );

    const activeFilterCount = useMemo(
        () =>
            (hasPriceFilter ? 1 : 0) +
            (housingTypeDetails !== 'ALL' ? 1 : 0) +
            locationFilters.length +
            bedCountFilters.length +
            bathroomCountFilters.length +
            activeFilters.length +
            amenityFilters.length +
            communityFilters.length +
            llcFilters.length +
            proximityFilters.length +
            livingConditionFilters.length +
            facilityFilters.length +
            lifestyleFilters.length +
            (requireAc ? 1 : 0) +
            bathroomTypeFilters.length,
        [
            hasPriceFilter,
            housingTypeDetails,
            locationFilters.length,
            bedCountFilters.length,
            bathroomCountFilters.length,
            activeFilters.length,
            amenityFilters.length,
            communityFilters.length,
            llcFilters.length,
            proximityFilters.length,
            livingConditionFilters.length,
            facilityFilters.length,
            lifestyleFilters.length,
            requireAc,
            bathroomTypeFilters.length
        ]
    );

    const normalizedPriceRange = useMemo<[number, number]>(
        () => normalizePriceRange(priceRange, priceLimits),
        [priceRange, priceLimits]
    );

    const filteredDorms = useMemo(
        () =>
            filterAndSortDorms(allDorms, {
                searchTerm,
                activeFilters,
                normalizedPriceRange,
                locationFilters,
                bedCountFilters,
                bathroomCountFilters,
                housingTypeDetails,
                amenityFilters,
                communityFilters,
                llcFilters,
                proximityFilters,
                livingConditionFilters,
                facilityFilters,
                lifestyleFilters,
                requireAc,
                bathroomTypeFilters,
                sortBy
            }),
        [
            allDorms,
            searchTerm,
            activeFilters,
            normalizedPriceRange,
            locationFilters,
            bedCountFilters,
            bathroomCountFilters,
            housingTypeDetails,
            amenityFilters,
            communityFilters,
            llcFilters,
            proximityFilters,
            livingConditionFilters,
            facilityFilters,
            lifestyleFilters,
            requireAc,
            bathroomTypeFilters,
            sortBy
        ]
    );

    useEffect(() => {
        if (viewMode !== 'map' || filteredDorms.length === 0) {
            setIsCarouselHovering(false);
        }
    }, [viewMode, filteredDorms.length]);

    useEffect(() => {
        if (viewMode !== 'map' || filteredDorms.length === 0) {
            setVisibleInMap((prev) => (prev.length === 0 ? prev : []));
        }
    }, [viewMode, filteredDorms.length]);

    const handleViewDetails = (dorm: Dorm) => {
        addToHistory(dorm);
        navigate(`/dorms/${dorm.id}`);
    };

    const handleMapNoResultAction = () => {
        if (hasPriceFilter) {
            setPriceRange(priceLimits);
            return;
        }
        clearAllFilters();
    };

    const handleToggleFavorite = (dorm: Dorm, e?: React.MouseEvent) => {
        const wasNotFavorite = !favoritesSet.has(dorm.id);
        if (wasNotFavorite && e) {
            let targetX: number;
            let targetY: number;
            if (isSidebarOpen && favoritesIconRef?.current) {
                const rect = favoritesIconRef.current.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            } else if (isSidebarOpen) {
                targetX = TARGET_FAVORITES.x;
                targetY = TARGET_FAVORITES.y;
            } else {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const toggleEl = isMobile ? mobileSidebarButtonRef?.current : sidebarToggleButtonRef?.current;
                if (toggleEl) {
                    const rect = toggleEl.getBoundingClientRect();
                    targetX = rect.left + rect.width / 2;
                    targetY = rect.top + rect.height / 2;
                } else {
                    targetX = TARGET_TOGGLE_BUTTON.x;
                    targetY = TARGET_TOGGLE_BUTTON.y;
                }
            }
            setFlyingHeart({ x: e.clientX, y: e.clientY, targetX, targetY });
        }
        void toggleFavorite(dorm.id, dorm.name, dorm.name_zh);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <DormListHeader
                t={t}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onOpenFilters={() => setIsFilterModalOpen(true)}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 overflow-hidden bg-gray-50/50 relative z-0 flex flex-row min-w-0">
                <div
                    className={`
                        h-full overflow-y-auto p-4 xl:p-6 transition-all duration-300 scrollbar-thin min-w-0
                        ${isListView
                            ? 'w-full opacity-100 z-10'
                            : 'absolute inset-0 xl:static xl:w-[40%] xl:min-w-0 xl:opacity-100 xl:border-r xl:border-gray-200 xl:z-auto opacity-0 pointer-events-none xl:pointer-events-auto'
                        }
                    `}
                >
                    {filteredDorms.length > 0 ? (
                        <DormGrid
                            dorms={filteredDorms}
                            isListView={isListView}
                            favoritesSet={favoritesSet}
                            onToggleFavorite={handleToggleFavorite}
                            onViewDetails={handleViewDetails}
                            onHoverDorm={setHoveredDormId}
                            language={language}
                        />
                    ) : (
                        <ListEmptyState t={t} onClearFilters={clearAllFilters} />
                    )}
                </div>

                {(hasMountedMap || isMapView) && (
                    <div
                        className={`
                            h-full transition-all duration-300 flex flex-col min-w-0
                            ${isMapView
                                ? 'absolute inset-0 xl:static xl:w-[60%] xl:min-w-0 opacity-100 z-20 xl:z-auto'
                                : 'absolute inset-0 xl:static xl:hidden opacity-0 pointer-events-none'
                            }
                        `}
                    >
                        <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
                            <div className="flex-1 min-h-[200px] w-full bg-gray-100">
                                <DormMap
                                    dorms={filteredDorms}
                                    onSelectDorm={handleViewDetails}
                                    language={language}
                                    isVisible={isMapView}
                                    highlightedDormId={hoveredDormId}
                                    disableScrollZoom={isCarouselHovering}
                                    onVisibleDormsChange={setVisibleInMap}
                                />

                                {isMapView && filteredDorms.length === 0 && (
                                    <MapNoResultsOverlay
                                        t={t}
                                        hasPriceFilter={hasPriceFilter}
                                        onAction={handleMapNoResultAction}
                                    />
                                )}
                            </div>
                        </div>

                        {isMapView && visibleInMap.length > 0 && (
                            <MapCarousel
                                dorms={visibleInMap}
                                language={language}
                                favoritesSet={favoritesSet}
                                onToggleFavorite={handleToggleFavorite}
                                onViewDetails={handleViewDetails}
                                onHoverDorm={setHoveredDormId}
                                scrollContainerRef={scrollContainerRef}
                                onHoveringChange={setIsCarouselHovering}
                            />
                        )}

                        {isMapView && filteredDorms.length > 0 && visibleInMap.length === 0 && (
                            <MapEmptyViewportOverlay t={t} />
                        )}
                    </div>
                )}
            </div>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                language={language === 'zh' ? 'zh' : 'en'}
            />

            {flyingHeart && (
                <FlyingHeart
                    startX={flyingHeart.x}
                    startY={flyingHeart.y}
                    targetX={flyingHeart.targetX}
                    targetY={flyingHeart.targetY}
                    onComplete={() => setFlyingHeart(null)}
                />
            )}
        </div>
    );
};

export default DormList;
