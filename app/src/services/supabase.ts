/**
 * @file ./src/services/supabase.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Supabase client configuration and type definitions for database interaction.
// [服务] Supabase 客户端配置及数据库交互的类型定义。
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV) {
  console.log("[Supabase Setup] URL defined:", !!supabaseUrl);
  console.log("[Supabase Setup] Key defined:", !!supabaseAnonKey);
  console.log(
    "[Supabase Setup] URL value (first 10 chars):",
    supabaseUrl ? supabaseUrl.substring(0, 10) + "..." : "undefined"
  );
  console.log(
    "[Supabase Setup] Env Keys:",
    Object.keys(import.meta.env).filter((k) => k.startsWith("VITE_"))
  );
}

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.warn(
    "Supabase credentials not found. UI will still load, but auth/cloud data will be unavailable."
  );
  console.warn(
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase features."
  );
}

// createClient('', '') throws and can blank the page before React mounts.
// Use a safe placeholder client when config is missing so guest UI can still render.
const finalUrl = hasSupabaseConfig
  ? supabaseUrl
  : "https://placeholder.supabase.co";
const finalKey = hasSupabaseConfig ? supabaseAnonKey : "placeholder-anon-key";

const disabledFetch: typeof fetch = async () => {
  throw new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
};

export const supabase = createClient(
  finalUrl,
  finalKey,
  hasSupabaseConfig
    ? undefined
    : {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: disabledFetch,
        },
      }
);

// Database types
export interface UserProfile {
  id: string;
  language: "en" | "zh";
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  coze_conversation_id?: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "model";
  content: string;
  follow_up_questions?: string[];
  created_at: string;
}

export interface UserSoul {
  user_id: string;
  soul_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface UserMemory {
  user_id: string;
  memory_text: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMemory {
  conversation_id: string;
  memory_text: string;
  updated_at: string;
}
