import type { User } from "@supabase/supabase-js"

import { supabase } from "./supabase"

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { data, error }
  },

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

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

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

    if (data.user && !error) {
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        display_name: displayName,
        language: "zh",
      })
    }

    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
    return subscription
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    return { data, error }
  },

  async updateUserProfile(
    userId: string,
    updates: { language?: "en" | "zh"; display_name?: string },
  ) {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId)

    return { data, error }
  },

  async updateUser(attributes: { data: { display_name: string } }) {
    const { data, error } = await supabase.auth.updateUser(attributes)
    return { data, error }
  },
}
