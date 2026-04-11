/**
 * @file ./src/services/dormAdminService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Admin-only operations for the `dorms` table.
// [服务] 管理员专用——直接操作 `dorms` 表（替代旧的 override 模式）。
import { supabase } from "./supabase";
import { Dorm } from "../components/housing/types/index";
import {
  getDormPriceRange,
  sanitizeFloorPlansForStorage,
} from "../utils/dormData";
import { getPersistedBathroomType } from "../utils/roomOptions";

const TABLE = "dorms";

/** Partial update payload — camelCase fields mapped to snake_case for DB. */
export interface DormUpdate {
  name?: string;
  name_zh?: string | null;
  description?: string;
  description_zh?: string | null;
  image_url?: string | null;
  price?: number | null;
  price_range?: Dorm["priceRange"] | null;
  location?: string | null;
  location_zh?: string | null;
  housing_type?: string | null;
  ac?: boolean;
  dining?: string;
  dining_nearby_detail?: string | null;
  bathroom_type?: string | null;
  room_types?: string[] | null;
  room_options?: unknown[] | null;
  tags?: string[] | null;
  structured_tags?: Record<string, unknown> | null;
  categorized_tags?: Record<string, unknown> | null;
  application_fee?: number | null;
  floor_plans?: unknown[] | null;
  gallery_images?: string[] | null;
  pros?: string[] | null;
  pros_zh?: string[] | null;
  cons?: string[] | null;
  cons_zh?: string[] | null;
  address?: string | null;
  address_zh?: string | null;
  website?: string | null;
}

export interface DormMutationResult {
  ok: boolean;
  errorMessage?: string;
}

export interface EditHistoryEntry {
  id: string;
  dorm_id: string;
  dorm_name: string;
  changed_by: string;
  changed_at: string;
  summary: string;
  snapshot: Record<string, unknown>;
}

/**
 * Columns that exist in the Supabase `dorms` table.
 * Any key NOT in this set is stripped before sending.
 */
const KNOWN_DB_COLUMNS = new Set([
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
]);

/** Build a human-readable summary of what changed between dorm and updates. */
export function buildSummary(dorm: Dorm, updates: DormUpdate): string {
  const parts: string[] = [];
  if (updates.name !== undefined && updates.name !== dorm.name)
    parts.push("名称");
  if (updates.price !== undefined && updates.price !== dorm.price)
    parts.push(`价格: $${dorm.price} → $${updates.price}`);
  if (updates.ac !== undefined && updates.ac !== dorm.ac)
    parts.push(`空调: ${dorm.ac ? "有" : "无"} → ${updates.ac ? "有" : "无"}`);
  if (updates.dining !== undefined && updates.dining !== dorm.dining)
    parts.push("食堂");
  if (
    updates.description !== undefined &&
    updates.description !== dorm.description
  )
    parts.push("描述");
  if (updates.pros !== undefined) parts.push("优点");
  if (updates.cons !== undefined) parts.push("缺点");
  if (updates.categorized_tags !== undefined) parts.push("标签");
  if (updates.floor_plans !== undefined) parts.push("户型图");
  if (updates.gallery_images !== undefined) parts.push("图库");
  if (updates.address !== undefined) parts.push("地址");
  return parts.length > 0 ? `修改: ${parts.join(", ")}` : "保存";
}

/**
 * Fetch the last 20 edit history entries for a dorm, newest first.
 */
async function getEditHistory(dormId: string): Promise<EditHistoryEntry[]> {
  const { data, error } = await supabase
    .from("dorm_edit_history")
    .select("*")
    .eq("dorm_id", dormId)
    .order("changed_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("[dormAdminService] getEditHistory error:", error);
    return [];
  }
  return (data ?? []) as EditHistoryEntry[];
}

/**
 * Fire-and-forget: insert a history entry for an edit. Errors are non-blocking.
 */
async function logEdit(
  dormId: string,
  dormName: string,
  changedBy: string,
  summary: string,
  snapshotBefore: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("dorm_edit_history").insert({
    dorm_id: dormId,
    dorm_name: dormName,
    changed_by: changedBy,
    summary,
    snapshot: snapshotBefore,
  });
  if (error) {
    console.warn("[dormAdminService] logEdit error (non-blocking):", error);
  }
}

/**
 * Restore a dorm to a previous snapshot, then log the restore action.
 */
