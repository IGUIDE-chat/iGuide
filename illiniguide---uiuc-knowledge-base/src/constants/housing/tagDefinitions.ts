// [CONSTANTS] Tag registry — single source of truth for all dorm tags.
// [常量] 标签注册表——所有宿舍标签的唯一数据源。
import { DormTag, TagCategory } from '../../types/housing';

export interface TagDefinition {
    en: string;
    zh: string;
    category: TagCategory;
    /** 1 = highest priority (most differentiating). Tags with priority >= 7 are excluded from hero display. */
    priority: number;
    cardLayer: 'secondary' | 'vibe' | 'hidden';
    cardPriority: number;
}

export const TAG_REGISTRY: Record<DormTag, TagDefinition> = {
    // Living Conditions
    noAc: {
        en: 'No AC',
        zh: '无空调',
        category: 'livingConditions',
        priority: 1,
        cardLayer: 'hidden',
        cardPriority: 99,
    },
    newlyRenovated: {
        en: 'Newly Renovated',
        zh: '设施全新',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 1,
    },
    olderBuilding: {
        en: 'Older Building',
        zh: '设施较旧',
        category: 'livingConditions',
        priority: 3,
        cardLayer: 'secondary',
        cardPriority: 2,
    },

    // Facilities
    gym: {
        en: 'Gym',
        zh: '健身房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 4,
    },
    musicRooms: {
        en: 'Music Rooms',
        zh: '琴房',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 3,
    },
    convenienceStore: {
        en: 'Convenience Store',
        zh: '便利店',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 5,
    },
    studyLounge: {
        en: 'Study Lounge',
        zh: '自习室',
        category: 'facilities',
        priority: 6,
        cardLayer: 'secondary',
        cardPriority: 7,
    },
    laundry: {
        en: 'Laundry',
        zh: '洗衣房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'hidden',
        cardPriority: 99,
    },
    kitchen: {
        en: 'Kitchen',
        zh: '厨房',
        category: 'facilities',
        priority: 7,
        cardLayer: 'hidden',
        cardPriority: 99,
    },
    busStop: {
        en: 'Bus Stop',
        zh: '公交站',
        category: 'facilities',
        priority: 5,
        cardLayer: 'secondary',
        cardPriority: 6,
    },

    // Lifestyle
    quiet: {
        en: 'Quiet',
        zh: '安静',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 1,
    },
    socialParty: {
        en: 'Social / Party Vibe',
        zh: '社交活跃',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
    },
    internationalFriendly: {
        en: 'International Friendly',
        zh: '国际生友好',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 3,
    },
    llc: {
        en: 'LLC Community',
        zh: 'LLC 社群',
        category: 'lifestyle',
        priority: 4,
        cardLayer: 'vibe',
        cardPriority: 4,
    },
    artsyCreative: {
        en: 'Artsy / Creative',
        zh: '艺术氛围',
        category: 'lifestyle',
        priority: 3,
        cardLayer: 'vibe',
        cardPriority: 2,
    },
};

/** All tag IDs grouped by category, for rendering filter sections. */
export const TAGS_BY_CATEGORY: Record<TagCategory, DormTag[]> = {
    livingConditions: ['noAc', 'newlyRenovated', 'olderBuilding'],
    facilities: ['gym', 'musicRooms', 'convenienceStore', 'studyLounge', 'laundry', 'kitchen', 'busStop'],
    lifestyle: ['quiet', 'socialParty', 'internationalFriendly', 'llc', 'artsyCreative'],
};

/** Category display names for filter section headers. */
export const CATEGORY_LABELS: Record<TagCategory, { en: string; zh: string }> = {
    livingConditions: { en: 'Living Conditions', zh: '居住条件' },
    facilities: { en: 'Facilities', zh: '配套设施' },
    lifestyle: { en: 'Lifestyle', zh: '生活方式' },
};
