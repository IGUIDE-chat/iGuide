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

import { createClient } from "@supabase/supabase-js"

// ── Inline the static dorm data (we cannot import from src in a standalone script context easily) ──
// Instead we dynamically import from the compiled source.
// For simplicity, use ts-node / tsx which can resolve TypeScript imports.

// We import directly from the source; tsx handles TS resolution.
import { UIUC_DORMS } from "../src/components/housing/constants/dormData"
import {
  type BathroomScope,
  type Dorm,
  type DormCategorizedTags,
} from "../src/components/housing/types/index"
import {
  finalizeDormRecord,
  sanitizeFloorPlansForStorage,
} from "../src/utils/dormData"
import {
  deriveRoomOptions,
  getPersistedBathroomType,
  getStorageBathroomScope,
  normalizeFloorPlan,
} from "../src/utils/roomOptions"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
type StoredFloorPlan = NonNullable<Dorm["floorPlans"]>[number]

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function hasNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item) => hasNonEmptyString(item))
}

function unionStringArrays(existing: string[], source: string[]): string[] {
  const seen = new Set(existing)
  const merged = [...existing]

  for (const item of source) {
    if (seen.has(item)) {
      continue
    }
    seen.add(item)
    merged.push(item)
  }

  return merged
}

function asObjectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function mergeStructuredTags(
  existingValue: unknown,
  sourceValue: unknown
): Record<string, unknown> {
  const existing = asObjectRecord(existingValue)
  const source = asObjectRecord(sourceValue)
  const merged: Record<string, unknown> = { ...source, ...existing }

  for (const key of new Set([
    ...Object.keys(source),
    ...Object.keys(existing),
  ])) {
    if (key === "llc") {
      merged[key] = unionStringArrays(
        asStringArray(existing[key]),
        asStringArray(source[key])
      )
      continue
    }

    if (
      typeof existing[key] === "boolean" ||
      typeof source[key] === "boolean"
    ) {
      merged[key] = Boolean(existing[key]) || Boolean(source[key])
      continue
    }

    if (existing[key] !== undefined) {
      merged[key] = existing[key]
      continue
    }

    merged[key] = source[key]
  }

  return merged
}

function mergeCategorizedTags(
  existingValue: unknown,
  sourceValue: unknown
): DormCategorizedTags {
  const existing = asObjectRecord(existingValue)
  const source = asObjectRecord(sourceValue)
  const livingConditions = unionStringArrays(
    asStringArray(existing.livingConditions),
    asStringArray(source.livingConditions)
  )
  const facilities = unionStringArrays(
    asStringArray(existing.facilities),
    asStringArray(source.facilities)
  )
  const lifestyle = unionStringArrays(
    asStringArray(existing.lifestyle),
    asStringArray(source.lifestyle)
  )
  const llcNames = unionStringArrays(
    asStringArray(existing.llcNames),
    asStringArray(source.llcNames)
  )

  return {
    ...source,
    ...existing,
    livingConditions:
      livingConditions as DormCategorizedTags["livingConditions"],
    facilities: facilities as DormCategorizedTags["facilities"],
    lifestyle: lifestyle as DormCategorizedTags["lifestyle"],
    ...(llcNames.length > 0 ? { llcNames } : {}),
  } as DormCategorizedTags
}

function getFloorPlanGroupKey(
  plan: StoredFloorPlan,
  fallbackType: Dorm["bathroomType"]
) {
  const fallbackScope = getStorageBathroomScope(fallbackType, [plan])
  const normalized = normalizeFloorPlan(plan, fallbackScope)
  const specialType =
    normalized.bedCount === null || normalized.bedCount === undefined
      ? (normalized.type ?? "")
      : ""
  return [
    normalized.officialName?.trim().toLowerCase() ?? "",
    normalized.bedCount ?? "na",
    normalized.sqft ?? "na",
    specialType,
  ].join("|")
}

function getFloorPlanCarryForwardKey(
  plan: StoredFloorPlan,
  fallbackType: Dorm["bathroomType"]
) {
  const fallbackScope = getStorageBathroomScope(fallbackType, [plan])
  const normalized = normalizeFloorPlan(plan, fallbackScope)
  return [
    normalized.officialName?.trim().toLowerCase() ?? "",
    normalized.bedCount ?? "na",
    normalized.description?.trim().toLowerCase() ?? "",
  ].join("|")
}

