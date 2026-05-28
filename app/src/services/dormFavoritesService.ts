/**
 * @file ./src/services/dormFavoritesService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Manages dorm favorites with Supabase.
// [服务] 管理宿舍收藏（Supabase）。
import { supabase } from "./supabase"
import { authService } from "./authService"

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
  /**
   * Toggle favorite status (add if not exists, remove if exists)
   */
  async toggleFavorite(
    dormId: string,
    dormName: string,
    dormNameZh?: string
  ): Promise<{ added: boolean; favorite?: DormFavorite }> {
    const user = await authService.getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // First check if already favorited
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)
      .maybeSingle()

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq("id", existing.id)

      if (error) {
        console.error("Error removing favorite:", error)
        throw error
      }
      return { added: false }
    }
    // Add to favorites
    const { data, error } = await supabase
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
  },

  /**
   * Get all favorites for current user
   */
  async getFavorites(): Promise<DormFavorite[]> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
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

  /**
   * Check if a dorm is favorited
   */
  async isFavorited(dormId: string): Promise<boolean> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
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

  /**
   * Update notes for a favorite
   */
  async updateNotes(favoriteId: string, notes: string): Promise<void> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", favoriteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating notes:", error)
      throw error
    }
  },

  /**
   * Remove a specific favorite
   */
  async removeFavorite(favoriteId: string): Promise<void> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error removing favorite:", error)
      throw error
    }
  },

  /**
   * Remove a favorite by dorm id for current user
   */
  async removeFavoriteByDormId(dormId: string): Promise<void> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id)
      .eq("dorm_id", dormId)

    if (error) {
      console.error("Error removing favorite by dorm id:", error)
      throw error
    }
  },

  /**
   * Clear all favorites
   */
  async clearFavorites(): Promise<void> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error("Error clearing favorites:", error)
      throw error
    }
  },
}
