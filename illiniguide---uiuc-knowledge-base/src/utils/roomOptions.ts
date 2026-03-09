import { BathroomScope, Dorm, FloorPlan, RoomOption, RoomType } from '../types/housing';

const LEGACY_CODE_RE = /^(\d)B(\d)B$/;
const SPECIAL_ROOM_TYPES = new Set<RoomType>(['Studio', 'Suite', 'Cluster']);

const ROOM_CODE_LABELS_ZH: Record<string, string> = {
    Studio: 'Studio',
    '1B0B': '单人间 / 公共卫浴',
    '1B1B': '1人1卫',
    '2B0B': '双人间 / 公共卫浴',
    '2B1B': '2人1卫',
    '2B2B': '2人2卫',
    '3B0B': '三人间 / 公共卫浴',
    '3B1B': '3人1卫',
    '3B2B': '3人2卫',
    '3B3B': '3人3卫',
    '4B0B': '四人间 / 公共卫浴',
    '4B1B': '4人1卫',
    '4B2B': '4人2卫',
    '4B3B': '4人3卫',
    '4B4B': '4人4卫',
    '5B2B': '5人2卫',
    Suite: 'Suite',
    Cluster: 'Cluster',
};

const BED_LABELS: Record<number, { en: string; zh: string }> = {
    1: { en: 'Single', zh: '单人间' },
    2: { en: 'Double', zh: '双人间' },
    3: { en: 'Triple', zh: '三人间' },
    4: { en: 'Quad', zh: '四人间' },
    5: { en: '5-Bed', zh: '五人间' },
};

const BATHROOM_SCOPE_LABELS: Record<BathroomScope, { en: string; zh: string }> = {
    communal: { en: 'Communal Bath', zh: '公共卫浴' },
    'semi-private': { en: 'Semi-Private Bath', zh: '半独立卫浴' },
    private: { en: 'Private Bath', zh: '独立卫浴' },
};

const BATHROOM_TAG_LABELS: Record<BathroomScope, { en: string; zh: string }> = {
    communal: { en: 'Communal', zh: '公共卫浴' },
    'semi-private': { en: 'Semi-Private', zh: '半独立卫浴' },
    private: { en: 'Private', zh: '独立卫浴' },
};

const MIXED_BATHROOM_LABELS = {
    en: 'Mixed Bath Options',
    zh: '多种卫浴类型',
};

const MIXED_BATHROOM_TAG_LABELS = {
    en: 'Mixed',
    zh: '多种卫浴',
};

type RoomLabelOption = Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>;

export interface RoomOptionLabels {
    shortLabel: string;
    primaryLabel: string;
    secondaryLabel: string;
}

function parseLegacyRoomType(type?: RoomType) {
    if (!type) {
        return { bedCount: null, bathroomCount: null, specialType: undefined as RoomType | undefined };
    }

    if (SPECIAL_ROOM_TYPES.has(type)) {
        return {
            bedCount: type === 'Studio' ? 1 : null,
            bathroomCount: null,
            specialType: type,
        };
    }

    const match = LEGACY_CODE_RE.exec(type);
    if (!match) {
        return { bedCount: null, bathroomCount: null, specialType: undefined as RoomType | undefined };
    }

    return {
        bedCount: Number(match[1]),
        bathroomCount: Number(match[2]),
        specialType: undefined as RoomType | undefined,
    };
}

function inferScopeFromDescription(description: string | undefined, fallback: BathroomScope): BathroomScope {
    const text = description?.toLowerCase() ?? '';
    if (!text) return fallback;

    if (
        text.includes('community bathroom') ||
        text.includes('communal bathroom') ||
        text.includes('public bathroom')
    ) {
        return 'communal';
    }
    if (text.includes('semi-private')) {
        return 'semi-private';
    }
    if (text.includes('private bathroom') || text.includes('private studio')) {
        return 'private';
    }

    return fallback;
}

function inferBathroomCount(
    bedCount: number | null,
    legacyBathroomCount: number | null,
    scope: BathroomScope,
    description: string | undefined,
    specialType: RoomType | undefined
) {
    if (scope === 'communal') {
        return 0;
    }
    if (legacyBathroomCount != null) {
        return legacyBathroomCount;
    }

    const text = description?.toLowerCase() ?? '';
    const explicitCount = text.match(/(\d+)\s+bath/);
    if (explicitCount) {
        return Number(explicitCount[1]);
    }

    if (specialType === 'Studio' && scope === 'private') {
        return 1;
    }

    if (bedCount === 1 && scope === 'private') {
        return 1;
    }

    return null;
}

