import { Language } from '../../types';
import { BathroomScope, DiningType, Dorm, DormTag, TagCategory } from '../../types/housing';

export interface LocalizedCopy {
    en: string;
    zh: string;
}

export interface LocalizedOption<T extends string> extends LocalizedCopy {
    value: T;
}

export interface TagDefinition extends LocalizedCopy {
    category: TagCategory;
    /** 1 = highest priority. Tags with priority >= 7 are excluded from hero display. */
    priority: number;
    cardLayer: 'secondary' | 'vibe' | 'hidden';
    cardPriority: number;
    cardTone: 'positive' | 'neutral' | 'muted';
}

export interface HousingTypeOption extends LocalizedOption<Dorm['housingType']> {
    shortLabel: string;
    description: LocalizedCopy;
    badgeClassName: string;
}

export const TAG_REGISTRY: Record<DormTag, TagDefinition> = {
    noAc: {
        en: 'No AC',
        zh: '无空调',
        category: 'livingConditions',
        priority: 1,
        cardLayer: 'hidden',
        cardPriority: 99,
        cardTone: 'muted',
    },
    newlyRenovated: {
        en: 'Newly Renovated',
        zh: '设施全新',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 1,
        cardTone: 'neutral',
    },
    olderBuilding: {
        en: 'Older Building',
        zh: '设施较旧',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 8,
        cardTone: 'muted',
    },
    gym: {
        en: 'Gym',
        zh: '健身房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 4,
        cardTone: 'neutral',
    },
    musicRooms: {
        en: 'Music Rooms',
        zh: '琴房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 3,
        cardTone: 'neutral',
    },
    convenienceStore: {
        en: 'Convenience Store',
        zh: '便利店',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 5,
        cardTone: 'neutral',
    },
    studyLounge: {
        en: 'Study Lounge',
        zh: '自习室',
        category: 'facilities',
        priority: 6,
        cardLayer: 'secondary',
        cardPriority: 7,
        cardTone: 'neutral',
    },
    laundry: {
        en: 'Laundry',
        zh: '洗衣房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'hidden',
        cardPriority: 99,
        cardTone: 'neutral',
    },
    kitchen: {
        en: 'Kitchen',
        zh: '厨房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'hidden',
        cardPriority: 99,
        cardTone: 'neutral',
    },
    busStop: {
        en: 'Bus Stop',
        zh: '公交站',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 6,
        cardTone: 'neutral',
    },
    quiet: {
        en: 'Quiet',
        zh: '安静',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 1,
        cardTone: 'positive',
    },
    socialParty: {
        en: 'Social / Party Vibe',
        zh: '社交活跃',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
        cardTone: 'positive',
    },
    internationalFriendly: {
        en: 'International Friendly',
        zh: '国际生友好',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 3,
        cardTone: 'positive',
    },
    llc: {
        en: 'LLC Community',
        zh: 'LLC 社群',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 4,
        cardTone: 'positive',
    },
    artsyCreative: {
        en: 'Artsy / Creative',
        zh: '艺术氛围',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
        cardTone: 'positive',
    },
};

export const TAGS_BY_CATEGORY: Record<TagCategory, DormTag[]> = {
    livingConditions: ['noAc', 'newlyRenovated', 'olderBuilding'],
    facilities: ['gym', 'musicRooms', 'convenienceStore', 'studyLounge', 'laundry', 'kitchen', 'busStop'],
    lifestyle: ['quiet', 'socialParty', 'internationalFriendly', 'llc', 'artsyCreative'],
};

export const CATEGORY_LABELS: Record<TagCategory, LocalizedCopy> = {
    livingConditions: { en: 'Living Conditions', zh: '居住条件' },
    facilities: { en: 'Facilities', zh: '配套设施' },
    lifestyle: { en: 'Lifestyle', zh: '生活方式' },
};

export const FILTERABLE_LIVING_CONDITION_TAGS: DormTag[] = ['newlyRenovated'];

export const HOUSING_TYPE_OPTIONS: HousingTypeOption[] = [
    {
        value: 'URH',
        shortLabel: 'URH',
        en: 'University Housing',
        zh: '校内宿舍',
        description: {
            en: 'Official university residence halls',
            zh: '学校官方宿舍',
        },
        badgeClassName: 'bg-illini-orange/15 text-illini-orange',
    },
    {
        value: 'PCH',
        shortLabel: 'PCH',
        en: 'Private Certified',
        zh: '认证校外宿舍',
        description: {
            en: 'Private certified housing',
            zh: '经过认证的校外住宿',
        },
        badgeClassName: 'bg-blue-100 text-illini-blue',
    },
];

export const LOCATION_PRESETS: LocalizedOption<string>[] = [
    { value: 'Ikenberry', en: 'Ikenberry', zh: 'Ikenberry' },
    { value: 'Main Quad', en: 'Main Quad', zh: 'Main Quad' },
    { value: 'PAR/FAR', en: 'PAR/FAR', zh: 'PAR/FAR' },
    { value: 'Campustown', en: 'Campustown', zh: 'Campustown' },
    { value: 'South Campus', en: 'South Campus', zh: 'South Campus' },
];

export const DINING_OPTIONS: LocalizedOption<DiningType>[] = [
    { value: 'inside', en: 'On-site', zh: '楼内' },
    { value: 'nearby', en: 'Nearby', zh: '附近' },
    { value: 'none', en: 'None', zh: '无' },
];

export const BATHROOM_TYPE_OPTIONS: LocalizedOption<BathroomScope>[] = [
    { value: 'communal', en: 'Communal', zh: '公共卫浴' },
    { value: 'semi-private', en: 'Semi-Private', zh: '半独立卫浴' },
    { value: 'private', en: 'Private', zh: '独立卫浴' },
];

export const LLC_OPTIONS = [
    'Beckwith Residential Community',
    'Business LLC',
    'Exploration LLC',
    'Global Crossroads LLC',
    'Health Professions LLC',
    'Honors LLC',
    'Innovation LLC',
    'Intersections LLC',
    'LEADS LLC',
    'Scholars Community',
    'Sustainability LLC',
    'Transfer Community',
    'Unit One LLC',
    'WIMSE LLC',
] as const;

export function getLocalizedLabel(copy: LocalizedCopy, language: Language) {
    return language === 'zh' ? copy.zh : copy.en;
}

export function getTagDisplay(tag: DormTag, language: Language) {
    return getLocalizedLabel(TAG_REGISTRY[tag], language);
}

export function getHousingTypeMeta(housingType: Dorm['housingType']) {
    return HOUSING_TYPE_OPTIONS.find((option) => option.value === housingType) ?? HOUSING_TYPE_OPTIONS[0];
}

export function getDimensionOptionLabel<T extends string>(
    options: ReadonlyArray<LocalizedOption<T>>,
    value: T,
    language: Language
) {
    const option = options.find((item) => item.value === value);
    return option ? getLocalizedLabel(option, language) : value;
}

export function mergeLocationOptions(locationsFromData: string[]) {
    const seen = new Set<string>();
    const merged: LocalizedOption<string>[] = [];

    for (const preset of LOCATION_PRESETS) {
        if (locationsFromData.includes(preset.value)) {
            merged.push(preset);
            seen.add(preset.value);
        }
    }

    for (const location of locationsFromData) {
        if (seen.has(location)) {
            continue;
        }

        merged.push({
            value: location,
            en: location,
            zh: location,
        });
        seen.add(location);
    }

    return merged;
}
