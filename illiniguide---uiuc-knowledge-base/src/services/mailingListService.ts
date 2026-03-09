// [SERVICE] Mailing list subscriptions — stores signups in Supabase `mailing_list` table.
// [服务] 邮件列表订阅——将注册信息存储在 Supabase `mailing_list` 表中。
import { supabase } from './supabase';

const TABLE = 'mailing_list';

export type MailingListTopic = 'courses' | 'resume' | 'dorms';

interface SubscribeResult {
    success: boolean;
    alreadySubscribed?: boolean;
    errorMessage?: string;
}

/**
 * Subscribe an email to a specific topic's mailing list.
 * Prevents duplicate subscriptions for the same email + topic.
 */
export async function subscribe(email: string, topic: MailingListTopic): Promise<SubscribeResult> {
    // Check for existing subscription
    const { data: existing } = await supabase
        .from(TABLE)
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('topic', topic)
        .maybeSingle();

    if (existing) {
        return { success: true, alreadySubscribed: true };
    }

    const { error } = await supabase.from(TABLE).insert({
        email: email.toLowerCase().trim(),
        topic,
    });

    if (error) {
        console.error('[mailingListService] subscribe error:', error);
        return { success: false, errorMessage: error.message };
    }

    return { success: true };
}

export const mailingListService = { subscribe };
