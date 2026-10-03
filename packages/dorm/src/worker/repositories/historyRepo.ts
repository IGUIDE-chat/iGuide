import type { DormSupabase } from "../deps.ts"
import { DormRepositoryError } from "../errors.ts"

export const HISTORY_TABLE = "dorm_viewing_history"

export interface DormViewingHistory {
  id: string
  user_id: string
  dorm_id: string
  dorm_name: string
  dorm_name_zh?: string
  view_count: number
  last_viewed_at: string
}

/** Upsert a view; one row per user per dorm, bumped with the latest timestamp. */
export async function addToHistory(
  supabase: DormSupabase,
  input: {
    userId: string
    dormId: string
    dormName: string
    dormNameZh: string | null
    viewedAt: string
  },
): Promise<void> {
  const { error } = await supabase.from(HISTORY_TABLE).upsert(
    {
      user_id: input.userId,
      dorm_id: input.dormId,
      dorm_name: input.dormName,
      dorm_name_zh: input.dormNameZh || null,
      last_viewed_at: input.viewedAt,
    },
    { onConflict: "user_id,dorm_id" },
  )

  if (error) {
    throw new DormRepositoryError("HISTORY_WRITE_FAILED", error.message, error.code)
  }
}

export async function listHistory(
  supabase: DormSupabase,
  userId: string,
  limit: number,
): Promise<DormViewingHistory[]> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select<DormViewingHistory>("*")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new DormRepositoryError("HISTORY_READ_FAILED", error.message, error.code)
  }
  return data ?? []
}

/** Remove one history row. Throws `HISTORY_NOT_FOUND` when it is not the caller's. */
export async function removeFromHistory(
  supabase: DormSupabase,
  id: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")

  if (error) {
    throw new DormRepositoryError("HISTORY_DELETE_FAILED", error.message, error.code)
  }
  if (!data || data.length === 0) {
    throw new DormRepositoryError("HISTORY_NOT_FOUND", `No history row ${id} owned by ${userId}`)
  }
}

export async function removeFromHistoryByDormId(
  supabase: DormSupabase,
  dormId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from(HISTORY_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("dorm_id", dormId)

  if (error) {
    throw new DormRepositoryError("HISTORY_DELETE_FAILED", error.message, error.code)
  }
}

export async function clearHistory(supabase: DormSupabase, userId: string): Promise<void> {
  const { error } = await supabase.from(HISTORY_TABLE).delete().eq("user_id", userId)
  if (error) {
    throw new DormRepositoryError("HISTORY_CLEAR_FAILED", error.message, error.code)
  }
}
