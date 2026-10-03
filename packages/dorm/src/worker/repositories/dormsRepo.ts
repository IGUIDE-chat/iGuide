import type { Dorm } from "../../types.ts"
import {
  finalizeDormRecord,
  getDormPriceRange,
  sanitizeFloorPlansForStorage,
} from "../../utils/dormData.ts"
import { normalizeDorm } from "../../utils/roomOptions.ts"
import type { DormRow, DormSupabase } from "../deps.ts"
import { DormRepositoryError } from "../errors.ts"

export const DORMS_TABLE = "dorms"
export const EDIT_HISTORY_TABLE = "dorm_edit_history"
export const IMAGE_BUCKET = "dorm-images"

/** Partial update payload — camelCase fields mapped to snake_case for DB. */
export interface DormUpdate {
  name?: string
  name_zh?: string | null
  description?: string
  description_zh?: string | null
  image_url?: string | null
  price?: number | null
  price_range?: Dorm["priceRange"] | null
  location?: string | null
  location_zh?: string | null
  housing_type?: string | null
  ac?: boolean
  dining?: string
  dining_nearby_detail?: string | null
  bathroom_type?: string | null
  room_types?: string[] | null
  room_options?: unknown[] | null
  tags?: string[] | null
  structured_tags?: Record<string, unknown> | null
  categorized_tags?: Record<string, unknown> | null
  application_fee?: number | null
  floor_plans?: unknown[] | null
  gallery_images?: string[] | null
  pros?: string[] | null
  pros_zh?: string[] | null
  cons?: string[] | null
  cons_zh?: string[] | null
  address?: string | null
  address_zh?: string | null
  website?: string | null
}

export interface DormMutationResult {
  ok: boolean
  errorMessage?: string
}

export interface EditHistoryEntry {
  id: string
  dorm_id: string
  dorm_name: string
  changed_by: string
  changed_at: string
  summary: string
  snapshot: Record<string, unknown>
}

/**
 * Columns that exist in the Supabase `dorms` table.
 * Any key NOT in this set is stripped before sending.
 */
export const KNOWN_DB_COLUMNS = new Set([
  "name",
  "name_zh",
  "description",
  "description_zh",
  "image_url",
  "price",
  "price_range",
  "location",
  "location_zh",
  "housing_type",
  "ac",
  "dining",
  "dining_nearby_detail",
  "bathroom_type",
  "room_types",
  "room_options",
  "tags",
  "structured_tags",
  "categorized_tags",
  "floor_plans",
  "gallery_images",
  "pros",
  "pros_zh",
  "cons",
  "cons_zh",
  "application_fee",
  "address",
  "address_zh",
  "website",
])

/** Map a snake_case DB row to camelCase Dorm. */
export function rowToDorm(row: DormRow): Dorm {
  return finalizeDormRecord(
    normalizeDorm({
      id: row.id as string,
      name: row.name as string,
      name_zh: (row.name_zh as string) ?? undefined,
      description: (row.description as string) ?? "",
      description_zh: (row.description_zh as string) ?? undefined,
      imageUrl: (row.image_url as string) ?? "",
      price: Number(row.price) || 0,
      priceRange: (row.price_range as Dorm["priceRange"]) ?? "$",
      location: (row.location as Dorm["location"]) ?? "Main Quad",
      location_zh: (row.location_zh as string) ?? undefined,
      housingType: (row.housing_type as Dorm["housingType"]) ?? "URH",
      ac: Boolean(row.ac),
      dining: (row.dining as Dorm["dining"]) ?? "nearby",
      diningNearbyDetail: (row.dining_nearby_detail as string) ?? undefined,
      bathroomType: (row.bathroom_type as Dorm["bathroomType"]) ?? "communal",
      lat: Number(row.lat) || 0,
      lng: Number(row.lng) || 0,
      tags: (row.tags as string[]) ?? [],
      structuredTags: (row.structured_tags as Dorm["structuredTags"]) ?? undefined,
      categorizedTags: (row.categorized_tags as Dorm["categorizedTags"]) ?? {
        livingConditions: [],
        facilities: [],
        lifestyle: [],
      },
      roomTypes: (row.room_types as Dorm["roomTypes"]) ?? [],
      roomOptions: (row.room_options as Dorm["roomOptions"]) ?? undefined,
      floorPlans: sanitizeFloorPlansForStorage(row.floor_plans as Dorm["floorPlans"]) ?? undefined,
      galleryImages: (row.gallery_images as string[]) ?? undefined,
      pros: (row.pros as string[]) ?? [],
      pros_zh: (row.pros_zh as string[]) ?? undefined,
      cons: (row.cons as string[]) ?? [],
      cons_zh: (row.cons_zh as string[]) ?? undefined,
      applicationFee: row.application_fee != null ? Number(row.application_fee) : undefined,
      address: (row.address as string) ?? undefined,
      address_zh: (row.address_zh as string) ?? undefined,
      website: (row.website as string) ?? undefined,
    }),
  )
}

