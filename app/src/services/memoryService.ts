/**
 * @file ./src/services/memoryService.ts
 * @description Service for managing AI persona (soul), user profile memory, and conversation memory.
 * @description_zh 管理 AI 人设（soul）、用户画像记忆、对话记忆的服务。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { supabase } from "./supabase"

const SOUL_MAX_LENGTH = 500
const USER_MEMORY_MAX_LENGTH = 1500
const CONV_MEMORY_MAX_LENGTH = 1000

/**
 * Merge new soul preference entries into existing soul prompt.
 * Entries can be freeform lines or key-value pairs like "Tone: casual".
 */
function mergeSoul(existing: string, incoming: string): string {
  const existingLines = existing
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const newEntries = incoming
    .split(/[;\n]/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const entry of newEntries) {
    const colonIdx = entry.indexOf(":")
    let idx: number
    if (colonIdx > 0) {
      const key = entry.slice(0, colonIdx).trim().toLowerCase()
      idx = existingLines.findIndex((line) => {
        const lineColonIdx = line.indexOf(":")
        return (
          lineColonIdx > 0 &&
          line.slice(0, lineColonIdx).trim().toLowerCase() === key
        )
      })
    } else {
      idx = existingLines.findIndex(
        (line) => line.toLowerCase() === entry.toLowerCase()
      )
    }
    if (idx !== -1) {
      existingLines.splice(idx, 1)
    }
    existingLines.push(entry)
  }

  let result = existingLines.join("\n")
  while (result.length > SOUL_MAX_LENGTH && existingLines.length > 1) {
    existingLines.shift()
    result = existingLines.join("\n")
  }
  return result
}

/**
 * Merge new key-value entries into existing memory text, deduplicating by key prefix.
 * Each entry is a line like "Major: CS" or "Budget: $800".
 */
function mergeUserMemory(existing: string, incoming: string): string {
  const existingLines = existing
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const newEntries = incoming
    .split(/[;\n]/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const entry of newEntries) {
    const colonIdx = entry.indexOf(":")
    if (colonIdx > 0) {
      const key = entry.slice(0, colonIdx).trim().toLowerCase()
      // Remove existing line with same key
      const idx = existingLines.findIndex((line) => {
        const lineColonIdx = line.indexOf(":")
        return (
          lineColonIdx > 0 &&
          line.slice(0, lineColonIdx).trim().toLowerCase() === key
        )
      })
      if (idx !== -1) {
        existingLines.splice(idx, 1)
      }
    }
    existingLines.push(entry)
  }

  let result = existingLines.join("\n")
  // Enforce max length by dropping oldest lines
  while (result.length > USER_MEMORY_MAX_LENGTH && existingLines.length > 1) {
    existingLines.shift()
    result = existingLines.join("\n")
  }
  return result
}

export const memoryService = {
  // ── Soul ──────────────────────────────────────────────────────

  async getSoul(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from("user_souls")
      .select("soul_prompt")
      .eq("user_id", userId)
      .maybeSingle()
    if (error) {
      console.error("[memoryService] Failed to get soul:", { userId, error })
      return ""
    }
    return data?.soul_prompt ?? ""
  },

  async updateSoul(userId: string, soulPrompt: string): Promise<void> {
    const trimmed = soulPrompt.slice(0, SOUL_MAX_LENGTH)
    const { error } = await supabase.from("user_souls").upsert(
      {
        user_id: userId,
        soul_prompt: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    if (error) {
      console.error("[memoryService] Failed to update soul:", error)
    }
  },

  // ── User Memory ──────────────────────────────────────────────

  /**
   * Merge new entries into the user's soul/persona preferences.
   */
  async appendSoul(userId: string, newEntries: string): Promise<void> {
    const existing = await this.getSoul(userId)
    const merged = mergeSoul(existing, newEntries)
    await this.updateSoul(userId, merged)
  },

  async getUserMemory(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from("user_memories")
      .select("memory_text")
      .eq("user_id", userId)
      .maybeSingle()
    if (error) {
      console.error("[memoryService] Failed to get user memory:", {
        userId,
        error,
      })
      return ""
    }
    return data?.memory_text ?? ""
  },

  async updateUserMemory(userId: string, memoryText: string): Promise<void> {
    const trimmed = memoryText.slice(0, USER_MEMORY_MAX_LENGTH)
    const { error } = await supabase.from("user_memories").upsert(
      {
        user_id: userId,
        memory_text: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    if (error) {
      console.error("[memoryService] Failed to update user memory:", error)
    }
  },

  /**
   * Merge new entries into existing user memory (dedup by key).
   */
  async appendUserMemory(userId: string, newEntries: string): Promise<void> {
    const existing = await this.getUserMemory(userId)
    const merged = mergeUserMemory(existing, newEntries)
    await this.updateUserMemory(userId, merged)
  },

  // ── Conversation Memory ──────────────────────────────────────

  async getConversationMemory(conversationId: string): Promise<string> {
    const { data, error } = await supabase
      .from("conversation_memories")
      .select("memory_text")
      .eq("conversation_id", conversationId)
      .maybeSingle()
    if (error) {
      console.error("[memoryService] Failed to get conversation memory:", {
        conversationId,
        error,
      })
      return ""
    }
    return data?.memory_text ?? ""
  },

  async updateConversationMemory(
    conversationId: string,
    memoryText: string
  ): Promise<void> {
    const trimmed = memoryText.slice(0, CONV_MEMORY_MAX_LENGTH)
    const { error } = await supabase.from("conversation_memories").upsert(
      {
        conversation_id: conversationId,
        memory_text: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" }
    )
    if (error) {
      console.error(
        "[memoryService] Failed to update conversation memory:",
        error
      )
    }
  },

  // ── Composite fetch (parallel) ──────────────────────────────

  async getChatContext(
    userId: string,
    conversationId?: string
  ): Promise<{ soul: string; userMemory: string; conversationMemory: string }> {
    const [soul, userMemory, conversationMemory] = await Promise.all([
      this.getSoul(userId).catch(() => ""),
      this.getUserMemory(userId).catch(() => ""),
      conversationId
        ? this.getConversationMemory(conversationId).catch(() => "")
        : Promise.resolve(""),
    ])
    return { soul, userMemory, conversationMemory }
  },
}