function isSpecialRoomType(labelCode?: string): labelCode is RoomType {
    return Boolean(labelCode && SPECIAL_ROOM_TYPES.has(labelCode as RoomType));
}

function buildRoomCountLabel(bedCount: number | null, bathroomCount: number, language: 'en' | 'zh') {
    if (language === 'zh') {
        return `${bedCount ?? '?'}人${bathroomCount}卫`;
    }
    return `${bedCount ?? '?'} Bed / ${bathroomCount} Bath${bathroomCount === 1 ? '' : 's'}`;
}

export function buildRoomLabelCode(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope'>,
    specialType?: RoomType
) {
    if (specialType && SPECIAL_ROOM_TYPES.has(specialType)) {
        return specialType;
    }
    if (option.bedCount == null) {
        return undefined;
    }
    if (option.bathroomScope === 'communal') {
        return `${option.bedCount}B0B`;
    }
    if (option.bathroomCount == null) {
        return undefined;
    }

    return `${option.bedCount}B${option.bathroomCount}B`;
}

export function getRoomCodeLabel(labelCode: string, language: 'en' | 'zh') {
    if (language === 'zh') {
        return ROOM_CODE_LABELS_ZH[labelCode as RoomType] ?? labelCode;
    }
    return labelCode;
}

export function getBedCountLabel(bedCount: number | null, language: 'en' | 'zh') {
    if (bedCount == null) {
        return language === 'zh' ? '特殊房型' : 'Special Layout';
    }

    const label = BED_LABELS[bedCount];
    if (label) {
        return label[language];
    }

    return language === 'zh' ? `${bedCount}人间` : `${bedCount}-Bed`;
}

export function getBathroomScopeLabel(scope: BathroomScope, language: 'en' | 'zh') {
    return BATHROOM_SCOPE_LABELS[scope][language];
}

export function getBathroomTagLabel(scope: BathroomScope, language: 'en' | 'zh') {
    return BATHROOM_TAG_LABELS[scope][language];
}

function getBathroomCountLabel(bathroomCount: number, language: 'en' | 'zh') {
    return language === 'zh'
        ? `${bathroomCount}卫`
        : `${bathroomCount} Bath${bathroomCount === 1 ? '' : 's'}`;
}

function getBathroomSecondaryLabel(option: RoomLabelOption, language: 'en' | 'zh') {
    if (option.bathroomScope === 'communal') {
        return getBathroomScopeLabel(option.bathroomScope, language);
    }

    if (option.bathroomCount != null && option.bathroomCount > 1) {
        return getBathroomCountLabel(option.bathroomCount, language);
    }

    return getBathroomScopeLabel(option.bathroomScope, language);
}

function hasMultipleBathroomVariants(option: RoomLabelOption, relatedOptions: RoomLabelOption[]) {
    if (option.bedCount == null || isSpecialRoomType(option.labelCode)) {
        return false;
    }

    const sameBedOptions = relatedOptions.filter((candidate) =>
        candidate.bedCount === option.bedCount && !isSpecialRoomType(candidate.labelCode)
    );

    const signatures = new Set(
        sameBedOptions.map((candidate) => `${candidate.bathroomScope}:${candidate.bathroomCount ?? 'na'}`)
    );

    return signatures.size > 1;
}

export function getRoomOptionLabels(
    option: RoomLabelOption,
    language: 'en' | 'zh',
    relatedOptions: RoomLabelOption[] = [option]
): RoomOptionLabels {
    const primaryLabel = isSpecialRoomType(option.labelCode)
        ? option.labelCode
        : getBedCountLabel(option.bedCount, language);
    const secondaryLabel = getBathroomSecondaryLabel(option, language);
    const shortLabel = hasMultipleBathroomVariants(option, relatedOptions)
        ? `${primaryLabel} / ${secondaryLabel}`
        : primaryLabel;

    return {
        shortLabel,
        primaryLabel,
        secondaryLabel,
    };
}

export function getRoomTypeCountLabel(count: number, language: 'en' | 'zh') {
    return language === 'zh'
        ? `共${count}种房型`
        : `${count} room type${count === 1 ? '' : 's'}`;
}

export function getRoomDisplayLabel(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>,
    language: 'en' | 'zh'
) {
    if (language === 'zh' && option.labelCode) {
        return getRoomCodeLabel(option.labelCode, language);
    }

    if (isSpecialRoomType(option.labelCode)) {
        return option.labelCode;
    }

    const bedLabel = getBedCountLabel(option.bedCount, language);

    if (option.bathroomScope === 'communal') {
        return `${bedLabel} / ${getBathroomScopeLabel(option.bathroomScope, language)}`;
    }

    if (option.bathroomCount != null) {
        return language === 'zh'
            ? buildRoomCountLabel(option.bedCount, option.bathroomCount, language)
            : `${bedLabel} / ${option.bathroomCount} Bath${option.bathroomCount === 1 ? '' : 's'}`;
    }

    return `${bedLabel} / ${getBathroomScopeLabel(option.bathroomScope, language)}`;
}

