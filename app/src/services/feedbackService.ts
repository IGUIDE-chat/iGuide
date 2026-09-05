/**
 * @file ./src/services/feedbackService.ts
 * @description Service for capturing 👍/👎 feedback on assistant chat replies.
 * @description_zh 管理对 AI 回复的 👍/👎 反馈：登录用户写入 Supabase，访客写入 localStorage。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 *
 * Logged-in users persist to the `message_feedback` Supabase table (RLS-scoped);
 * guests fall back to localStorage so the UI still reflects their choice on this
 * device. Note: live and reloaded message ids can differ (saveMessage assigns a
 * fresh row id), so feedback is keyed on the rendered message id as a best effort.
 */

import { supabase } from "./supabase";

export type FeedbackVote = 1 | -1;

const STORAGE_KEY = "guest_message_feedback";

interface SetFeedbackOptions {
  userId?: string;
  conversationId?: string | null;
  messageText?: string;
}

const getGuestStore = (): Record<string, FeedbackVote> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("[feedbackService] Failed to parse guest feedback", e);
    return {};
  }
};

const setGuestStore = (store: Record<string, FeedbackVote>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("[feedbackService] Failed to write guest feedback", e);
  }
};

export const feedbackService = {
  /**
   * Set or clear the vote for a message. Passing `null` removes the vote
   * (used when toggling the same button off).
   */
  async setFeedback(
    messageId: string,
    vote: FeedbackVote | null,
    options: SetFeedbackOptions = {}
  ): Promise<void> {
    const { userId, conversationId, messageText } = options;

    // Guest: persist locally only.
    if (!userId) {
      const store = getGuestStore();
      if (vote === null) {
        delete store[messageId];
      } else {
        store[messageId] = vote;
      }
      setGuestStore(store);
      return;
    }

    if (vote === null) {
      const { error } = await supabase
        .from("message_feedback")
        .delete()
        .eq("user_id", userId)
        .eq("message_id", messageId);
      if (error) {
        console.error("[feedbackService] Failed to clear feedback:", error);
      }
      return;
    }

    const { error } = await supabase.from("message_feedback").upsert(
      {
        user_id: userId,
        conversation_id: conversationId ?? null,
        message_id: messageId,
        vote,
        message_text: messageText ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,message_id" }
    );
    if (error) {
      console.error("[feedbackService] Failed to save feedback:", error);
    }
  },

  /**
   * Fetch the current votes for a conversation, keyed by message id, so the UI
   * can restore highlighted thumbs when a conversation is reopened.
   */
  async getFeedbackForConversation(
    conversationId: string,
    userId?: string
  ): Promise<Record<string, FeedbackVote>> {
    if (!userId) {
      return getGuestStore();
    }

    const { data, error } = await supabase
      .from("message_feedback")
      .select("message_id, vote")
      .eq("user_id", userId)
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("[feedbackService] Failed to load feedback:", error);
      return {};
    }

    const result: Record<string, FeedbackVote> = {};
    for (const row of data ?? []) {
      result[row.message_id as string] = row.vote as FeedbackVote;
    }
    return result;
  },
};
