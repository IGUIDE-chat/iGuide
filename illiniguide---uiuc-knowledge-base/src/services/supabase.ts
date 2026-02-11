// [SERVICE] Supabase client configuration and type definitions for database interaction.
// [服务] Supabase 客户端配置及数据库交互的类型定义。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV) {
    console.log('[Supabase Setup] URL defined:', !!supabaseUrl);
    console.log('[Supabase Setup] Key defined:', !!supabaseAnonKey);
    console.log('[Supabase Setup] URL value (first 10 chars):', supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined');
    console.log('[Supabase Setup] Env Keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
    console.warn('Supabase credentials not found. UI will still load, but auth/cloud data will be unavailable.');
    console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase features.');
}

// createClient('', '') throws and can blank the page before React mounts.
// Use a safe placeholder client when config is missing so guest UI can still render.
const finalUrl = hasSupabaseConfig ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = hasSupabaseConfig ? supabaseAnonKey : 'placeholder-anon-key';

const disabledFetch: typeof fetch = async () => {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
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
    language: 'en' | 'zh';
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
    role: 'user' | 'model';
    content: string;
    follow_up_questions?: string[];
    created_at: string;
}