async function restoreSnapshot(
  dormId: string,
  entry: EditHistoryEntry
): Promise<boolean> {
  const safeSnapshot: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry.snapshot)) {
    if (KNOWN_DB_COLUMNS.has(key)) {
      safeSnapshot[key] =
        key === "floor_plans"
          ? (sanitizeFloorPlansForStorage(value as Dorm["floorPlans"]) ?? [])
          : value;
    }
  }
  const { error } = await supabase
    .from(TABLE)
    .update(safeSnapshot)
    .eq("id", dormId);
  if (error) {
    console.error("[dormAdminService] restoreSnapshot error:", error);
    return false;
  }
  await logEdit(
    dormId,
    entry.dorm_name,
    entry.changed_by,
    `由管理员还原至 ${entry.changed_at} 版本`,
    entry.snapshot
  );
  return true;
}

/**
 * Update a dorm record directly in the `dorms` table. Requires admin session.
 * Unknown columns are automatically stripped to prevent 400 errors.
 */
async function updateDorm(
  dormId: string,
  updates: DormUpdate
): Promise<DormMutationResult> {
  // Strip keys that don't exist in the DB yet
  const safeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (KNOWN_DB_COLUMNS.has(key)) {
      safeUpdates[key] =
        key === "floor_plans"
          ? (sanitizeFloorPlansForStorage(value as Dorm["floorPlans"]) ?? null)
          : value;
    }
  }

  // Auto-recalculate price_range when price changes
  if (safeUpdates.price != null && typeof safeUpdates.price === "number") {
    safeUpdates.price_range = getDormPriceRange(safeUpdates.price as number);
  }

  const { error } = await supabase
    .from(TABLE)
    .update(safeUpdates)
    .eq("id", dormId);
  if (error) {
    console.error("[dormAdminService] updateDorm error:", error);
    const errorMessage = [error.message, error.details, error.hint]
      .filter(Boolean)
      .join(" ");
    return { ok: false, errorMessage };
  }
  return { ok: true };
}

/**
 * Reset a dorm to its original static data by overwriting the DB row.
 */
async function resetDormToStatic(dormId: string): Promise<DormMutationResult> {
  const { UIUC_DORMS } =
    await import("../components/housing/constants/dormData");
  const staticDorm = UIUC_DORMS.find((d) => d.id === dormId);
  if (!staticDorm) {
    console.error(
      "[dormAdminService] resetDormToStatic: dorm not found in static data:",
      dormId
    );
    return {
      ok: false,
      errorMessage: `Dorm "${dormId}" was not found in static data.`,
    };
  }

  const row: DormUpdate = {
    name: staticDorm.name,
    name_zh: staticDorm.name_zh ?? null,
    description: staticDorm.description,
    description_zh: staticDorm.description_zh ?? null,
    image_url: staticDorm.imageUrl,
    price: staticDorm.price,
    price_range: staticDorm.priceRange,
    location: staticDorm.location,
    location_zh: staticDorm.location_zh ?? null,
    housing_type: staticDorm.housingType,
    ac: staticDorm.ac,
    dining: staticDorm.dining,
    dining_nearby_detail: staticDorm.diningNearbyDetail ?? null,
    bathroom_type: getPersistedBathroomType(
      staticDorm.bathroomType,
      staticDorm.roomOptions
    ),
    application_fee: staticDorm.applicationFee ?? null,
    room_types: staticDorm.roomTypes,
    room_options: staticDorm.roomOptions ?? null,
    tags: staticDorm.tags,
    structured_tags:
      (staticDorm.structuredTags as unknown as Record<string, unknown>) ?? null,
    categorized_tags:
      (staticDorm.categorizedTags as unknown as Record<string, unknown>) ??
      null,
    floor_plans: sanitizeFloorPlansForStorage(staticDorm.floorPlans) ?? null,
    gallery_images: staticDorm.galleryImages ?? null,
    pros: staticDorm.pros,
    pros_zh: staticDorm.pros_zh ?? null,
    cons: staticDorm.cons,
    cons_zh: staticDorm.cons_zh ?? null,
    address: staticDorm.address ?? null,
    address_zh: staticDorm.address_zh ?? null,
    website: staticDorm.website ?? null,
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
    console.warn(
      "[dormAdminService] refreshSession warning:",
      refreshError.message
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      publicUrl: null,
      errorMessage: "Not authenticated. Please sign in again.",
    };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `user_uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("dorm-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error("[dormAdminService] uploadDormImage error:", uploadError);
    return {
      publicUrl: null,
      errorMessage: uploadError.message,
    };
  }

  const { data } = supabase.storage.from("dorm-images").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    return {
      publicUrl: null,
      errorMessage: "Upload succeeded but no public URL was returned.",
    };
  }

  return { publicUrl: data.publicUrl };
}

export const dormAdminService = {
  updateDorm,
  resetDormToStatic,
  uploadDormImage,
  getEditHistory,
  logEdit,
  restoreSnapshot,
};
