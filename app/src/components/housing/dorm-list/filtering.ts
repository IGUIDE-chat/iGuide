/**
 * @file ./src/components/housing/dorm-list/filtering.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Dorm, type DormTag, FilterOption } from "../types/index";
import { type DormFilterState } from "./types";
import { deriveRoomOptions } from "../../../utils/roomOptions";

// ── Categorized tag matchers ─────────────────────────────────────────────

/** All selected tags must be present in the dorm's categorized tags (AND logic). */
const matchesCategorizedTagFilters = (
  dorm: Dorm,
  filters: DormTag[]
): boolean => {
  if (filters.length === 0) {return true;}
  if (!dorm.categorizedTags) {return false;}

  const allDormTags: DormTag[] = new Set([
    ...(dorm.categorizedTags.livingConditions ?? []),
    ...(dorm.categorizedTags.facilities ?? []),
    ...(dorm.categorizedTags.lifestyle ?? []),
  ]);

  return filters.every((tag) => allDormTags.has(tag));
};

// ── Sort ────────────────────────────────────────────────────────────────────

const sortDorms = (dorms: Dorm[], sortBy: string) => {
  return [...dorms].toSorted((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });
};

export const normalizePriceRange = (
  range: [number, number],
  limits: [number, number]
): [number, number] => {
  const minLimit = limits[0];
  const maxLimit = limits[1];
  const minGap = Math.max(0, Math.min(100, maxLimit - minLimit));

  let min = Number.isFinite(range[0]) ? range[0] : minLimit;
  let max = Number.isFinite(range[1]) ? range[1] : maxLimit;
  min = Math.max(minLimit, Math.min(maxLimit, min));
  max = Math.max(minLimit, Math.min(maxLimit, max));

  if (min > max) {
    [min, max] = [max, min];
  }

  if (minGap > 0 && max - min < minGap) {
    min = Math.max(minLimit, Math.min(min, maxLimit - minGap));
    max = min + minGap;
  }

  return [Math.round(min), Math.round(max)];
};

export const filterAndSortDorms = (dorms: Dorm[], filters: DormFilterState) => {
  const filtered = dorms.filter((dorm) => {
    const roomOptions =
      dorm.roomOptions ??
      deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;

    if (
      filters.housingTypeDetails !== "ALL" &&
      dorm.housingType !== filters.housingTypeDetails
    ) {
      return false;
    }

    const lowerSearchTerm = filters.searchTerm.toLowerCase();
    const searchMatch =
      dorm.name.toLowerCase().includes(lowerSearchTerm) ||
      dorm.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm));
    if (!searchMatch) {return false;}

    if (
      dorm.price < filters.normalizedPriceRange[0] ||
      dorm.price > filters.normalizedPriceRange[1]
    ) {
      return false;
    }

    if (
      filters.locationFilters.length > 0 &&
      !filters.locationFilters.includes(dorm.location)
    ) {
      return false;
    }
    if (
      filters.bedCountFilters.length > 0 &&
      !filters.bedCountFilters.some((threshold) =>
        roomOptions.some(
          (option) => option.bedCount != null && option.bedCount >= threshold
        )
      )
    ) {
      return false;
    }
    if (
      filters.bathroomCountFilters.length > 0 &&
      !filters.bathroomCountFilters.some((threshold) =>
        roomOptions.some((option) => {
          if (threshold === 0) {
            return (
              option.bathroomScope === "communal" && option.bathroomCount === 0
            );
          }
          return (
            option.bathroomCount != null && option.bathroomCount >= threshold
          );
        })
      )
    ) {
      return false;
    }

    // Categorized tag filters (combined — AND logic)
    const allCategoryFilters: DormTag[] = [
      ...(filters.livingConditionFilters ?? []),
      ...(filters.facilityFilters ?? []),
      ...(filters.lifestyleFilters ?? []),
    ];
    if (!matchesCategorizedTagFilters(dorm, allCategoryFilters)) {return false;}

    // AC filter
    if (filters.requireAc && !dorm.ac) {return false;}

    // Bathroom type filter
    if (
      filters.bathroomTypeFilters.length > 0 &&
      !filters.bathroomTypeFilters.some((scope) =>
        roomOptions.some((option) => option.bathroomScope === scope)
      )
    ) {
      return false;
    }

    // Legacy FilterOption filters
    if (filters.activeFilters.length === 0) {return true;}

    const matchesAC = filters.activeFilters.includes(FilterOption.AC)
      ? dorm.ac
      : true;
    const matchesDining = filters.activeFilters.includes(
      FilterOption.DINING_IN_BUILDING
    )
      ? dorm.dining === "inside"
      : true;

    return matchesAC && matchesDining;
  });

  return sortDorms(filtered, filters.sortBy);
};
