/**
 * @file ./src/services/dormCommentsService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Manages dorm comments and comment votes with Supabase.
// [服务] 管理宿舍评论和评论投票（Supabase）。
import { supabase } from './supabase';
import { authService } from './authService';

export interface DormComment {
    id: string;
    dorm_id: string;
    user_id: string;
    display_name: string;
    content: string;
    dorm_vote: 1 | -1 | null;
    created_at: string;
    // Aggregated client-side from dorm_comment_votes:
    upvotes: number;
    downvotes: number;
    myVote: 1 | -1 | null;
}

interface RawVote {
    vote: number;
    user_id: string;
}

interface RawComment {
    id: string;
    dorm_id: string;
    user_id: string;
    display_name: string;
    content: string;
    dorm_vote: number | null;
    created_at: string;
    dorm_comment_votes: RawVote[];
}

function aggregateComment(raw: RawComment, currentUserId: string | null): DormComment {
    let upvotes = 0;
    let downvotes = 0;
    let myVote: 1 | -1 | null = null;

    for (const v of raw.dorm_comment_votes) {
        if (v.vote === 1) upvotes++;
        else if (v.vote === -1) downvotes++;
        if (currentUserId && v.user_id === currentUserId) {
            myVote = v.vote as 1 | -1;
        }
    }

    return {
        id: raw.id,
        dorm_id: raw.dorm_id,
        user_id: raw.user_id,
        display_name: raw.display_name,
        content: raw.content,
        dorm_vote: raw.dorm_vote as 1 | -1 | null,
        created_at: raw.created_at,
        upvotes,
        downvotes,
        myVote,
    };
}

export interface DormCommentStats {
    dormId: string;
    totalComments: number;
    thumbsUp: number;
    positivePercent: number | null;
}

export const dormCommentsService = {
    /**
     * Fetch aggregate comment stats for all dorms (total count + thumbs up count).
     */
    async getAllDormStats(): Promise<Record<string, DormCommentStats>> {
        const { data, error } = await supabase
            .from('dorm_comments')
            .select('dorm_id, dorm_vote');

        if (error) {
            console.error('Error fetching dorm comment stats:', error);
            return {};
        }

        const statsMap: Record<string, { total: number; up: number }> = {};
        for (const row of data ?? []) {
            const id = row.dorm_id as string;
            if (!statsMap[id]) statsMap[id] = { total: 0, up: 0 };
            statsMap[id].total++;
            if (row.dorm_vote === 1) statsMap[id].up++;
        }

        const result: Record<string, DormCommentStats> = {};
        for (const [dormId, s] of Object.entries(statsMap)) {
            result[dormId] = {
                dormId,
                totalComments: s.total,
                thumbsUp: s.up,
                positivePercent: s.total > 0 ? Math.round((s.up / s.total) * 100) : null,
            };
        }
        return result;
    },

    /**
     * Fetch all comments + vote counts + current user's vote for one dorm.
     */
    async getComments(dormId: string): Promise<DormComment[]> {
        const user = await authService.getCurrentUser();

        const { data, error } = await supabase
            .from('dorm_comments')
            .select(`*, dorm_comment_votes(vote, user_id)`)
            .eq('dorm_id', dormId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching dorm comments:', error);
            return [];
        }

        const currentUserId = user?.id ?? null;
        return (data as RawComment[]).map(raw => aggregateComment(raw, currentUserId));
    },

    /**
     * Upsert own comment (insert or update content + dorm_vote).
     */
    async saveComment(dormId: string, content: string, dormVote: 1 | -1 | null): Promise<DormComment> {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const display_name = user.email?.split('@')[0] ?? 'Anonymous';

        const { data, error } = await supabase
            .from('dorm_comments')
            .upsert(
                { dorm_id: dormId, user_id: user.id, display_name, content, dorm_vote: dormVote },
                { onConflict: 'dorm_id,user_id' }
            )
            .select(`*, dorm_comment_votes(vote, user_id)`)
            .single();

        if (error) {
            console.error('Error saving dorm comment:', error);
            throw error;
        }

        return aggregateComment(data as RawComment, user.id);
    },

    /**
     * Delete own comment.
     */
    async deleteComment(commentId: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('dorm_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting dorm comment:', error);
            throw error;
        }
    },

    /**
     * Upsert a vote on a comment. Pass null to remove the vote.
     */
    async voteOnComment(commentId: string, vote: 1 | -1 | null): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        if (vote === null) {
            const { error } = await supabase
                .from('dorm_comment_votes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error removing comment vote:', error);
                throw error;
            }
        } else {
            const { error } = await supabase
                .from('dorm_comment_votes')
                .upsert(
                    { comment_id: commentId, user_id: user.id, vote },
                    { onConflict: 'comment_id,user_id' }
                );

            if (error) {
                console.error('Error saving comment vote:', error);
                throw error;
            }
        }
    },
};
