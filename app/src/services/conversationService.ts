/**
 * @file ./src/services/conversationService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { supabase, type Message } from "./supabase";
import { authService } from "./authService";
import { ChatMessage } from "../types";

export const conversationService = {
  /**
   * Create a new conversation
   */
  async createConversation(
    cozeConversationId?: string,
    title: string = "新对话"
  ) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        coze_conversation_id: cozeConversationId,
        title,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get all conversations for current user
   */
  async getUserConversations() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

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
      `
      )
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    return { data, error };
  },

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(conversationId: string) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Validate UUID format to prevent "invalid input syntax" errors
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      console.warn(
        `[Suspicious ID] Blocked non-UUID conversation check: ${conversationId}`
      );
      return { data: null, error: new Error("Invalid conversation ID format") };
    }

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return { data: null, error: convError || new Error("Access denied") };
    }

    // Update last_viewed_at asynchronously (no need to await)
    supabase
      .from("conversations")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", conversationId)
      .then(({ error }) => {
        if (error) console.error("Failed to update last_viewed_at:", error);
      });

    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, role, content, follow_up_questions, tool_calls, tool_call_id, created_at"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    return {
      data: { conversation, messages: messages || [] },
      error: msgError,
    };
  },

  /**
   * Save a message to a conversation
   */
  async saveMessage(conversationId: string, message: ChatMessage) {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.text,
        follow_up_questions: message.followUpQuestions || null,
      })
      .select()
      .single();

    // Update conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { data, error };
  },

  /**
   * Edit an existing message's content and stamp `edited_at`.
   * Used by the user-message regenerate flow.
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    newContent: string
  ) {
    const { data, error } = await supabase
      .from("messages")
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Delete all messages in a conversation strictly after the given ISO timestamp.
   * Used to truncate assistant + tool turns when a user edits an earlier message.
   */
  async deleteMessagesAfter(conversationId: string, afterIso: string) {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId)
      .gt("created_at", afterIso);
    return { error };
  },

  /**
   * Update conversation's Coze conversation ID
   */
  async updateCozeConversationId(
    conversationId: string,
    cozeConversationId: string
  ) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ coze_conversation_id: cozeConversationId })
      .eq("id", conversationId);

    return { data, error };
  },

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);

    return { data, error };
  },

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string) {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    return { error };
  },

  /**
   * Toggle pin status of a conversation
   */
  async togglePinConversation(conversationId: string, isPinned: boolean) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ is_pinned: isPinned })
      .eq("id", conversationId);

    return { data, error };
  },

  /**
   * Convert Supabase messages to ChatMessage format
   *
   * Handles `"user"`, `"assistant"` (and legacy `"model"`), and `"tool"` roles.
   * Passes through `tool_calls` and `tool_call_id` from the DB columns.
   * Legacy `"model"` rows are preserved as `role: "model"` for backward compat.
   */
  convertToChatMessages(messages: Message[]): ChatMessage[] {
    return messages.map((msg) => {
      const role =
        msg.role === "assistant"
          ? ("model" as const)
          : msg.role;

      const chatMsg: ChatMessage = {
        id: msg.id,
        role,
        text: msg.content,
        content: msg.content,
        followUpQuestions: msg.follow_up_questions || undefined,
      };

      // Pass through tool_call_id for tool messages
      if (msg.role === "tool" && msg.tool_call_id) {
        chatMsg.tool_call_id = msg.tool_call_id;
      }

      // Pass through tool_calls for assistant/model messages
      if (
        (msg.role === "assistant" || msg.role === "model") &&
        Array.isArray(msg.tool_calls)
      ) {
        chatMsg.tool_calls = msg.tool_calls as ChatMessage["tool_calls"];
      }

      return chatMsg;
    });
  },
};
