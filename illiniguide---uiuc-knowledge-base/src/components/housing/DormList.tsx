import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dorm } from '../../types/housing';
import { UIUC_DORMS } from '../../constants/housing/dormData';
import { getPriceRangeFromData } from '../../constants/housing/pricing';
import DormMap from './DormMap';
import { FilterModal } from './FilterModal';
import { useHousingFilters } from '../../contexts/HousingContext';
import { useSharedDormInteraction } from '../../contexts/DormUserInteractionContext';
import { Language } from '../../types';
import DormListHeader from './dorm-list/DormListHeader';
import DormGrid from './dorm-list/DormGrid';
import MapCarousel from './dorm-list/MapCarousel';
import { ListEmptyState, MapEmptyViewportOverlay, MapNoResultsOverlay } from './dorm-list/EmptyStates';
import { filterAndSortDorms, normalizePriceRange } from './dorm-list/filtering';
import { DormListText } from './dorm-list/types';

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
        noResultsDesc: '没有宿舍匹配当前筛选条件。',
        clearFilters: '清空全部筛选',
        viewMap: '地图视图',
        viewList: '列表视图',
        results: '个结果',
        mapNoResults: '当前筛选下暂无宿舍。',
        clearPrice: '清除价格筛选',
        filters: '筛选',
        noDormsInArea: '该区域暂无宿舍',
        panToSeeDorms: '请移动地图查看其他区域的宿舍'
    }
};

const DormList: React.FC<DormListProps> = ({ language }) => {
    const navigate = useNavigate();
    const { toggleFavorite, addToHistory, favorites } = useSharedDormInteraction();
    const [hasMountedMap, setHasMountedMap] = useState(false);
    const [hoveredDormId, setHoveredDormId] = useState<string | null>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isCarouselHovering, setIsCarouselHovering] = useState(false);
    const [visibleInMap, setVisibleInMap] = useState<Dorm[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const {
        searchTerm,
        setSearchTerm,
        activeFilters,
        priceRange,
        setPriceRange,
        locationFilters,
        typeFilters,
        roomTypeFilters,
        housingTypeDetails,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        amenityFilters,
        communityFilters,
        llcFilters,
        proximityFilters,
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
    const priceLimits = useMemo<[number, number]>(() => getPriceRangeFromData(), []);
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
            typeFilters.length > 0 ||
            roomTypeFilters.length > 0 ||
            amenityFilters.length > 0 ||
            communityFilters.length > 0 ||
            llcFilters.length > 0 ||
            proximityFilters.length > 0,
        [
            activeFilters.length,
            hasPriceFilter,
            housingTypeDetails,
            locationFilters.length,
            typeFilters.length,
            roomTypeFilters.length,
            amenityFilters.length,
            communityFilters.length,
            llcFilters.length,
            proximityFilters.length
        ]
    );

    const activeFilterCount = useMemo(
        () =>
            (hasPriceFilter ? 1 : 0) +
            (housingTypeDetails !== 'ALL' ? 1 : 0) +
            locationFilters.length +
            typeFilters.length +
            roomTypeFilters.length +
            activeFilters.length +
            amenityFilters.length +
            communityFilters.length +
            llcFilters.length +
            proximityFilters.length,
        [
            hasPriceFilter,
            housingTypeDetails,
            locationFilters.length,
            typeFilters.length,
            roomTypeFilters.length,
            activeFilters.length,
            amenityFilters.length,
            communityFilters.length,
            llcFilters.length,
            proximityFilters.length
        ]
    );

    const normalizedPriceRange = useMemo<[number, number]>(
        () => normalizePriceRange(priceRange, priceLimits),
        [priceRange, priceLimits]
    );

    const filteredDorms = useMemo(
        () =>
            filterAndSortDorms(UIUC_DORMS, {
                searchTerm,
                activeFilters,
                normalizedPriceRange,
                locationFilters,
                typeFilters,
                roomTypeFilters,
                housingTypeDetails,
                amenityFilters,
                communityFilters,
                llcFilters,
                proximityFilters,
                sortBy
            }),
        [
            searchTerm,
            activeFilters,
            normalizedPriceRange,
            locationFilters,
            typeFilters,
            roomTypeFilters,
            housingTypeDetails,
            amenityFilters,
            communityFilters,
            llcFilters,
            proximityFilters,
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

    const handleToggleFavorite = (dorm: Dorm) => {
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

            <div className="flex-1 overflow-hidden bg-gray-50/50 relative flex flex-row">
                <div
                    className={`
                        h-full overflow-y-auto p-4 xl:p-6 transition-all duration-300 scrollbar-thin
                        ${isListView
                            ? 'w-full opacity-100 z-10'
                            : 'absolute inset-0 xl:static xl:w-[40%] xl:opacity-100 xl:border-r xl:border-gray-200 xl:z-auto opacity-0 pointer-events-none xl:pointer-events-auto'
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
                            language={language}
                        />
                    ) : (
                        <ListEmptyState t={t} onClearFilters={clearAllFilters} />
                    )}
                </div>

                {(hasMountedMap || isMapView) && (
                    <div
                        className={`
                            h-full transition-all duration-300 flex flex-col
                            ${isMapView
                                ? 'absolute inset-0 xl:static xl:w-[60%] opacity-100 z-20 xl:z-auto'
                                : 'absolute inset-0 xl:static xl:hidden opacity-0 pointer-events-none'
                            }
                        `}
                    >
                        <div className="flex-1 min-h-0 relative">
                            <div className="h-full w-full bg-gray-100">
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
        </div>
    );
};

export default DormList;
