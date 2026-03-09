import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dorm } from '../../../types/housing';
import { getPriceRangeFromData } from '../../../constants/housing/pricing';
import { useDormData } from '../../../contexts/DormDataContext';
import { useHousingFilters } from '../../../contexts/HousingContext';
import { useSharedDormInteraction } from '../../../contexts/DormUserInteractionContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { Language } from '../../../types';
import { filterAndSortDorms, normalizePriceRange } from './filtering';
import { DormListText } from './types';
import {
  DEFAULT_FAVORITES_TARGET,
  DEFAULT_TOGGLE_TARGET,
} from './FavoriteFlyEffect';

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
    panToSeeDorms: 'Pan or zoom map to see dorms in other areas',
  },
  zh: {
    searchPlaceholder: '杈撳叆鎼滅储瀹胯垗...',
    noResults: '鏈壘鍒板尮閰嶅鑸�',
    noResultsDesc: '娌℃湁瀹胯垗鍖归厤褰撳墠绛涢€夋潯浠讹紝璇峰皾璇曡皟鏁寸瓫閫夋垨娓呯┖閮ㄥ垎鏉′欢銆�',
    clearFilters: '娓呯┖鍏ㄩ儴绛涢€�',
    viewMap: '鍦板浘瑙嗗浘',
    viewList: '鍒楄〃瑙嗗浘',
    results: '涓粨鏋�',
    mapNoResults: '褰撳墠绛涢€夋潯浠朵笅鏆傛棤瀹胯垗銆�',
    clearPrice: '娓呴櫎浠锋牸绛涢€�',
    filters: '绛涢€�',
    noDormsInArea: '璇ュ尯鍩熸殏鏃犲鑸�',
    panToSeeDorms: '璇风Щ鍔ㄦ垨缂╂斁鍦板浘鏌ョ湅鍏朵粬鍖哄煙鐨勫鑸�',
  },
};

export const useDormListController = (language: Language) => {
  const navigate = useNavigate();
  const { dorms: allDorms } = useDormData();
  const { isSidebarOpen, favoritesIconRef, sidebarToggleButtonRef, mobileSidebarButtonRef } =
    useLayout();
  const { toggleFavorite, addToHistory, favorites } = useSharedDormInteraction();
  const [hasMountedMap, setHasMountedMap] = useState(false);
  const [flyingHeart, setFlyingHeart] = useState<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
  } | null>(null);
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
    clearAllFilters,
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
    [priceRange, priceLimits],
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
      amenityFilters.length,
      bathroomCountFilters.length,
      bathroomTypeFilters.length,
      bedCountFilters.length,
      communityFilters.length,
      facilityFilters.length,
      hasPriceFilter,
      housingTypeDetails,
      lifestyleFilters.length,
      livingConditionFilters.length,
      llcFilters.length,
      locationFilters.length,
      proximityFilters.length,
      requireAc,
    ],
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
      activeFilters.length,
      amenityFilters.length,
      bathroomCountFilters.length,
      bathroomTypeFilters.length,
      bedCountFilters.length,
      communityFilters.length,
      facilityFilters.length,
      hasPriceFilter,
      housingTypeDetails,
      lifestyleFilters.length,
      livingConditionFilters.length,
      llcFilters.length,
      locationFilters.length,
      proximityFilters.length,
      requireAc,
    ],
  );

  const normalizedPriceRange = useMemo<[number, number]>(
    () => normalizePriceRange(priceRange, priceLimits),
    [priceRange, priceLimits],
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
        sortBy,
      }),
    [
      activeFilters,
      allDorms,
      amenityFilters,
      bathroomCountFilters,
      bathroomTypeFilters,
      bedCountFilters,
      communityFilters,
      facilityFilters,
      housingTypeDetails,
      lifestyleFilters,
      livingConditionFilters,
      llcFilters,
      locationFilters,
      normalizedPriceRange,
      proximityFilters,
      requireAc,
      searchTerm,
      sortBy,
    ],
  );

  useEffect(() => {
    if (viewMode !== 'map' || filteredDorms.length === 0) {
      setIsCarouselHovering(false);
    }
  }, [viewMode, filteredDorms.length]);

  useEffect(() => {
    if (viewMode !== 'map' || filteredDorms.length === 0) {
      setVisibleInMap((current) => (current.length === 0 ? current : []));
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

  const handleToggleFavorite = (dorm: Dorm, event?: React.MouseEvent) => {
    const wasNotFavorite = !favoritesSet.has(dorm.id);

    if (wasNotFavorite && event) {
      let targetX: number;
      let targetY: number;

      if (isSidebarOpen && favoritesIconRef?.current) {
        const rect = favoritesIconRef.current.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      } else if (isSidebarOpen) {
        targetX = DEFAULT_FAVORITES_TARGET.x;
        targetY = DEFAULT_FAVORITES_TARGET.y;
      } else {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const toggleElement = isMobile
          ? mobileSidebarButtonRef?.current
          : sidebarToggleButtonRef?.current;

        if (toggleElement) {
          const rect = toggleElement.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        } else {
          targetX = DEFAULT_TOGGLE_TARGET.x;
          targetY = DEFAULT_TOGGLE_TARGET.y;
        }
      }

      setFlyingHeart({
        x: event.clientX,
        y: event.clientY,
        targetX,
        targetY,
      });
    }

    void toggleFavorite(dorm.id, dorm.name, dorm.name_zh);
  };

  return {
    t,
    filteredDorms,
    hasMountedMap,
    isMapView,
    isListView,
    hasActiveFilters,
    activeFilterCount,
    hasPriceFilter,
    favoritesSet,
    flyingHeart,
    setFlyingHeart,
    hoveredDormId,
    setHoveredDormId,
    isCarouselHovering,
    setIsCarouselHovering,
    visibleInMap,
    setVisibleInMap,
    scrollContainerRef,
    searchTerm,
    setSearchTerm,
    isFilterModalOpen,
    setIsFilterModalOpen,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    clearAllFilters,
    handleViewDetails,
    handleMapNoResultAction,
    handleToggleFavorite,
  };
};
