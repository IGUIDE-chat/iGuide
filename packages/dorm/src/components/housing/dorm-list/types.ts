import {
  BathroomCountFilter,
  BathroomScope,
  BedCountFilter,
  DormTag,
  FilterOption,
} from "../types/index"

export interface DormListText {
  searchPlaceholder: string
  noResults: string
  noResultsDesc: string
  clearFilters: string
  viewMap: string
  viewList: string
  results: string
  mapNoResults: string
  clearPrice: string
  filters: string
  noDormsInArea: string
  panToSeeDorms: string
}

export interface DormFilterState {
  searchTerm: string
  activeFilters: FilterOption[]
  normalizedPriceRange: [number, number]
  locationFilters: string[]
  bedCountFilters: BedCountFilter[]
  bathroomCountFilters: BathroomCountFilter[]
  housingTypeDetails: "ALL" | "URH" | "PCH"
  livingConditionFilters: DormTag[]
  facilityFilters: DormTag[]
  lifestyleFilters: DormTag[]
  requireAc: boolean
  bathroomTypeFilters: BathroomScope[]
  sortBy: string
}
