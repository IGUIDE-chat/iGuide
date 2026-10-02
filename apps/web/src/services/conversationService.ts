import { ChatMessage } from "../types"
import { authService } from "./authService"
import { supabase, type Message } from "./supabase"

export const conversationService = {
  async createConversation(cozeConversationId?: string, title: string = "新对话") {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        coze_conversation_id: cozeConversationId,
        title,
      })
      .select()
      .single()

    return { data, error }
  },

  async getUserConversations() {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        title,
        coze_conversation_id,
        is_pinned,
        created_at,
        updated_at,
        messages (
          id,
          content,
          role,
          created_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })

    return { data, error }
  },

  async getConversation(conversationId: string) {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(conversationId)) {
      console.warn(`[Suspicious ID] Blocked non-UUID conversation check: ${conversationId}`)
      return { data: null, error: new Error("Invalid conversation ID format") }
    }

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return { data: null, error: convError || new Error("Access denied") }
    }

    supabase
      .from("conversations")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", conversationId)
      .then(({ error }) => {
        if (error) console.error("Failed to update last_viewed_at:", error)
      })

    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    return {
      data: { conversation, messages: messages || [] },
      error: msgError,
    }
  },

  async saveMessage(conversationId: string, message: ChatMessage) {
    const row = {
      conversation_id: conversationId,
      role: message.role,
      content: message.text,
      follow_up_questions: message.followUpQuestions || null,
    }
    const insert = (values: typeof row & { sources?: ChatMessage["sources"] }) =>
      supabase.from("messages").insert(values).select().single()

    let { data, error } = await insert(
      message.sources?.length ? { ...row, sources: message.sources } : row,
    )
    // PGRST204: the `sources` column does not exist yet (migration
    // add_message_sources.sql not applied). Keep the message, drop its sources.
    if (error?.code === "PGRST204" && message.sources?.length) {
      ;({ data, error } = await insert(row))
    }

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    return { data, error }
  },

  async updateCozeConversationId(conversationId: string, cozeConversationId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ coze_conversation_id: cozeConversationId })
      .eq("id", conversationId)

    return { data, error }
  },

  async updateConversationTitle(conversationId: string, title: string) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId)

    return { data, error }
  },

  async deleteConversation(conversationId: string) {
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId)

    return { error }
  },

  async togglePinConversation(conversationId: string, isPinned: boolean) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ is_pinned: isPinned })
      .eq("id", conversationId)

    return { data, error }
  },

  convertToChatMessages(messages: Message[]): ChatMessage[] {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "model",
      text: msg.content,
      followUpQuestions: msg.follow_up_questions || undefined,
      sources: msg.sources || undefined,
    }))
  },
}
