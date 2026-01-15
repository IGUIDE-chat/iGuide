import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. App will load but Auth will fail.');
    console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Environment Variables.');
}

// Fallback to prevent app crash (White Screen) if keys are missing
// createClient throws if URL is empty string.
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);

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
