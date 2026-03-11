/**
 * @file ./src/components/housing/hooks/useDormComments.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [HOOK] Local state management for dorm comments and votes.
// [钩子] 管理宿舍评论和投票的本地状态。
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dormCommentsService, DormComment } from '../../../services/dormCommentsService';

export function useDormComments(dormId: string) {
    const { user } = useAuth();
    const [comments, setComments] = useState<DormComment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await dormCommentsService.getComments(dormId);
        setComments(data);
        setLoading(false);
    }, [dormId]);

    useEffect(() => {
        load();
    }, [load]);

    const saveComment = async (content: string, dormVote: 1 | -1 | null) => {
        const saved = await dormCommentsService.saveComment(dormId, content, dormVote);
        setComments(prev => {
            const without = prev.filter(c => c.user_id !== saved.user_id);
            return [saved, ...without];
        });
    };

    const deleteComment = async (id: string) => {
        await dormCommentsService.deleteComment(id);
        setComments(prev => prev.filter(c => c.id !== id));
    };

    const voteOnComment = async (commentId: string, vote: 1 | -1 | null) => {
        await dormCommentsService.voteOnComment(commentId, vote);
        setComments(prev =>
            prev.map(c => {
                if (c.id !== commentId) return c;
                const prevVote = c.myVote;
                let { upvotes, downvotes } = c;
                // Undo previous vote
                if (prevVote === 1) upvotes--;
                if (prevVote === -1) downvotes--;
                // Apply new vote
                if (vote === 1) upvotes++;
                if (vote === -1) downvotes++;
                return { ...c, upvotes, downvotes, myVote: vote };
            })
        );
    };

    const thumbsUp = comments.filter(c => c.dorm_vote === 1).length;
    const thumbsDown = comments.filter(c => c.dorm_vote === -1).length;

    return { comments, loading, user, thumbsUp, thumbsDown, saveComment, deleteComment, voteOnComment };
}