export function getRoomDetailLabel(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>,
    language: 'en' | 'zh'
) {
    if (isSpecialRoomType(option.labelCode)) {
        return option.labelCode;
    }

    const bedLabel = getBedCountLabel(option.bedCount, language);

    if (option.bathroomScope === 'communal') {
        return `${bedLabel} / ${getBathroomScopeLabel(option.bathroomScope, language)}`;
    }

    if (option.bathroomCount != null) {
        return language === 'zh'
            ? `${bedLabel} / ${option.bathroomCount}卫`
            : `${bedLabel} / ${option.bathroomCount} Bath${option.bathroomCount === 1 ? '' : 's'}`;
    }

    return `${bedLabel} / ${getBathroomScopeLabel(option.bathroomScope, language)}`;
}

export function getRoomOptionKey(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>
) {
    return [
        option.labelCode ?? 'custom',
        option.bedCount ?? 'na',
        option.bathroomCount ?? 'na',
        option.bathroomScope,
    ].join(':');
}

export function normalizeFloorPlan(plan: FloorPlan, fallbackScope: BathroomScope): FloorPlan {
    const parsed = parseLegacyRoomType(plan.type);
    const bedCount = plan.bedCount ?? parsed.bedCount;
    const bathroomScope = plan.bathroomScope ?? inferScopeFromDescription(plan.description, fallbackScope);
    const bathroomCount = plan.bathroomCount ?? inferBathroomCount(
        bedCount,
        parsed.bathroomCount,
        bathroomScope,
        plan.description,
        parsed.specialType
    );
    const labelCode = plan.labelCode ?? buildRoomLabelCode({ bedCount, bathroomCount, bathroomScope }, parsed.specialType);

    return {
        ...plan,
        bedCount,
        bathroomCount,
        bathroomScope,
        labelCode,
        type: plan.type ?? (labelCode as RoomType | undefined),
    };
}

export function deriveRoomOptions(floorPlans: FloorPlan[] | undefined, fallbackScope: BathroomScope) {
    const normalizedPlans = (floorPlans ?? []).map((plan) => normalizeFloorPlan(plan, fallbackScope));
    const options = Array.from(
        new Map(
            normalizedPlans.map((plan) => {
                const roomOption: RoomOption = {
                    bedCount: plan.bedCount ?? null,
                    bathroomCount: plan.bathroomCount ?? null,
                    bathroomScope: plan.bathroomScope ?? fallbackScope,
                    labelCode: plan.labelCode,
                };
                return [getRoomOptionKey(roomOption), roomOption];
            })
        ).values()
    );

    return {
        floorPlans: normalizedPlans,
        roomOptions: options,
        roomTypes: options
            .map((option) => option.labelCode)
            .filter((value): value is RoomType => Boolean(value)),
    };
}

export function getDormBathroomSummary(dorm: Dorm, language: 'en' | 'zh') {
    const roomOptions = dorm.roomOptions ?? deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;
    const scopes = Array.from(new Set(roomOptions.map((option) => option.bathroomScope)));

    if (scopes.length === 1) {
        return getBathroomScopeLabel(scopes[0], language);
    }
    if (scopes.length > 1) {
        return MIXED_BATHROOM_LABELS[language];
    }

    return getBathroomScopeLabel(dorm.bathroomType, language);
}

export function getDormBathroomTagSummary(dorm: Dorm, language: 'en' | 'zh') {
    const roomOptions = dorm.roomOptions ?? deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;
    const scopes = Array.from(new Set(roomOptions.map((option) => option.bathroomScope)));

    if (scopes.length === 1) {
        return getBathroomTagLabel(scopes[0], language);
    }
    if (scopes.length > 1) {
        return MIXED_BATHROOM_TAG_LABELS[language];
    }

    return getBathroomTagLabel(dorm.bathroomType, language);
}

export function normalizeDorm(dorm: Dorm): Dorm {
    const normalized = deriveRoomOptions(dorm.floorPlans, dorm.bathroomType);
    const scopes = Array.from(new Set(normalized.roomOptions.map((option) => option.bathroomScope)));
    const bathroomType = scopes.length === 1 ? scopes[0] : dorm.bathroomType;

    return {
        ...dorm,
        bathroomType,
        floorPlans: normalized.floorPlans,
        roomOptions: normalized.roomOptions,
        roomTypes: normalized.roomTypes,
    };
}
