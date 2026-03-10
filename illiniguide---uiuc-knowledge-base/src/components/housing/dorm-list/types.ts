import { BathroomCountFilter, BathroomScope, BedCountFilter, DormTag, FilterOption } from '../../../types/housing';

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
    bedCountFilters: BedCountFilter[];
    bathroomCountFilters: BathroomCountFilter[];
    housingTypeDetails: 'ALL' | 'URH' | 'PCH';
    // Categorized tag filters
    livingConditionFilters: DormTag[];
    facilityFilters: DormTag[];
    lifestyleFilters: DormTag[];
    // Structured filters
    requireAc: boolean;
    bathroomTypeFilters: BathroomScope[];
    sortBy: string;
}
