import { getPersistedBathroomType, sanitizeFloorPlansForStorage } from "@iguide/dorm"
import type {
  Dorm,
  DormComment,
  DormCommentStats,
  DormFavorite,
  DormMutationResult,
  DormUpdate,
  DormViewingHistory,
  EditHistoryEntry,
} from "@iguide/dorm"

import { supabase } from "./supabase"

const API_ROOT = "/api/dorms"

/** A failed `/api/dorms` call, carrying the endpoint's stable code. */
export class DormApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "DormApiError"
    this.status = status
    this.code = code
  }
}

async function accessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await accessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (init.body !== undefined) headers["Content-Type"] = "application/json"

  const response = await fetch(`${API_ROOT}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (!response.ok) {
    // The Worker answers every failure with `{ error, code }`; a proxy or the
    // SPA fallback can answer with HTML instead, so fall back to the status.
    const body = await response.json().catch(() => null)
    const error = body as { error?: string; code?: string } | null
    throw new DormApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.error ?? `Dorm request failed (${response.status})`,
    )
  }

  return (await response.json()) as T
}

/**
 * Lazy-load the bundled dataset. This cannot be a static import: `UIUC_DORMS`
 * is ~160KB and only the fallback paths need it, so a static import would put
 * the whole dataset in the initial bundle.
 */
async function getStaticDorms(): Promise<Dorm[]> {
  const { UIUC_DORMS } = await import("../components/housing/constants/dormData")
  return UIUC_DORMS
}

/**
 * Fetch all dorms. Falls back to the bundled dataset on failure or an empty
 * table. The empty path is deliberate: the Worker's URL table mounts the dorm
 * router at `/api/dorms` itself, and a trailing slash is a 404 there.
 */
export async function getAllDorms(): Promise<Dorm[]> {
  try {
    const dorms = await request<Dorm[]>("")
    if (dorms.length === 0) return getStaticDorms()
    return dorms
  } catch (err) {
    console.error("[dormApi] getAllDorms failed, using the bundled dataset:", err)
    return getStaticDorms()
  }
}

/** Fetch a single dorm. Falls back to the bundled dataset on failure or a miss. */
export async function getDormById(id: string): Promise<Dorm | undefined> {
  try {
    return await request<Dorm>(`/${encodeURIComponent(id)}`)
  } catch (err) {
    console.error("[dormApi] getDormById failed, using the bundled dataset:", err)
    const all = await getStaticDorms()
    return all.find((dorm) => dorm.id === id)
  }
}

/** Comment counts and thumbs-up share per dorm. */
export async function getAllDormStats(): Promise<Record<string, DormCommentStats>> {
  try {
    return await request<Record<string, DormCommentStats>>("/comments/stats")
  } catch (err) {
    console.error("[dormApi] getAllDormStats failed:", err)
    return {}
  }
}

/** Comments for one dorm, newest first. Hidden rows only reach admins. */
export async function getComments(dormId: string): Promise<DormComment[]> {
  try {
    return await request<DormComment[]>(`/${encodeURIComponent(dormId)}/comments`)
  } catch (err) {
    console.error("[dormApi] getComments failed:", err)
    return []
  }
}

/** Upsert the signed-in user's own comment on a dorm. One comment per user per dorm. */
export async function saveComment(
  dormId: string,
  content: string,
  dormVote: 1 | -1 | null,
): Promise<DormComment> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  return request<DormComment>(`/${encodeURIComponent(dormId)}/comments`, {
    method: "POST",
    body: {
      content,
      display_name: user.email?.split("@")[0] ?? "Anonymous",
      dorm_vote: dormVote,
    },
  })
}

/** Delete the signed-in user's own comment. */
export async function deleteComment(commentId: string): Promise<void> {
  await request<{ ok: true }>(`/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" })
}

