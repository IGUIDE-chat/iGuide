import type { DormSupabase } from "../deps.ts"
import { DormRepositoryError } from "../errors.ts"

export const FAVORITES_TABLE = "dorm_favorites"

export interface DormFavorite {
  id: string
  user_id: string
  dorm_id: string
  dorm_name: string
  dorm_name_zh?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FavoriteInput {
  userId: string
  dormId: string
  dormName: string
  dormNameZh: string | null
}

/** The caller's favorites, newest first. */
export async function listFavorites(
  supabase: DormSupabase,
  userId: string,
): Promise<DormFavorite[]> {
  const { data, error } = await supabase
    .from(FAVORITES_TABLE)
    .select<DormFavorite>("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new DormRepositoryError("FAVORITES_READ_FAILED", error.message, error.code)
  }
  return data ?? []
}

export async function findFavorite(
  supabase: DormSupabase,
  userId: string,
  dormId: string,
): Promise<DormFavorite | null> {
  const { data, error } = await supabase
    .from(FAVORITES_TABLE)
    .select<DormFavorite>("*")
    .eq("user_id", userId)
    .eq("dorm_id", dormId)
    .maybeSingle()

  if (error) {
    throw new DormRepositoryError("FAVORITES_READ_FAILED", error.message, error.code)
  }
  return data ?? null
}

export async function addFavorite(
  supabase: DormSupabase,
  input: FavoriteInput,
): Promise<DormFavorite> {
  const { data, error } = await supabase
    .from(FAVORITES_TABLE)
    .insert<DormFavorite>({
      user_id: input.userId,
      dorm_id: input.dormId,
      dorm_name: input.dormName,
      dorm_name_zh: input.dormNameZh || null,
    })
    .select("*")
    .single()

  if (error) {
    throw new DormRepositoryError("FAVORITE_ADD_FAILED", error.message, error.code)
  }
  if (!data) {
    throw new DormRepositoryError("FAVORITE_ADD_FAILED", "Insert returned no favorite row")
  }
  return data
}

/** Add the favorite, or hand back the existing one when the dorm is already saved. */
export async function addOrKeepFavorite(
  supabase: DormSupabase,
  input: FavoriteInput,
): Promise<{ added: boolean; favorite: DormFavorite }> {
  const existing = await findFavorite(supabase, input.userId, input.dormId)
  if (existing) {
    return { added: false, favorite: existing }
  }
  return { added: true, favorite: await addFavorite(supabase, input) }
}

/** Remove the favorite. Throws `FAVORITE_NOT_FOUND` when it is not the caller's. */
export async function removeFavorite(
  supabase: DormSupabase,
  favoriteId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from(FAVORITES_TABLE)
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId)
    .select("id")

  if (error) {
    throw new DormRepositoryError("FAVORITE_DELETE_FAILED", error.message, error.code)
  }
  if (!data || data.length === 0) {
    throw new DormRepositoryError(
      "FAVORITE_NOT_FOUND",
      `No favorite ${favoriteId} owned by ${userId}`,
    )
  }
}

/** Add the favorite, or remove it when the dorm is already saved. */
export async function toggleFavorite(
  supabase: DormSupabase,
  input: FavoriteInput,
): Promise<{ added: boolean; favorite?: DormFavorite }> {
  const existing = await findFavorite(supabase, input.userId, input.dormId)
  if (existing) {
    await removeFavorite(supabase, existing.id, input.userId)
    return { added: false }
  }
  return { added: true, favorite: await addFavorite(supabase, input) }
}

export async function updateFavoriteNotes(
  supabase: DormSupabase,
  favoriteId: string,
  userId: string,
  notes: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from(FAVORITES_TABLE)
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", favoriteId)
    .eq("user_id", userId)
    .select("id")

  if (error) {
    throw new DormRepositoryError("FAVORITE_UPDATE_FAILED", error.message, error.code)
  }
  if (!data || data.length === 0) {
    throw new DormRepositoryError(
      "FAVORITE_NOT_FOUND",
      `No favorite ${favoriteId} owned by ${userId}`,
    )
  }
}

export async function clearFavorites(supabase: DormSupabase, userId: string): Promise<void> {
  const { error } = await supabase.from(FAVORITES_TABLE).delete().eq("user_id", userId)
  if (error) {
    throw new DormRepositoryError("FAVORITE_CLEAR_FAILED", error.message, error.code)
  }
}
