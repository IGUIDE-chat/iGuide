/**
 * @file ./src/components/housing/dorm-list/types.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import {
  type BathroomCountFilter,
  type BathroomScope,
  type BedCountFilter,
  type DormTag,
  type FilterOption,
} from "../types/index";

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
  housingTypeDetails: "ALL" | "URH" | "PCH";
  // Categorized tag filters
  livingConditionFilters: DormTag[];
  facilityFilters: DormTag[];
  lifestyleFilters: DormTag[];
  // Structured filters
  requireAc: boolean;
  bathroomTypeFilters: BathroomScope[];
  sortBy: string;
}
