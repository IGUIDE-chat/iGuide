import { getCurrentUser, getSupabase } from "./host"

export interface DormViewingHistory {
  id: string
  user_id: string
  dorm_id: string
  dorm_name: string
  dorm_name_zh?: string
  view_count: number
  last_viewed_at: string
}

const TABLE_NAME = "dorm_viewing_history"

export const dormViewingService = {
  async addToHistory(dormId: string, dormName: string, dormNameZh?: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: user.id,
          dorm_id: dormId,
          dorm_name: dormName,
          dorm_name_zh: dormNameZh || null,
          last_viewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,dorm_id" },
      )

    if (error) {
      console.error("Error adding viewing history:", error)
      throw error
    }
  },

  async getHistory(limit: number = 20): Promise<DormViewingHistory[]> {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await getSupabase()
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching viewing history:", error)
      return []
    }

    return data || []
  },

  async removeFromHistory(id: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error removing from history:", error)
      throw error
    }
  },

  async removeFromHistoryByDormId(dormId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)

    if (error) {
      console.error("Error removing from history by dorm id:", error)
      throw error
    }
  },

  async clearHistory(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase().from(TABLE_NAME).delete().eq("user_id", user.id)

    if (error) {
      console.error("Error clearing history:", error)
      throw error
    }
  },
}
