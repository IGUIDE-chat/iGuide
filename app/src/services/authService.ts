/**
 * @file ./src/services/authService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Authentication service utilities for checking user status.
// [服务] 用于检查用户状态的身份验证服务工具类。
import { supabase } from "./supabase"
import { type User } from "@supabase/supabase-js"

export const authService = {
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { data, error }
  },

  /**
   * Sign in with Microsoft (Azure) OAuth
   */
  async signInWithMicrosoft() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email",
        redirectTo: window.location.origin,
      },
    })
    return { data, error }
  },

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    // Create user profile
    if (data.user && !error) {
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        display_name: displayName,
        language: "zh",
      })
    }

    return { data, error }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
    return subscription
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    return { data, error }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: { language?: "en" | "zh"; display_name?: string }
  ) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)

    return { data, error }
  },

  /**
   * Update user metadata (display name)
   */
  async updateUser(attributes: { data: { display_name: string } }) {
    const { data, error } = await supabase.auth.updateUser(attributes)
    return { data, error }
  },
}
