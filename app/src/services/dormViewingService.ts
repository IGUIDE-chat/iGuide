/**
 * @file ./src/services/dormViewingService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Manages dorm viewing history with Supabase.
// [服务] 管理宿舍浏览历史（Supabase）。
import { supabase } from "./supabase";
import { authService } from "./authService";

export interface DormViewingHistory {
  id: string;
  user_id: string;
  dorm_id: string;
  dorm_name: string;
  dorm_name_zh?: string;
  view_count: number;
  last_viewed_at: string;
}

const TABLE_NAME = "dorm_viewing_history";

export const dormViewingService = {
  /**
   * Add a dorm to viewing history
   */
  async addToHistory(
    dormId: string,
    dormName: string,
    dormNameZh?: string
  ): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        user_id: user.id,
        dorm_id: dormId,
        dorm_name: dormName,
        dorm_name_zh: dormNameZh || null,
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,dorm_id" }
    );

    if (error) {
      console.error("Error adding viewing history:", error);
      throw error;
    }
  },

  /**
   * Get viewing history for current user
   */
  async getHistory(limit: number = 20): Promise<DormViewingHistory[]> {
    const user = await authService.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching viewing history:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Remove a specific item from viewing history
   */
  async removeFromHistory(id: string): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing from history:", error);
      throw error;
    }
  },

  /**
   * Remove viewing history by dorm id for current user
   */
  async removeFromHistoryByDormId(dormId: string): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id)
      .eq("dorm_id", dormId);

    if (error) {
      console.error("Error removing from history by dorm id:", error);
      throw error;
    }
  },

  /**
   * Clear all viewing history for current user
   */
  async clearHistory(): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing history:", error);
      throw error;
    }
  },
};
