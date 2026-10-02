import { getCurrentUser, getSupabase } from "./host"

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

const TABLE_NAME = "dorm_favorites"

export const dormFavoritesService = {
  async toggleFavorite(
    dormId: string,
    dormName: string,
    dormNameZh?: string,
  ): Promise<{ added: boolean; favorite?: DormFavorite }> {
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const { data: existing } = await getSupabase()
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)
      .maybeSingle()

    if (existing) {
      const { error } = await getSupabase().from(TABLE_NAME).delete().eq("id", existing.id)

      if (error) {
        console.error("Error removing favorite:", error)
        throw error
      }
      return { added: false }
    } else {
      const { data, error } = await getSupabase()
        .from(TABLE_NAME)
        .insert({
          user_id: user.id,
          dorm_id: dormId,
          dorm_name: dormName,
          dorm_name_zh: dormNameZh || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding favorite:", error)
        throw error
      }
      return { added: true, favorite: data }
    }
  },

  async getFavorites(): Promise<DormFavorite[]> {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await getSupabase()
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching favorites:", error)
      return []
    }

    return data || []
  },

  async isFavorited(dormId: string): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false

    const { data, error } = await getSupabase()
      .from(TABLE_NAME)
      .select("id")
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)
      .maybeSingle()

    if (error) {
      console.error("Error checking favorite status:", error)
      return false
    }

    return !!data
  },

  async updateNotes(favoriteId: string, notes: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", favoriteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating notes:", error)
      throw error
    }
  },

  async removeFavorite(favoriteId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error removing favorite:", error)
      throw error
    }
  },

  async removeFavoriteByDormId(dormId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase()
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)

    if (error) {
      console.error("Error removing favorite by dorm id:", error)
      throw error
    }
  },

  async clearFavorites(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await getSupabase().from(TABLE_NAME).delete().eq("user_id", user.id)

    if (error) {
      console.error("Error clearing favorites:", error)
      throw error
    }
  },
}
