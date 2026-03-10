import { useMemo } from 'react';
import { useHousingFilters } from '../contexts/HousingContext';
import { getPriceRangeFromData } from '../constants/housing/pricing';

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
