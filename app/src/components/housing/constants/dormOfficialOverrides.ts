/**
 * @file ./src/components/housing/constants/dormOfficialOverrides.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { Dorm } from '../types/index';
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
