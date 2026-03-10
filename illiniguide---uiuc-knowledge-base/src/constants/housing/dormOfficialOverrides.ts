import { Dorm } from '../../types/housing';
import { DormOverride, normalizeOverrideMedia } from './dormOfficialOverrideUtils';
import { PCH_OFFICIAL_OVERRIDES } from './dormOfficialOverridesPch';
import { URH_OFFICIAL_OVERRIDES_NORTH } from './dormOfficialOverridesUrhNorth';
import { URH_OFFICIAL_OVERRIDES_SOUTH } from './dormOfficialOverridesUrhSouth';

export const DORM_OFFICIAL_OVERRIDES: Record<string, DormOverride> = {
    ...URH_OFFICIAL_OVERRIDES_NORTH,
    ...URH_OFFICIAL_OVERRIDES_SOUTH,
    ...PCH_OFFICIAL_OVERRIDES,
};

export function applyDormOfficialOverride(dorm: Dorm): Dorm {
    const rawOverride = DORM_OFFICIAL_OVERRIDES[dorm.id];
    if (!rawOverride) {
        return dorm;
    }
    const override = normalizeOverrideMedia(rawOverride);

    return {
        ...dorm,
        ...override,
        structuredTags: override.structuredTags
            ? {
                ...(dorm.structuredTags ?? {}),
                ...override.structuredTags,
            }
            : dorm.structuredTags,
        categorizedTags: override.categorizedTags ?? dorm.categorizedTags,
        floorPlans: override.floorPlans ?? dorm.floorPlans,
        galleryImages: override.galleryImages ?? dorm.galleryImages,
    };
}
