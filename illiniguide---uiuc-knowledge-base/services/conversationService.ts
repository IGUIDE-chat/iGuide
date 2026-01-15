import { supabase, type Conversation, type Message } from './supabase';
import { authService } from './authService';
import { ChatMessage } from '../types';

export const conversationService = {
    /**
     * Create a new conversation
     */
    async createConversation(cozeConversationId?: string, title: string = '新对话') {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: user.id,
                coze_conversation_id: cozeConversationId,
                title
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
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('conversations')
            .select(`
        id,
        title,
        coze_conversation_id,
        created_at,
        updated_at,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        return { data, error };
    },

    /**
     * Get a specific conversation with all messages
     */
    async getConversation(conversationId: string) {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError) return { data: null, error: convError };

        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        return {
            data: { conversation, messages: messages || [] },
            error: msgError
        };
    },

    /**
     * Save a message to a conversation
     */
    async saveMessage(conversationId: string, message: ChatMessage) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                role: message.role,
                content: message.text,
                follow_up_questions: message.followUpQuestions || null
            })
            .select()
            .single();

        // Update conversation's updated_at timestamp
        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return { data, error };
    },

    /**
     * Update conversation's Coze conversation ID
     */
    async updateCozeConversationId(conversationId: string, cozeConversationId: string) {
        const { data, error } = await supabase
            .from('conversations')
            .update({ coze_conversation_id: cozeConversationId })
            .eq('id', conversationId);

        return { data, error };
    },

    /**
     * Update conversation title
     */
    async updateConversationTitle(conversationId: string, title: string) {
        const { data, error } = await supabase
            .from('conversations')
            .update({ title })
            .eq('id', conversationId);

        return { data, error };
    },

    /**
     * Delete a conversation and all its messages
     */
    async deleteConversation(conversationId: string) {
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);

        return { error };
    },

    /**
     * Convert Supabase messages to ChatMessage format
     */
    convertToChatMessages(messages: Message[]): ChatMessage[] {
        return messages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'model',
            text: msg.content,
            followUpQuestions: msg.follow_up_questions || undefined
        }));
    }
};