/** Fetch every dorm row, mapped to camelCase `Dorm`. */
export async function listDorms(supabase: DormSupabase): Promise<Dorm[]> {
  const { data, error } = await supabase.from(DORMS_TABLE).select("*")
  if (error) {
    throw new DormRepositoryError("DORMS_LIST_FAILED", error.message, error.code)
  }
  return (data ?? []).map(rowToDorm)
}

/** Fetch one dorm row, or null when it does not exist. */
export async function getDormRow(supabase: DormSupabase, dormId: string): Promise<DormRow | null> {
  const { data, error } = await supabase
    .from(DORMS_TABLE)
    .select("*")
    .eq("id", dormId)
    .maybeSingle()
  if (error) {
    throw new DormRepositoryError("DORM_READ_FAILED", error.message, error.code)
  }
  return data ?? null
}

export async function getDorm(supabase: DormSupabase, dormId: string): Promise<Dorm | null> {
  const row = await getDormRow(supabase, dormId)
  return row ? rowToDorm(row) : null
}

/**
 * Update a dorm record directly in the `dorms` table.
 * Unknown columns are stripped to prevent 400 errors, and `price_range` is
 * always re-derived from a supplied price.
 */
export async function updateDorm(
  supabase: DormSupabase,
  dormId: string,
  updates: DormUpdate,
): Promise<DormMutationResult> {
  const safeUpdates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (KNOWN_DB_COLUMNS.has(key)) {
      safeUpdates[key] =
        key === "floor_plans"
          ? (sanitizeFloorPlansForStorage(value as Dorm["floorPlans"]) ?? null)
          : value
    }
  }

  if (safeUpdates.price != null && typeof safeUpdates.price === "number") {
    safeUpdates.price_range = getDormPriceRange(safeUpdates.price as number)
  }

  const { error } = await supabase.from(DORMS_TABLE).update(safeUpdates).eq("id", dormId)
  if (error) {
    const errorMessage = [error.message, error.details, error.hint].filter(Boolean).join(" ")
    throw new DormRepositoryError("DORM_UPDATE_FAILED", errorMessage, error.code)
  }
  return { ok: true }
}

/** Fetch the last 20 edit history entries for a dorm, newest first. */
export async function getEditHistory(
  supabase: DormSupabase,
  dormId: string,
): Promise<EditHistoryEntry[]> {
  const { data, error } = await supabase
    .from(EDIT_HISTORY_TABLE)
    .select<EditHistoryEntry>("*")
    .eq("dorm_id", dormId)
    .order("changed_at", { ascending: false })
    .limit(20)
  if (error) {
    throw new DormRepositoryError("EDIT_HISTORY_FAILED", error.message, error.code)
  }
  return data ?? []
}

/** Fire-and-forget: insert a history entry for an edit. Errors are non-blocking. */
export async function logEdit(
  supabase: DormSupabase,
  dormId: string,
  dormName: string,
  changedBy: string,
  summary: string,
  snapshotBefore: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from(EDIT_HISTORY_TABLE).insert({
    dorm_id: dormId,
    dorm_name: dormName,
    changed_by: changedBy,
    summary,
    snapshot: snapshotBefore,
  })
  if (error) {
    console.warn("[dormApi] logEdit error (non-blocking):", error.message)
  }
}

/** Restore a dorm to a previous snapshot, then log the restore action. */
export async function restoreSnapshot(
  supabase: DormSupabase,
  dormId: string,
  entry: EditHistoryEntry,
): Promise<void> {
  const safeSnapshot: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entry.snapshot)) {
    if (KNOWN_DB_COLUMNS.has(key)) {
      safeSnapshot[key] =
        key === "floor_plans"
          ? (sanitizeFloorPlansForStorage(value as Dorm["floorPlans"]) ?? [])
          : value
    }
  }
  const { error } = await supabase.from(DORMS_TABLE).update(safeSnapshot).eq("id", dormId)
  if (error) {
    throw new DormRepositoryError("DORM_RESTORE_FAILED", error.message, error.code)
  }
  await logEdit(
    supabase,
    dormId,
    entry.dorm_name,
    entry.changed_by,
    `由管理员还原至 ${entry.changed_at} 版本`,
    entry.snapshot,
  )
}

export interface DormImageUploadResult {
  publicUrl: string
}

/** Upload an image file to the Supabase Storage bucket 'dorm-images'. */
export async function uploadDormImage(
  supabase: DormSupabase,
  file: File,
): Promise<DormImageUploadResult> {
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = `user_uploads/${fileName}`

  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  })

  if (uploadError) {
    throw new DormRepositoryError("IMAGE_UPLOAD_FAILED", uploadError.message, uploadError.code)
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
  if (!data?.publicUrl) {
    throw new DormRepositoryError("IMAGE_UPLOAD_FAILED", "Upload returned no public URL")
  }

  return { publicUrl: data.publicUrl }
}
