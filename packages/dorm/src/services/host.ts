import type { SupabaseClient, User } from "@supabase/supabase-js"

export interface ChatHistoryItem {
  role: "user" | "model"
  text: string
}

export type StreamChatResponseFn = (
  history: ChatHistoryItem[],
  newMessage: string,
  lang?: string,
) => AsyncIterable<{ text: string }>

/**
 * What the host app lends the dorm services. The package never creates its own
 * Supabase client: a second GoTrue client would race the host's for the same
 * session in localStorage.
 */
export interface DormServices {
  supabase: SupabaseClient
  /** Streams the housing assistant's replies. */
  streamChatResponse: StreamChatResponseFn
}

let services: DormServices | null = null

/** Call once, before `DormRoutes` renders. */
export const configureDormServices = (next: DormServices): void => {
  services = next
}

const requireServices = (): DormServices => {
  if (!services) {
    throw new Error("@iguide/dorm: call configureDormServices() before rendering DormRoutes")
  }
  return services
}

export const getSupabase = (): SupabaseClient => requireServices().supabase

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await getSupabase().auth.getUser()
  return user
}

export const streamChatResponse: StreamChatResponseFn = (history, newMessage, lang) =>
  requireServices().streamChatResponse(history, newMessage, lang)
