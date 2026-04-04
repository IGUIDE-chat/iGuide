/**
 * @file ./src/components/housing/hooks/useDormFilterBadge.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useMemo } from 'react';
import { useHousingFilters } from '../store/HousingContext';
import { getPriceRangeFromData } from '../constants/pricing';

export const useDormFilterBadge = () => {
  const {
    activeFilters,
    priceRange,
    locationFilters,
    bedCountFilters,
    bathroomCountFilters,
    bathroomTypeFilters,
    housingTypeDetails,
  } = useHousingFilters();

  const defaultPriceRange = getPriceRangeFromData();
  const hasPriceFilter =
    priceRange[0] !== defaultPriceRange[0] || priceRange[1] !== defaultPriceRange[1];

  return useMemo(() => {
    const hasActiveDormFilters =
      activeFilters.length > 0 ||
      hasPriceFilter ||
      housingTypeDetails !== 'ALL' ||
      locationFilters.length > 0 ||
      bedCountFilters.length > 0 ||
      bathroomCountFilters.length > 0 ||
      bathroomTypeFilters.length > 0;

    const activeDormFilterCount =
      (hasPriceFilter ? 1 : 0) +
      (housingTypeDetails !== 'ALL' ? 1 : 0) +
      locationFilters.length +
      bedCountFilters.length +
      bathroomCountFilters.length +
      bathroomTypeFilters.length +
      activeFilters.length;

    return {
      hasActiveDormFilters,
      activeDormFilterCount,
    };
  }, [
    activeFilters.length,
    bathroomCountFilters.length,
    bathroomTypeFilters.length,
    bedCountFilters.length,
    hasPriceFilter,
    housingTypeDetails,
    locationFilters.length,
  ]);
};
