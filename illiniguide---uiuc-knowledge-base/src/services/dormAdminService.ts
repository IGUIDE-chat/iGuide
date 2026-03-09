// [SERVICE] Admin-only operations for the `dorms` table.
// [服务] 管理员专用——直接操作 `dorms` 表（替代旧的 override 模式）。
import { supabase } from './supabase';
import { Dorm } from '../types/housing';
import { UIUC_DORMS } from '../constants/housing/dormData';

const TABLE = 'dorms';

/** Partial update payload — camelCase fields mapped to snake_case for DB. */
export interface DormUpdate {
    name?: string;
    name_zh?: string | null;
    description?: string;
    description_zh?: string | null;
    image_url?: string | null;
    price?: number | null;
    location?: string | null;
    location_zh?: string | null;
    housing_type?: string | null;
    ac?: boolean;
    dining?: string;
    bathroom_type?: string | null;
    room_types?: string[] | null;
    categorized_tags?: Record<string, unknown> | null;
    application_fee?: number | null;
    floor_plans?: unknown[] | null;
    gallery_images?: string[] | null;
    pros?: string[] | null;
    pros_zh?: string[] | null;
    cons?: string[] | null;
    cons_zh?: string[] | null;
}

/**
 * Update a dorm record directly in the `dorms` table. Requires admin session.
 */
async function updateDorm(dormId: string, updates: DormUpdate): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', dormId);
    if (error) {
        console.error('[dormAdminService] updateDorm error:', error);
        return false;
    }
    return true;
}

/**
 * Reset a dorm to its original static data by overwriting the DB row.
 */
async function resetDormToStatic(dormId: string): Promise<boolean> {
    const staticDorm = UIUC_DORMS.find((d) => d.id === dormId);
    if (!staticDorm) {
        console.error('[dormAdminService] resetDormToStatic: dorm not found in static data:', dormId);
        return false;
    }

    const row: DormUpdate = {
        name: staticDorm.name,
        name_zh: staticDorm.name_zh ?? null,
        description: staticDorm.description,
        description_zh: staticDorm.description_zh ?? null,
        image_url: staticDorm.imageUrl,
        price: staticDorm.price,
        location: staticDorm.location,
        location_zh: staticDorm.location_zh ?? null,
        housing_type: staticDorm.housingType,
        ac: staticDorm.ac,
        dining: staticDorm.dining,
        bathroom_type: staticDorm.bathroomType,
        room_types: staticDorm.roomTypes,
        categorized_tags: staticDorm.categorizedTags as unknown as Record<string, unknown> ?? null,
        floor_plans: staticDorm.floorPlans ?? null,
        gallery_images: staticDorm.galleryImages ?? null,
        pros: staticDorm.pros,
        pros_zh: staticDorm.pros_zh ?? null,
        cons: staticDorm.cons,
        cons_zh: staticDorm.cons_zh ?? null,
    };

    return updateDorm(dormId, row);
}

export interface DormImageUploadResult {
    publicUrl: string | null;
    errorMessage?: string;
}

/**
 * Upload an image file to the Supabase Storage bucket 'dorm-images'.
 * Refreshes the auth session first so Storage RLS checks use fresh JWT claims.
 */
async function uploadDormImage(file: File): Promise<DormImageUploadResult> {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
        console.warn('[dormAdminService] refreshSession warning:', refreshError.message);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return {
            publicUrl: null,
            errorMessage: 'Not authenticated. Please sign in again.',
        };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `user_uploads/${fileName}`;

    const { error: uploadError } = await supabase
        .storage
        .from('dorm-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
        });

    if (uploadError) {
        console.error('[dormAdminService] uploadDormImage error:', uploadError);
        return {
            publicUrl: null,
            errorMessage: uploadError.message,
        };
    }

    const { data } = supabase.storage.from('dorm-images').getPublicUrl(filePath);
    if (!data?.publicUrl) {
        return {
            publicUrl: null,
            errorMessage: 'Upload succeeded but no public URL was returned.',
        };
    }

    return { publicUrl: data.publicUrl };
}

export const dormAdminService = {
    updateDorm,
    resetDormToStatic,
    uploadDormImage,
};
