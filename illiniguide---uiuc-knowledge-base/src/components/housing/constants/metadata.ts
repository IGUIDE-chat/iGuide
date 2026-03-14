/**
 * @file ./src/components/housing/constants/metadata.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { Language } from '../../../types';
import { BathroomScope, BathroomType, DiningType, Dorm, DormTag, TagCategory } from '../types/index';
import {
    Snowflake, Hammer, Building2, Dumbbell, Music, Store,
    BookOpen, WashingMachine, CookingPot, Bus,
    Monitor, LibraryBig, Volume2, PartyPopper, Globe, GraduationCap, Palette,
    UsersRound,
} from 'lucide-react';
import { ComponentType } from 'react';

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
    icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
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
        icon: Snowflake,
    },
    newlyRenovated: {
        en: 'Newly Renovated',
        zh: '设施全新',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 1,
        cardTone: 'neutral',
        icon: Hammer,
    },
    olderBuilding: {
        en: 'Older Building',
        zh: '设施较旧',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 8,
        cardTone: 'muted',
        icon: Building2,
    },
    gym: {
        en: 'Gym',
        zh: '健身房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 4,
        cardTone: 'neutral',
        icon: Dumbbell,
    },
    musicRooms: {
        en: 'Music Rooms',
        zh: '音乐房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 3,
        cardTone: 'neutral',
        icon: Music,
    },
    computerLab: {
        en: 'Computer Lab',
        zh: '电脑房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 3,
        cardTone: 'neutral',
        icon: Monitor,
    },
    library: {
        en: 'Library',
        zh: '图书室',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 4,
        cardTone: 'neutral',
        icon: LibraryBig,
    },
    convenienceStore: {
        en: 'Convenience Store',
        zh: '便利店',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 5,
        cardTone: 'neutral',
        icon: Store,
    },
    studyLounge: {
        en: 'Study Lounge',
        zh: '自习室',
        category: 'facilities',
        priority: 6,
        cardLayer: 'secondary',
        cardPriority: 7,
        cardTone: 'neutral',
        icon: BookOpen,
    },
    laundry: {
        en: 'Laundry',
        zh: '洗衣房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'hidden',
        cardPriority: 99,
        cardTone: 'neutral',
        icon: WashingMachine,
    },
    kitchen: {
        en: 'Kitchen',
        zh: '厨房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'secondary',
        cardPriority: 10,
        cardTone: 'neutral',
        icon: CookingPot,
    },
    busStop: {
        en: 'Bus Stop',
        zh: '公交站',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 6,
        cardTone: 'neutral',
        icon: Bus,
    },
    quiet: {
        en: 'Quiet',
        zh: '安静',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 1,
        cardTone: 'positive',
        icon: Volume2,
    },
    socialParty: {
        en: 'Social / Party Vibe',
        zh: '社交活跃',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
        cardTone: 'positive',
        icon: PartyPopper,
    },
    internationalFriendly: {
        en: 'International Friendly',
        zh: '国际生友好',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 3,
        cardTone: 'positive',
        icon: Globe,
    },
    llc: {
        en: 'LLC Community',
        zh: 'LLC 社群',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 4,
        cardTone: 'positive',
        icon: GraduationCap,
    },
    artsyCreative: {
        en: 'Artsy / Creative',
        zh: '艺术氛围',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
        cardTone: 'positive',
        icon: Palette,
    },
    genderInclusive: {
        en: 'Gender-Inclusive',
        zh: '性别包容',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 5,
        cardTone: 'positive',
        icon: UsersRound,
    },
};

export const TAGS_BY_CATEGORY: Record<TagCategory, DormTag[]> = {
    livingConditions: ['noAc', 'newlyRenovated', 'olderBuilding'],
    facilities: ['gym', 'musicRooms', 'computerLab', 'library', 'convenienceStore', 'studyLounge', 'laundry', 'kitchen', 'busStop'],
    lifestyle: ['quiet', 'socialParty', 'internationalFriendly', 'llc', 'artsyCreative', 'genderInclusive'],
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

export const BATHROOM_SCOPE_OPTIONS: LocalizedOption<BathroomScope>[] = [
    { value: 'communal', en: 'Communal', zh: '公共卫浴' },
    { value: 'semi-private', en: 'Semi-Private', zh: '半独立卫浴' },
    { value: 'private', en: 'Private', zh: '独立卫浴' },
];

export const BATHROOM_TYPE_OPTIONS: LocalizedOption<BathroomType>[] = [
    ...BATHROOM_SCOPE_OPTIONS,
    { value: 'mixed', en: 'Mixed', zh: '混合卫浴' },
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
    return getLocalizedLabel(TAG_REGISTRY[tag] ?? { en: tag, zh: tag }, language);
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