/** Admin-only: hide or un-hide a comment. */
export async function setCommentHidden(commentId: string, hidden: boolean): Promise<void> {
  await request<{ ok: true }>(`/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: { hidden },
  })
}

/** Upsert a vote on a comment. Pass null to remove the vote. */
export async function voteOnComment(commentId: string, vote: 1 | -1 | null): Promise<void> {
  await request<{ ok: true }>(`/comments/${encodeURIComponent(commentId)}/vote`, {
    method: "POST",
    body: { vote },
  })
}

/** The caller's favorites, newest first. Guests have none on the server. */
export async function getFavorites(): Promise<DormFavorite[]> {
  try {
    return await request<DormFavorite[]>("/favorites")
  } catch (err) {
    if (err instanceof DormApiError && err.status === 401) return []
    throw err
  }
}

/**
 * Add a dorm to the caller's favorites, keeping the existing row if present.
 * `POST /favorites` answers the same envelope as `POST /favorites/toggle`, so
 * `favorite` is the row that is now saved and `added` says whether this call
 * is what put it there.
 */
export async function addFavorite(
  dormId: string,
  dormName: string,
  dormNameZh?: string,
): Promise<{ added: boolean; favorite: DormFavorite }> {
  return request<{ added: boolean; favorite: DormFavorite }>("/favorites", {
    method: "POST",
    body: { dorm_id: dormId, dorm_name: dormName, dorm_name_zh: dormNameZh ?? null },
  })
}

/** Add the dorm when it is missing, drop it when it is there. */
export async function toggleFavorite(
  dormId: string,
  dormName: string,
  dormNameZh?: string,
): Promise<{ added: boolean; favorite?: DormFavorite }> {
  return request<{ added: boolean; favorite?: DormFavorite }>("/favorites/toggle", {
    method: "POST",
    body: { dorm_id: dormId, dorm_name: dormName, dorm_name_zh: dormNameZh ?? null },
  })
}

/** Replace the caller's private note on a favorite. */
export async function updateFavoriteNotes(favoriteId: string, notes: string): Promise<void> {
  await request<{ ok: true }>(`/favorites/${encodeURIComponent(favoriteId)}`, {
    method: "PATCH",
    body: { notes },
  })
}

/** Drop one favorite by row id. */
export async function removeFavorite(favoriteId: string): Promise<void> {
  await request<{ ok: true }>(`/favorites/${encodeURIComponent(favoriteId)}`, { method: "DELETE" })
}

/** Drop whichever favorite row holds this dorm. */
export async function removeFavoriteByDormId(dormId: string): Promise<void> {
  const favorites = await getFavorites()
  const match = favorites.find((favorite) => favorite.dorm_id === dormId)
  if (match) await removeFavorite(match.id)
}

/** Drop every favorite the caller owns. */
export async function clearFavorites(): Promise<void> {
  await request<{ ok: true }>("/favorites", { method: "DELETE" })
}

/** The caller's viewing history, newest first. */
export async function getHistory(limit = 20): Promise<DormViewingHistory[]> {
  try {
    return await request<DormViewingHistory[]>(`/history?limit=${limit}`)
  } catch (err) {
    if (err instanceof DormApiError && err.status === 401) return []
    throw err
  }
}

/** Record a view; one row per user per dorm. */
export async function addToHistory(
  dormId: string,
  dormName: string,
  dormNameZh?: string,
): Promise<void> {
  await request<{ ok: true }>("/history", {
    method: "POST",
    body: { dorm_id: dormId, dorm_name: dormName, dorm_name_zh: dormNameZh ?? null },
  })
}

/** Drop one history entry by row id. */
export async function removeFromHistory(id: string): Promise<void> {
  await request<{ ok: true }>(`/history/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/** Drop whichever history row holds this dorm. */
export async function removeFromHistoryByDormId(dormId: string): Promise<void> {
  await request<{ ok: true }>(`/history/by-dorm/${encodeURIComponent(dormId)}`, {
    method: "DELETE",
  })
}

/** Drop every history row the caller owns. */
export async function clearHistory(): Promise<void> {
  await request<{ ok: true }>("/history", { method: "DELETE" })
}

/** The last edit history entries for a dorm, newest first. Admin-only. */
export async function getEditHistory(dormId: string): Promise<EditHistoryEntry[]> {
  return request<EditHistoryEntry[]>(`/${encodeURIComponent(dormId)}/edit-history`)
}

/** The history entry `PATCH /:id` logs alongside the write. */
export interface EditHistoryDraft {
  summary: string
  snapshot_before: Record<string, unknown>
  dorm_name?: string
  changed_by?: string
}

/**
 * Update a dorm row. The Worker filters `updates` to the columns the table has
 * and re-derives `price_range` from a supplied price, so the SPA sends its
 * whole payload and lets the server drop what does not apply.
 */
export async function updateDorm(
  dormId: string,
  updates: DormUpdate,
  editHistory?: EditHistoryDraft,
): Promise<DormMutationResult> {
  try {
    await request<{ ok: true; id: string }>(`/${encodeURIComponent(dormId)}`, {
      method: "PATCH",
      body: editHistory ? { updates, edit_history: editHistory } : { updates },
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, errorMessage: err instanceof Error ? err.message : String(err) }
  }
}

/** Restore a dorm to a previous snapshot from the edit history. Admin-only. */
export async function restoreSnapshot(dormId: string, entry: EditHistoryEntry): Promise<boolean> {
  try {
    await request<{ ok: true; id: string }>(`/${encodeURIComponent(dormId)}/restore`, {
      method: "POST",
      body: entry,
    })
    return true
  } catch (err) {
    console.error("[dormApi] restoreSnapshot failed:", err)
    return false
  }
}

/**
 * Overwrite a dorm row with its bundled record. There is no reset endpoint:
 * this is the same `PATCH /:id` an admin edit uses, fed from `UIUC_DORMS`.
 */
export async function resetDormToStatic(dormId: string): Promise<DormMutationResult> {
  const staticDorm = (await getStaticDorms()).find((dorm) => dorm.id === dormId)
  if (!staticDorm) {
    return { ok: false, errorMessage: `Dorm "${dormId}" was not found in static data.` }
  }

  return updateDorm(dormId, {
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
    bathroom_type: getPersistedBathroomType(staticDorm.bathroomType, staticDorm.roomOptions),
    application_fee: staticDorm.applicationFee ?? null,
    room_types: staticDorm.roomTypes,
    room_options: staticDorm.roomOptions ?? null,
    tags: staticDorm.tags,
    structured_tags: (staticDorm.structuredTags as unknown as Record<string, unknown>) ?? null,
    categorized_tags: (staticDorm.categorizedTags as unknown as Record<string, unknown>) ?? null,
    floor_plans: sanitizeFloorPlansForStorage(staticDorm.floorPlans) ?? null,
    gallery_images: staticDorm.galleryImages ?? null,
    pros: staticDorm.pros,
    pros_zh: staticDorm.pros_zh ?? null,
    cons: staticDorm.cons,
    cons_zh: staticDorm.cons_zh ?? null,
    address: staticDorm.address ?? null,
    address_zh: staticDorm.address_zh ?? null,
    website: staticDorm.website ?? null,
  })
}

/** An uploaded image is only usable once the Worker returns a public URL. */
export interface DormImageUploadResult {
  publicUrl: string | null
  errorMessage?: string
}

/** Upload an image to the `dorm-images` bucket for one dorm. Admin-only. */
export async function uploadDormImage(dormId: string, file: File): Promise<DormImageUploadResult> {
  const token = await accessToken()
  const form = new FormData()
  form.append("file", file)

  try {
    const response = await fetch(`${API_ROOT}/${encodeURIComponent(dormId)}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
        code?: string
      } | null
      throw new DormApiError(
        response.status,
        body?.code ?? `HTTP_${response.status}`,
        body?.error ?? `Image upload failed (${response.status})`,
      )
    }
    const { publicUrl } = (await response.json()) as { publicUrl: string }
    return { publicUrl }
  } catch (err) {
    return { publicUrl: null, errorMessage: err instanceof Error ? err.message : String(err) }
  }
}
