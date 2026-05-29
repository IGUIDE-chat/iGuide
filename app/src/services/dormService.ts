/**
 * @file ./src/services/dormService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Dorm } from "../components/housing/types/index"
import {
  finalizeDormRecord,
  sanitizeFloorPlansForStorage,
} from "../utils/dormData"
import { normalizeDorm } from "../utils/roomOptions"
// [SERVICE] Read dorms from Supabase `dorms` table with static fallback.
// [服务] 从 Supabase `dorms` 表读取宿舍数据，静态数据作为 fallback。
import { supabase } from "./supabase"

const TABLE = "dorms"

/** Lazy-load static dorm data to avoid pulling ~160KB into the initial bundle. */
async function getStaticDorms(): Promise<Dorm[]> {
  const { UIUC_DORMS } =
    await import("../components/housing/constants/dormData")
  return UIUC_DORMS
}

/** Map a snake_case DB row to camelCase Dorm. */
function rowToDorm(row: Record<string, unknown>): Dorm {
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
      structuredTags:
        (row.structured_tags as Dorm["structuredTags"]) ?? undefined,
      categorizedTags: (row.categorized_tags as Dorm["categorizedTags"]) ?? {
        livingConditions: [],
        facilities: [],
        lifestyle: [],
      },
      roomTypes: (row.room_types as Dorm["roomTypes"]) ?? [],
      roomOptions: (row.room_options as Dorm["roomOptions"]) ?? undefined,
      floorPlans:
        sanitizeFloorPlansForStorage(row.floor_plans as Dorm["floorPlans"]) ??
        undefined,
      galleryImages: (row.gallery_images as string[]) ?? undefined,
      pros: (row.pros as string[]) ?? [],
      pros_zh: (row.pros_zh as string[]) ?? undefined,
      cons: (row.cons as string[]) ?? [],
      cons_zh: (row.cons_zh as string[]) ?? undefined,
      applicationFee:
        row.application_fee !== null && row.application_fee !== undefined
          ? Number(row.application_fee)
          : undefined,
      address: (row.address as string) ?? undefined,
      address_zh: (row.address_zh as string) ?? undefined,
      website: (row.website as string) ?? undefined,
    })
  )
}

/** Fetch all dorms. Falls back to static data on failure. */
async function getAllDorms(): Promise<Dorm[]> {
  try {
    const { data, error } = await supabase.from(TABLE).select("*")
    if (error) {
      console.error("[dormService] getAllDorms error:", error)
      return getStaticDorms()
    }
    if (!data || data.length === 0) {
      return getStaticDorms()
    }
    return data.map((row) => rowToDorm(row))
  } catch (err) {
    console.error("[dormService] getAllDorms exception:", err)
    return getStaticDorms()
  }
}

/** Fetch a single dorm by ID. Falls back to static data on failure. */
async function getDormById(id: string): Promise<Dorm | undefined> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) {
      console.error("[dormService] getDormById error:", error)
      const all = await getStaticDorms()
      return all.find((d) => d.id === id)
    }
    if (!data) {
      const all = await getStaticDorms()
      return all.find((d) => d.id === id)
    }
    return rowToDorm(data)
  } catch (err) {
    console.error("[dormService] getDormById exception:", err)
    const all = await getStaticDorms()
    return all.find((d) => d.id === id)
  }
}

export const dormService = {
  getAllDorms,
  getDormById,
  rowToDorm,
}
