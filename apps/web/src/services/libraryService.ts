import { Article, LibraryHistoryItem } from "../types"
import { authService } from "./authService"
import { supabase } from "./supabase"

export const libraryService = {
  async getHistory(): Promise<LibraryHistoryItem[]> {
    const user = await authService.getCurrentUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("reading_history")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
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
      isPinned: item.is_pinned || false,
      viewedAt: item.last_viewed_at,
    }))
  },

  async togglePin(id: string, isPinned: boolean) {
    const user = await authService.getCurrentUser()
    if (!user) return

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

  async removeFromHistory(id: string) {
    const user = await authService.getCurrentUser()
    if (!user) return

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

  async addToHistory(article: Article) {
    const user = await authService.getCurrentUser()
    if (!user) return

    // Since we have a UNIQUE constraint on (user_id, article_id),
    // we can use upsert to update the timestamp if it exists.
    const { error } = await supabase.from("reading_history").upsert(
      {
        user_id: user.id,
        article_id: article.id,
        article_title: article.title,
        article_title_zh: article.title_zh || null,
        last_viewed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id, article_id",
      },
    )

    if (error) {
      console.error("Error adding to history:", error)
    }
  },

  async clearHistory() {
    const user = await authService.getCurrentUser()
    if (!user) return

    const { error } = await supabase.from("reading_history").delete().eq("user_id", user.id)

    if (error) {
      console.error("Error clearing history:", error)
    }
  },
}
