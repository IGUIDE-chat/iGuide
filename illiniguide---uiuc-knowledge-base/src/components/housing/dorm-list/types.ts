import { FilterOption, RoomType } from '../../../types/housing';

export interface DormListText {
    searchPlaceholder: string;
    noResults: string;
    noResultsDesc: string;
    clearFilters: string;
    viewMap: string;
    viewList: string;
    results: string;
    mapNoResults: string;
    clearPrice: string;
    filters: string;
    noDormsInArea: string;
    panToSeeDorms: string;
}

export interface DormFilterState {
    searchTerm: string;
    activeFilters: FilterOption[];
    normalizedPriceRange: [number, number];
    locationFilters: string[];
    typeFilters: string[];
    roomTypeFilters: RoomType[];
    housingTypeDetails: 'ALL' | 'URH' | 'PCH';
    amenityFilters: string[];
    communityFilters: string[];
    llcFilters: string[];
    proximityFilters: string[];
    sortBy: string;
}