function mergeFloorPlans(
  sourcePlans: Dorm["floorPlans"],
  existingPlans: unknown,
  fallbackScope: Dorm["bathroomType"]
) {
  const nextSourcePlans = sanitizeFloorPlansForStorage(sourcePlans) ?? []
  const nextExistingPlans =
    sanitizeFloorPlansForStorage(existingPlans as Dorm["floorPlans"]) ?? []
  const sourceKeys = new Set(
    nextSourcePlans.map((plan) => getFloorPlanGroupKey(plan, fallbackScope))
  )
  const sourceCarryForwardKeys = new Set(
    nextSourcePlans.map((plan) =>
      getFloorPlanCarryForwardKey(plan, fallbackScope)
    )
  )

  if (nextExistingPlans.length === 0) {
    return nextSourcePlans
  }

  const existingByKey = new Map<string, StoredFloorPlan[]>()
  for (const plan of nextExistingPlans) {
    const key = getFloorPlanGroupKey(plan, fallbackScope)
    const bucket = existingByKey.get(key)
    if (bucket) {
      bucket.push(plan)
      continue
    }
    existingByKey.set(key, [plan])
  }

  const mergedPlans = nextSourcePlans.map((plan) => {
    const key = getFloorPlanGroupKey(plan, fallbackScope)
    const existingPlan = existingByKey.get(key)?.shift()
    if (!existingPlan) {
      return plan
    }

    return Object.assign(
      {},
      plan,
      hasNonEmptyArray(existingPlan.imageUrls)
        ? { imageUrls: existingPlan.imageUrls }
        : {},
      hasNonEmptyArray(existingPlan.photoUrls)
        ? { photoUrls: existingPlan.photoUrls }
        : {}
    )
  })

  const appendedExistingPlans = Array.from(existingByKey.entries()).flatMap(
    ([key, bucket]) =>
      sourceKeys.has(key)
        ? []
        : bucket.filter(
            (plan) =>
              !sourceCarryForwardKeys.has(
                getFloorPlanCarryForwardKey(plan, fallbackScope)
              )
          )
  )
  return (
    sanitizeFloorPlansForStorage([...mergedPlans, ...appendedExistingPlans]) ??
    []
  )
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
    dining_nearby_detail: dorm.diningNearbyDetail ?? null,
    lat: dorm.lat,
    lng: dorm.lng,
    tags: dorm.tags,
    structured_tags: dorm.structuredTags ?? {},
    categorized_tags: dorm.categorizedTags ?? {},
    bathroom_type: getPersistedBathroomType(
      dorm.bathroomType,
      dorm.roomOptions
    ),
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
  }
}

type DormRow = ReturnType<typeof dormToRow>

function mergeDormRow(
  sourceRow: DormRow,
  existingRow?: Record<string, unknown>
): DormRow {
  if (!existingRow) {
    return sourceRow
  }

  const floorPlanFallback = getStorageBathroomScope(
    "mixed",
    sourceRow.room_options as Array<{ bathroomScope?: BathroomScope | null }>
  )
  const floorPlans = mergeFloorPlans(
    sourceRow.floor_plans as Dorm["floorPlans"],
    existingRow.floor_plans,
    floorPlanFallback
  )
  const derived = deriveRoomOptions(floorPlans, floorPlanFallback)

  return {
    ...sourceRow,
    image_url: hasNonEmptyString(existingRow.image_url)
      ? existingRow.image_url
      : sourceRow.image_url,
    tags: unionStringArrays(
      asStringArray(existingRow.tags),
      asStringArray(sourceRow.tags)
    ),
    structured_tags: mergeStructuredTags(
      existingRow.structured_tags,
      sourceRow.structured_tags
    ),
    categorized_tags: mergeCategorizedTags(
      existingRow.categorized_tags,
      sourceRow.categorized_tags
    ),
    floor_plans: floorPlans,
    gallery_images: hasNonEmptyArray(
      existingRow.gallery_images as string[] | null | undefined
    )
      ? (existingRow.gallery_images as string[])
      : sourceRow.gallery_images,
    room_types: derived.roomTypes,
    room_options: derived.roomOptions,
  }
}

async function main() {
  console.log(`Seeding ${UIUC_DORMS.length} dorms into the dorms table...`)

  const sourceRows = UIUC_DORMS.map((dorm) =>
    dormToRow(finalizeDormRecord(dorm))
  )
  const { data: existingRows, error: existingRowsErr } = await supabase
    .from("dorms")
    .select(
      "id, image_url, tags, structured_tags, categorized_tags, floor_plans, gallery_images"
    )

  if (existingRowsErr) {
    console.error(
      "Failed to fetch existing dorm rows before reseed:",
      existingRowsErr
    )
    process.exit(1)
  }

  const existingById = new Map(
    (existingRows ?? []).map((row) => [row.id as string, row])
  )
  const rows = sourceRows.map((sourceRow) =>
    mergeDormRow(sourceRow, existingById.get(sourceRow.id))
  )

  // Upsert refreshed source facts while preserving admin-managed media and additively merging tags.
  const { error: upsertErr } = await supabase
    .from("dorms")
    .upsert(rows, { onConflict: "id" })

  if (upsertErr) {
    console.error("Upsert failed:", upsertErr)
    process.exit(1)
  }

  console.log(`Successfully seeded ${rows.length} dorm(s).`)

  // Verify row count after sync.
  const { count } = await supabase
    .from("dorms")
    .select("*", { count: "exact", head: true })
  console.log(`Verification: dorms table now has ${count} row(s).`)
}

try {
  await main()
} catch (err) {
  console.error("Seed script failed:", err)
  process.exit(1)
}
