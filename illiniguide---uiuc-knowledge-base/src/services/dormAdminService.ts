// [SERVICE] Admin-only CRUD for dorm content overrides stored in Supabase.
// [服务] 管理员专用——宿舍内容覆盖项的增删改查（Supabase）。
import { supabase } from './supabase';
import { Dorm } from '../types/housing';

const TABLE = 'dorm_overrides';

/** Fields that admins may override. All are optional — only set ones are applied. */
export interface DormOverride {
    dorm_id: string;
    name?: string | null;
    name_zh?: string | null;
    description?: string | null;
    description_zh?: string | null;
    image_url?: string | null;
    price?: number | null;
    pros?: string[] | null;
    pros_zh?: string[] | null;
    cons?: string[] | null;
    cons_zh?: string[] | null;
    ac?: boolean | null;
    dining?: boolean | null;
    updated_at?: string;
    updated_by?: string;
}

/**
 * Fetch all overrides (public read — no auth required).
 */
async function getAllOverrides(): Promise<DormOverride[]> {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*');
    if (error) {
        console.error('[dormAdminService] getAllOverrides error:', error);
        return [];
    }
    return (data ?? []) as DormOverride[];
}

/**
 * Fetch the override record for a single dorm (null if none exists).
 */
async function getOverride(dormId: string): Promise<DormOverride | null> {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('dorm_id', dormId)
        .maybeSingle();
    if (error) {
        console.error('[dormAdminService] getOverride error:', error);
        return null;
    }
    return data as DormOverride | null;
}

/**
 * Save (upsert) an override record. Requires admin session.
 */
async function saveOverride(override: DormOverride): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE)
        .upsert(override, { onConflict: 'dorm_id' });
    if (error) {
        console.error('[dormAdminService] saveOverride error:', error);
        return false;
    }
    return true;
}

/**
 * Delete the override record for a dorm, reverting it to static data. Requires admin session.
 */
async function deleteOverride(dormId: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('dorm_id', dormId);
    if (error) {
        console.error('[dormAdminService] deleteOverride error:', error);
        return false;
    }
    return true;
}

/**
 * Merge a Dorm object with its override record.
 * Override fields take precedence over the static values when they are non-null.
 */
function applyOverride(dorm: Dorm, override: DormOverride | null | undefined): Dorm {
    if (!override) return dorm;
    return {
        ...dorm,
        ...(override.name != null && { name: override.name }),
        ...(override.name_zh != null && { name_zh: override.name_zh }),
        ...(override.description != null && { description: override.description }),
        ...(override.description_zh != null && { description_zh: override.description_zh }),
        ...(override.image_url != null && { imageUrl: override.image_url }),
        ...(override.price != null && { price: override.price }),
        ...(override.pros != null && { pros: override.pros }),
        ...(override.pros_zh != null && { pros_zh: override.pros_zh }),
        ...(override.cons != null && { cons: override.cons }),
        ...(override.cons_zh != null && { cons_zh: override.cons_zh }),
        ...(override.ac != null && { ac: override.ac }),
        ...(override.dining != null && { dining: override.dining }),
    };
}

/**
 * Apply a map of overrides (keyed by dorm_id) to a full dorm list.
 */
function applyOverridesToList(dorms: Dorm[], overrides: DormOverride[]): Dorm[] {
    const byId = new Map(overrides.map((o) => [o.dorm_id, o]));
    return dorms.map((d) => applyOverride(d, byId.get(d.id)));
}

export const dormAdminService = {
    getAllOverrides,
    getOverride,
    saveOverride,
    deleteOverride,
    applyOverride,
    applyOverridesToList,
};
