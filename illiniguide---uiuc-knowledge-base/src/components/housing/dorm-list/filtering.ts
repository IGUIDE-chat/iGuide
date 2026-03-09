import { Dorm, DormTag, FilterOption } from '../../../types/housing';
import { DormFilterState } from './types';

// ── Legacy structured tag matchers (kept for backward compat) ───────────────

const matchesAmenityFilters = (dorm: Dorm, amenityFilters: string[]) => {
    if (amenityFilters.length === 0) return true;

    return amenityFilters.every((amenity) => {
        if (amenity === 'Elevator') return dorm.structuredTags?.elevator;
        if (amenity === 'Laundry') return dorm.structuredTags?.laundry;
        if (amenity === 'Study Rooms') return dorm.structuredTags?.studyRooms;
        if (amenity === 'Kitchen') return dorm.structuredTags?.kitchen;
        if (amenity === 'Parking') return dorm.structuredTags?.parking;
        if (amenity === 'Gym Nearby') return dorm.structuredTags?.gymNearby;
        if (amenity === 'Pool') return dorm.structuredTags?.pool;
        return true;
    });
};

const matchesCommunityFilters = (dorm: Dorm, communityFilters: string[]) => {
    if (communityFilters.length === 0) return true;

    return communityFilters.some((community) => {
        if (community === 'Gender-Inclusive') return dorm.structuredTags?.genderInclusive;
        if (community === 'Quiet Floors') return dorm.structuredTags?.quietFloors;
        if (community === 'Substance-Free') return dorm.structuredTags?.substanceFree;
        if (community === 'Pet-Friendly') return dorm.structuredTags?.petFriendly;
        return false;
    });
};

const matchesLlcFilters = (dorm: Dorm, llcFilters: string[]) => {
    if (llcFilters.length === 0) return true;
    return llcFilters.some((llc) => dorm.structuredTags?.llc?.includes(llc));
};

const matchesProximityFilters = (dorm: Dorm, proximityFilters: string[]) => {
    if (proximityFilters.length === 0) return true;

    return proximityFilters.some((proximity) => {
        if (proximity === 'Near Main Quad') return dorm.structuredTags?.nearMainQuad;
        if (proximity === 'Near Engineering') return dorm.structuredTags?.nearEngineering;
        if (proximity === 'Near Business') return dorm.structuredTags?.nearBusiness;
        if (proximity === 'Near ARC/CRCE') return dorm.structuredTags?.nearARC;
        if (proximity === 'Near Green Street') return dorm.structuredTags?.nearGreenStreet;
        if (proximity === 'Near Ikenberry Dining') return dorm.structuredTags?.nearIkenberryDining;
        return false;
    });
};

// ── New categorized tag matchers ────────────────────────────────────────────

/** All selected tags must be present in the dorm's categorized tags (AND logic). */
const matchesCategorizedTagFilters = (dorm: Dorm, filters: DormTag[]): boolean => {
    if (filters.length === 0) return true;
    if (!dorm.categorizedTags) return false;

    const allDormTags: DormTag[] = [
        ...(dorm.categorizedTags.livingConditions ?? []),
        ...(dorm.categorizedTags.facilities ?? []),
        ...(dorm.categorizedTags.lifestyle ?? []),
    ];

    return filters.every(tag => allDormTags.includes(tag));
};

// ── Sort ────────────────────────────────────────────────────────────────────

const sortDorms = (dorms: Dorm[], sortBy: string) => {
    return [...dorms].sort((a, b) => {
        switch (sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
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
        if (filters.housingTypeDetails !== 'ALL' && dorm.housingType !== filters.housingTypeDetails) {
            return false;
        }

        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        const searchMatch =
            dorm.name.toLowerCase().includes(lowerSearchTerm) ||
            dorm.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm));
        if (!searchMatch) return false;

        if (
            dorm.price < filters.normalizedPriceRange[0] ||
            dorm.price > filters.normalizedPriceRange[1]
        ) {
            return false;
        }

        if (filters.locationFilters.length > 0 && !filters.locationFilters.includes(dorm.location)) {
            return false;
        }
        if (filters.typeFilters.length > 0 && !filters.typeFilters.includes(dorm.type)) {
            return false;
        }
        if (
            filters.roomTypeFilters.length > 0 &&
            !filters.roomTypeFilters.some((roomType) => dorm.roomTypes?.includes(roomType))
        ) {
            return false;
        }

        // Legacy structured tag filters
        if (!matchesAmenityFilters(dorm, filters.amenityFilters)) return false;
        if (!matchesCommunityFilters(dorm, filters.communityFilters)) return false;
        if (!matchesLlcFilters(dorm, filters.llcFilters)) return false;
        if (!matchesProximityFilters(dorm, filters.proximityFilters)) return false;

        // New categorized tag filters (combined — AND logic)
        const allCategoryFilters: DormTag[] = [
            ...(filters.livingConditionFilters ?? []),
            ...(filters.facilityFilters ?? []),
            ...(filters.lifestyleFilters ?? []),
        ];
        if (!matchesCategorizedTagFilters(dorm, allCategoryFilters)) return false;

        // Legacy FilterOption filters
        if (filters.activeFilters.length === 0) return true;

        const matchesAC = filters.activeFilters.includes(FilterOption.AC) ? dorm.ac : true;
        const matchesDining = filters.activeFilters.includes(FilterOption.DINING_IN_BUILDING)
            ? dorm.dining === 'inside'
            : true;

        return matchesAC && matchesDining;
    });

    return sortDorms(filtered, filters.sortBy);
};
