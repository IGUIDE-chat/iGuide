import { BathroomScope, Dorm, FloorPlan, RoomOption, RoomType } from '../types/housing';

const LEGACY_CODE_RE = /^(\d)B(\d)B$/;

const SPECIAL_ROOM_TYPES = new Set<RoomType>(['Studio', 'Suite', 'Cluster']);

const ROOM_CODE_LABELS_ZH: Record<string, string> = {
    Studio: 'Studio',
    '1B0B': '一人间 · 公共卫浴',
    '1B1B': '1人1卫',
    '2B0B': '2人间 · 公共卫浴',
    '2B1B': '2人1卫',
    '2B2B': '2人2卫',
    '3B0B': '3人间 · 公共卫浴',
    '3B1B': '3人1卫',
    '3B2B': '3人2卫',
    '3B3B': '3人3卫',
    '4B0B': '4人间 · 公共卫浴',
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

const BATH_SCOPE_LABELS: Record<BathroomScope, { en: string; zh: string }> = {
    communal: { en: 'Communal Bath', zh: '公共卫浴' },
    'semi-private': { en: 'Semi-Private Bath', zh: '半独立卫浴' },
    private: { en: 'Private Bath', zh: '独立卫浴' },
};

const BATH_SUMMARY_LABELS = {
    en: {
        mixed: 'Mixed Bath Options',
    },
    zh: {
        mixed: '多种卫浴类型',
    },
};

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
    if (text.includes('community bathroom') || text.includes('communal bathroom') || text.includes('public bathroom')) {
        return 'communal';
    }
    if (text.includes('semi-private')) {
        return 'semi-private';
    }
    if (text.includes('private bathroom') || text.includes('private studio')) {
        return 'private';
    }
    if (text.includes('shared bathroom')) {
        return fallback;
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

export function buildRoomLabelCode(option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope'>, specialType?: RoomType) {
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
    if (language !== 'zh') {
        return labelCode;
    }
    return ROOM_CODE_LABELS_ZH[labelCode as RoomType] ?? labelCode;
}

export function getBedCountLabel(bedCount: number | null, language: 'en' | 'zh') {
    if (bedCount == null) {
        return language === 'zh' ? '特殊房型' : 'Special Layout';
    }
    const labels = BED_LABELS[bedCount];
    if (!labels) {
        return language === 'zh' ? `${bedCount}人间` : `${bedCount}-Bed`;
    }
    return labels[language];
}

export function getBathroomScopeLabel(scope: BathroomScope, language: 'en' | 'zh') {
    return BATH_SCOPE_LABELS[scope][language];
}

export function getRoomDisplayLabel(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>,
    language: 'en' | 'zh'
) {
    if (option.labelCode) {
        return getRoomCodeLabel(option.labelCode, language);
    }
    const bedLabel = getBedCountLabel(option.bedCount, language);
    return `${bedLabel} · ${getBathroomScopeLabel(option.bathroomScope, language)}`;
}

export function getRoomDetailLabel(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>,
    language: 'en' | 'zh'
) {
    const bedLabel = getBedCountLabel(option.bedCount, language);
    if (option.bathroomScope === 'communal') {
        return `${bedLabel} · ${getBathroomScopeLabel(option.bathroomScope, language)}`;
    }
    if (option.bathroomCount != null) {
        return language === 'zh'
            ? `${bedLabel} · ${option.bathroomCount}卫`
            : `${bedLabel} · ${option.bathroomCount} Bath${option.bathroomCount > 1 ? 's' : ''}`;
    }
    return `${bedLabel} · ${getBathroomScopeLabel(option.bathroomScope, language)}`;
}

export function getRoomOptionKey(option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>) {
    return [option.labelCode ?? 'custom', option.bedCount ?? 'na', option.bathroomCount ?? 'na', option.bathroomScope].join(':');
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
        return BATH_SUMMARY_LABELS[language].mixed;
    }
    return getBathroomScopeLabel(dorm.bathroomType, language);
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
