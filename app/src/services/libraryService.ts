/**
 * @file ./src/services/libraryService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Manages reading history, pinned articles, and library interactions.
// [服务] 管理阅读历史、置顶文章以及知识库交互功能。
import { type Article, type LibraryHistoryItem } from "../types"
import { authService } from "./authService"
import { supabase } from "./supabase"

export const libraryService = {
  /**
   * Get reading history from Supabase
   */
  async getHistory(): Promise<LibraryHistoryItem[]> {
    const user = await authService.getCurrentUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("reading_history")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false }) // Pinned first
      .order("last_viewed_at", { ascending: false })

    if (error) {
      console.error("Error fetching history:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      articleId: item.article_id,
      articleTitle: item.article_title,
      articleTitleZh: item.article_title_zh,
      isPinned: item.is_pinned ?? false,
      viewedAt: item.last_viewed_at,
    }))
  },

  /**
   * Toggle pin status of a history item
   */
  async togglePin(id: string, isPinned: boolean) {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from("reading_history")
      .update({ is_pinned: !isPinned })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error toggling pin:", error)
      throw error
    }
  },

  /**
   * Remove item from history
   */
  async removeFromHistory(id: string) {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from("reading_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error removing from history:", error)
      throw error
    }
  },

  /**
   * Add article to reading history
   */
  async addToHistory(article: Article) {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    // Upsert logic: insert or update timestamps if exists
    // Since we have a UNIQUE constraint on (user_id, article_id),
    // we can use upsert to update the timestamp if it exists.

    const { error } = await supabase.from("reading_history").upsert(
      {
        user_id: user.id,
        article_id: article.id,
        article_title: article.title,
        article_title_zh: article.title_zh ?? null, // Optional for Chinese title
        last_viewed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id, article_id",
      }
    )

    if (error) {
      console.error("Error adding to history:", error)
    }
  },

  /**
   * Clear all reading history
   */
  async clearHistory() {
    const user = await authService.getCurrentUser()
    if (!user) {
      return
    }

    const { error } = await supabase
      .from("reading_history")
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error("Error clearing history:", error)
    }
  },
}
