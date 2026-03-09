// [SERVICE] Read dorms from Supabase `dorms` table with static fallback.
// [服务] 从 Supabase `dorms` 表读取宿舍数据，静态数据作为 fallback。
import { supabase } from './supabase';
import { Dorm } from '../types/housing';
import { UIUC_DORMS } from '../constants/housing/dormData';

const TABLE = 'dorms';

/** Map a snake_case DB row to camelCase Dorm. */
function rowToDorm(row: Record<string, unknown>): Dorm {
    return {
        id: row.id as string,
        name: row.name as string,
        name_zh: (row.name_zh as string) ?? undefined,
        description: (row.description as string) ?? '',
        description_zh: (row.description_zh as string) ?? undefined,
        imageUrl: (row.image_url as string) ?? '',
        price: Number(row.price) || 0,
        priceRange: (row.price_range as Dorm['priceRange']) ?? '$',
        location: (row.location as Dorm['location']) ?? 'Main Quad',
        location_zh: (row.location_zh as string) ?? undefined,
        type: (row.type as Dorm['type']) ?? 'Traditional',
        type_zh: (row.type_zh as string) ?? undefined,
        housingType: (row.housing_type as Dorm['housingType']) ?? 'URH',
        ac: Boolean(row.ac),
        dining: (row.dining as Dorm['dining']) ?? 'nearby',
        bathroomType: (row.bathroom_type as Dorm['bathroomType']) ?? 'communal',
        lat: Number(row.lat) || 0,
        lng: Number(row.lng) || 0,
        tags: (row.tags as string[]) ?? [],
        structuredTags: (row.structured_tags as Dorm['structuredTags']) ?? undefined,
        categorizedTags: (row.categorized_tags as Dorm['categorizedTags']) ?? { livingConditions: [], facilities: [], lifestyle: [] },
        roomTypes: (row.room_types as Dorm['roomTypes']) ?? [],
        floorPlans: (row.floor_plans as Dorm['floorPlans']) ?? undefined,
        galleryImages: (row.gallery_images as string[]) ?? undefined,
        pros: (row.pros as string[]) ?? [],
        pros_zh: (row.pros_zh as string[]) ?? undefined,
        cons: (row.cons as string[]) ?? [],
        cons_zh: (row.cons_zh as string[]) ?? undefined,
    };
}

/** Fetch all dorms. Falls back to static data on failure. */
async function getAllDorms(): Promise<Dorm[]> {
    try {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) {
            console.error('[dormService] getAllDorms error:', error);
            return UIUC_DORMS;
        }
        if (!data || data.length === 0) {
            return UIUC_DORMS;
        }
        return data.map(rowToDorm);
    } catch (err) {
        console.error('[dormService] getAllDorms exception:', err);
        return UIUC_DORMS;
    }
}

/** Fetch a single dorm by ID. Falls back to static data on failure. */
async function getDormById(id: string): Promise<Dorm | undefined> {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            console.error('[dormService] getDormById error:', error);
            return UIUC_DORMS.find((d) => d.id === id);
        }
        if (!data) {
            return UIUC_DORMS.find((d) => d.id === id);
        }
        return rowToDorm(data);
    } catch (err) {
        console.error('[dormService] getDormById exception:', err);
        return UIUC_DORMS.find((d) => d.id === id);
    }
}

export const dormService = {
    getAllDorms,
    getDormById,
    rowToDorm,
};
