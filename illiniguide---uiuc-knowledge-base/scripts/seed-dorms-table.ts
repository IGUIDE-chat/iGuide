/**
 * Seed script: Populates the `dorms` table from static UIUC_DORMS data.
 *
 * `dorm_overrides` is archived and must not be merged back into `dorms`,
 * otherwise stale legacy edits can overwrite the current canonical dataset.
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
import { UIUC_DORMS } from '../src/components/housing/constants/dormData';
import type { Dorm } from '../src/components/housing/types/index';
import { finalizeDormRecord, sanitizeFloorPlansForStorage } from '../src/utils/dormData';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
        dining_nearby_detail: dorm.diningNearbyDetail ?? null,
        lat: dorm.lat,
        lng: dorm.lng,
        tags: dorm.tags,
        structured_tags: dorm.structuredTags ?? {},
        categorized_tags: dorm.categorizedTags ?? {},
        bathroom_type: dorm.bathroomType,
        room_types: dorm.roomTypes,
        room_options: dorm.roomOptions ?? [],
        floor_plans: sanitizeFloorPlansForStorage(dorm.floorPlans) ?? [],
        gallery_images: dorm.galleryImages ?? [],
        pros: dorm.pros,
        pros_zh: dorm.pros_zh ?? [],
        cons: dorm.cons,
        cons_zh: dorm.cons_zh ?? [],
        application_fee: dorm.applicationFee ?? null,
        address: dorm.address ?? null,
        address_zh: dorm.address_zh ?? null,
        website: dorm.website ?? null,
    };
}

async function main() {
    console.log(`Seeding ${UIUC_DORMS.length} dorms into the dorms table...`);

    const rows = UIUC_DORMS.map((dorm) => dormToRow(finalizeDormRecord(dorm)));

    // Upsert into dorms table
    const { error: upsertErr } = await supabase
        .from('dorms')
        .upsert(rows, { onConflict: 'id' });

    if (upsertErr) {
        console.error('Upsert failed:', upsertErr);
        process.exit(1);
    }

    console.log(`Successfully seeded ${rows.length} dorm(s).`);

    // Verify row count after sync.
    const { count } = await supabase.from('dorms').select('*', { count: 'exact', head: true });
    console.log(`Verification: dorms table now has ${count} row(s).`);
}

main().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});
