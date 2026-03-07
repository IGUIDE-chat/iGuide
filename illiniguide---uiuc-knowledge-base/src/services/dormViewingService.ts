// [SERVICE] Manages dorm viewing history with Supabase.
// [服务] 管理宿舍浏览历史（Supabase）。
import { supabase } from './supabase';
import { authService } from './authService';

export interface DormViewingHistory {
    id: string;
    user_id: string;
    dorm_id: string;
    dorm_name: string;
    dorm_name_zh?: string;
    viewed_at: string;
    created_at: string;
}

const TABLE_NAME = 'user_history';

export const dormViewingService = {
    /**
     * Add a dorm to viewing history
     */
    async addToHistory(dormId: string, dormName: string, dormNameZh?: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const viewedAt = new Date().toISOString();

        const { data: existing, error: existingError } = await supabase
            .from(TABLE_NAME)
            .select('id')
            .eq('user_id', user.id)
            .eq('dorm_id', dormId)
            .maybeSingle();

        if (existingError) {
            console.error('Error checking existing viewing history:', existingError);
            throw existingError;
        }

        if (existing) {
            const { error } = await supabase
                .from(TABLE_NAME)
                .update({
                    dorm_name: dormName,
                    dorm_name_zh: dormNameZh || null,
                    viewed_at: viewedAt
                })
                .eq('id', existing.id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error updating viewing history:', error);
                throw error;
            }
            return;
        }

        const { error } = await supabase
            .from(TABLE_NAME)
            .insert({
                user_id: user.id,
                dorm_id: dormId,
                dorm_name: dormName,
                dorm_name_zh: dormNameZh || null,
                viewed_at: viewedAt
            });

        if (error) {
            console.error('Error adding viewing history:', error);
            throw error;
        }
    },

    /**
     * Get viewing history for current user
     */
    async getHistory(limit: number = 20): Promise<DormViewingHistory[]> {
        const user = await authService.getCurrentUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', user.id)
            .order('viewed_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching viewing history:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Remove a specific item from viewing history
     */
    async removeFromHistory(id: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error removing from history:', error);
            throw error;
        }
    },

    /**
     * Remove viewing history by dorm id for current user
     */
    async removeFromHistoryByDormId(dormId: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('user_id', user.id)
            .eq('dorm_id', dormId);

        if (error) {
            console.error('Error removing from history by dorm id:', error);
            throw error;
        }
    },

    /**
     * Clear all viewing history for current user
     */
    async clearHistory(): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('user_id', user.id);

        if (error) {
            console.error('Error clearing history:', error);
            throw error;
        }
    }
};
