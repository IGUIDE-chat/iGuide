/**
 * @file ./src/components/housing/dorm-list/useDormListController.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dorm } from "../types/index";
import { getPriceRangeFromData } from "../constants/pricing";
import { useDormData } from "../store/DormDataContext";
import { useHousingFilters } from "../store/HousingContext";
import { useSharedDormInteraction } from "../store/DormUserInteractionContext";
import { useLayout } from "../../../contexts/LayoutContext";
import { Language } from "../../../types";
import { filterAndSortDorms, normalizePriceRange } from "./filtering";
import { DormListText } from "./types";
import {
  DEFAULT_FAVORITES_TARGET,
  DEFAULT_TOGGLE_TARGET,
} from "./favoriteConstants";

const DORM_LIST_TEXT: Record<Language, DormListText> = {
  en: {
    searchPlaceholder: "Type to search dorms...",
    noResults: "No dorms found",
    noResultsDesc:
      "We couldn't find any dorms matching your current filters. Try adjusting your search or clearing some filters.",
    clearFilters: "Clear all filters",
    viewMap: "Map View",
    viewList: "List View",
    results: "results",
    mapNoResults: "No dorms match your current filters.",
    clearPrice: "Clear price filter",
    filters: "Filters",
    noDormsInArea: "No dorms in this area",
    panToSeeDorms: "Pan or zoom map to see dorms in other areas",
  },
  zh: {
    searchPlaceholder: "输入搜索宿舍...",
    noResults: "未找到匹配宿舍",
    noResultsDesc: "没有宿舍匹配当前筛选条件，请尝试调整筛选或清空部分条件。",
    clearFilters: "清空全部筛选",
    viewMap: "地图视图",
    viewList: "列表视图",
    results: "条结果",
    mapNoResults: "当前筛选条件下暂无宿舍。",
    clearPrice: "清除价格筛选",
    filters: "筛选",
    noDormsInArea: "该区域暂无宿舍",
    panToSeeDorms: "请移动或缩放地图查看其他区域的宿舍",
  },
};

export const useDormListController = (language: Language) => {
  const navigate = useNavigate();
  const { dorms: allDorms } = useDormData();
  const {
    isSidebarOpen,
    favoritesIconRef,
    sidebarToggleButtonRef,
    mobileSidebarButtonRef,
  } = useLayout();
  const { toggleFavorite, addToHistory, favorites } =
    useSharedDormInteraction();
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
    livingConditionFilters,
    facilityFilters,
    lifestyleFilters,
    requireAc,
    bathroomTypeFilters,
    clearAllFilters,
  } = useHousingFilters();

  const t = DORM_LIST_TEXT[language];
  const isMapView = viewMode === "map";
  const isListView = !isMapView;
  const priceLimits = useMemo<[number, number]>(
    () => getPriceRangeFromData(allDorms),
    [allDorms]
  );
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const hasPriceFilter = useMemo(
    () => priceRange[0] !== priceLimits[0] || priceRange[1] !== priceLimits[1],
    [priceRange, priceLimits]
  );

  const hasActiveFilters = useMemo(
    () =>
      activeFilters.length > 0 ||
      hasPriceFilter ||
      housingTypeDetails !== "ALL" ||
      locationFilters.length > 0 ||
      bedCountFilters.length > 0 ||
      bathroomCountFilters.length > 0 ||
      livingConditionFilters.length > 0 ||
      facilityFilters.length > 0 ||
      lifestyleFilters.length > 0 ||
      requireAc ||
      bathroomTypeFilters.length > 0,
    [
      activeFilters.length,
      bathroomCountFilters.length,
      bathroomTypeFilters.length,
      bedCountFilters.length,
      facilityFilters.length,
      hasPriceFilter,
      housingTypeDetails,
      lifestyleFilters.length,
      livingConditionFilters.length,
      locationFilters.length,
      requireAc,
    ]
  );

  const activeFilterCount = useMemo(
    () =>
      (hasPriceFilter ? 1 : 0) +
      (housingTypeDetails !== "ALL" ? 1 : 0) +
      locationFilters.length +
      bedCountFilters.length +
      bathroomCountFilters.length +
      activeFilters.length +
      livingConditionFilters.length +
      facilityFilters.length +
      lifestyleFilters.length +
      (requireAc ? 1 : 0) +
      bathroomTypeFilters.length,
    [
      activeFilters.length,
      bathroomCountFilters.length,
      bathroomTypeFilters.length,
      bedCountFilters.length,
      facilityFilters.length,
      hasPriceFilter,
      housingTypeDetails,
      lifestyleFilters.length,
      livingConditionFilters.length,
      locationFilters.length,
      requireAc,
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
      bathroomCountFilters,
      bathroomTypeFilters,
      bedCountFilters,
      facilityFilters,
      housingTypeDetails,
      lifestyleFilters,
      livingConditionFilters,
      locationFilters,
      normalizedPriceRange,
      requireAc,
      searchTerm,
      sortBy,
    ]
  );

  useLayoutEffect(() => {
    if (viewMode !== "map" || filteredDorms.length === 0) {
      setIsCarouselHovering(false);
    }
  }, [viewMode, filteredDorms.length]);

  useLayoutEffect(() => {
    if (viewMode !== "map" || filteredDorms.length === 0) {
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
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 768;
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
