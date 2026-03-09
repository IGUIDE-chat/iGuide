/**
 * Seed script: Populates the `dorms` table from static UIUC_DORMS data
 * and merges any existing admin overrides from `dorm_overrides`.
 *
 * Usage:
 *   npx tsx scripts/seed-dorms-table.ts
 *
 * Requires env vars:
 *   SUPABASE_URL          – e.g. https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  – service-role key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

// ── Inline the static dorm data (we cannot import from src in a standalone script context easily) ──
// Instead we dynamically import from the compiled source.
// For simplicity, use ts-node / tsx which can resolve TypeScript imports.

// We import directly from the source; tsx handles TS resolution.
import { UIUC_DORMS } from '../src/constants/housing/dormData';
import type { Dorm } from '../src/types/housing';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface DormOverride {
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
    dining?: string | null;
    location?: string | null;
    location_zh?: string | null;
    type?: string | null;
    type_zh?: string | null;
    housing_type?: string | null;
    room_types?: string[] | null;
    tags?: string[] | null;
    floor_plans?: any[] | null;
    gallery_images?: string[] | null;
}

function applyOverride(dorm: Dorm, override: DormOverride | undefined): Dorm {
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
        ...(override.dining != null && { dining: (override.dining === 'true' || override.dining === true as unknown) ? 'inside' : (override.dining === 'false' || override.dining === false as unknown) ? 'nearby' : override.dining as Dorm['dining'] }),
        ...(override.location != null && { location: override.location as Dorm['location'] }),
        ...(override.location_zh != null && { location_zh: override.location_zh }),
        ...(override.housing_type != null && { housingType: override.housing_type as Dorm['housingType'] }),
        ...(override.room_types != null && { roomTypes: override.room_types as Dorm['roomTypes'] }),
        ...(override.tags != null && { tags: override.tags }),
        ...(override.floor_plans != null && { floorPlans: override.floor_plans }),
        ...(override.gallery_images != null && { galleryImages: override.gallery_images }),
    };
}

/** Convert camelCase Dorm to snake_case DB row */
function dormToRow(dorm: Dorm) {
    return {
        id: dorm.id,
        name: dorm.name,
        name_zh: dorm.name_zh ?? null,
        description: dorm.description,
        description_zh: dorm.description_zh ?? null,
        image_url: dorm.imageUrl,
        price: dorm.price,
        price_range: dorm.priceRange,
        location: dorm.location,
        location_zh: dorm.location_zh ?? null,
        housing_type: dorm.housingType,
        ac: dorm.ac,
        dining: dorm.dining,
        lat: dorm.lat,
        lng: dorm.lng,
        tags: dorm.tags,
        structured_tags: dorm.structuredTags ?? {},
        categorized_tags: dorm.categorizedTags ?? {},
        bathroom_type: dorm.bathroomType,
        room_types: dorm.roomTypes,
        floor_plans: dorm.floorPlans ?? [],
        gallery_images: dorm.galleryImages ?? [],
        pros: dorm.pros,
        pros_zh: dorm.pros_zh ?? [],
        cons: dorm.cons,
        cons_zh: dorm.cons_zh ?? [],
    };
}

async function main() {
    console.log(`Seeding ${UIUC_DORMS.length} dorms into the dorms table...`);

    // 1. Fetch existing overrides
    const { data: overrides, error: overrideErr } = await supabase
        .from('dorm_overrides')
        .select('*');

    if (overrideErr) {
        console.warn('Could not fetch dorm_overrides (table may not exist):', overrideErr.message);
    }

    const overrideMap = new Map<string, DormOverride>(
        (overrides ?? []).map((o: DormOverride) => [o.dorm_id, o])
    );

    console.log(`Found ${overrideMap.size} override(s) to merge.`);

    // 2. Merge overrides into static data and convert to DB rows
    const rows = UIUC_DORMS.map((dorm) => {
        const merged = applyOverride(dorm, overrideMap.get(dorm.id));
        return dormToRow(merged);
    });

    // 3. Upsert into dorms table
    const { error: upsertErr } = await supabase
        .from('dorms')
        .upsert(rows, { onConflict: 'id' });

    if (upsertErr) {
        console.error('Upsert failed:', upsertErr);
        process.exit(1);
    }

    console.log(`Successfully seeded ${rows.length} dorm(s).`);

    // 4. Verify
    const { count } = await supabase.from('dorms').select('*', { count: 'exact', head: true });
    console.log(`Verification: dorms table now has ${count} row(s).`);
}

main().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});
