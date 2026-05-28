/**
 * @file ./src/components/housing/hooks/useDormComments.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [HOOK] Local state management for dorm comments and votes.
// [钩子] 管理宿舍评论和投票的本地状态。
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  type DormComment,
  dormCommentsService,
} from "../../../services/dormCommentsService";
import { SHOW_GOOGLE_REVIEWS } from "../constants/featureFlags";

// ── Guest vote localStorage helpers ──────────────────────────────────────
const GUEST_VOTES_KEY = "guest_comment_votes";

function getGuestVotes(): Record<string, 1 | -1 | null> {
  try {
    const raw = localStorage.getItem(GUEST_VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setGuestVote(commentId: string, vote: 1 | -1 | null) {
  const votes = getGuestVotes();
  if (vote === null) {
    delete votes[commentId];
  } else {
    votes[commentId] = vote;
  }
  localStorage.setItem(GUEST_VOTES_KEY, JSON.stringify(votes));
}

// ── Hook ─────────────────────────────────────────────────────────────────
export function useDormComments(dormId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<DormComment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let data = await dormCommentsService.getComments(dormId);

    // Merge Google Maps simulation comments (controlled by feature flag)
    if (SHOW_GOOGLE_REVIEWS) {
      const { GOOGLE_REVIEWS } = await import("../constants/googleReviews");
      const googleCommentsForDorm = GOOGLE_REVIEWS.filter(
        (c) => c.dorm_id === dormId
      );
      data = [...data, ...googleCommentsForDorm];
    }

    // Merge guest votes from localStorage when not logged in
    if (!user) {
      const guestVotes = getGuestVotes();
      const merged = data.map((c) => {
        const gv = guestVotes[c.id];
        if (gv == null) {return c;}
        return {
          ...c,
          myVote: gv,
          upvotes: c.upvotes + (gv === 1 ? 1 : 0),
          downvotes: c.downvotes + (gv === -1 ? 1 : 0),
        };
      });
      setComments(merged);
    } else {
      setComments(data);
    }
    setLoading(false);
  }, [dormId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveComment = async (content: string, dormVote: 1 | -1 | null) => {
    const saved = await dormCommentsService.saveComment(
      dormId,
      content,
      dormVote
    );
    setComments((prev) => {
      const without = prev.filter((c) => c.user_id !== saved.user_id);
      return [saved, ...without];
    });
  };

  const deleteComment = async (id: string) => {
    await dormCommentsService.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const voteOnComment = async (commentId: string, vote: 1 | -1 | null) => {
    // Google Reviews 模拟评论不写 Supabase（防御性守卫）
    if (commentId.startsWith("gm-")) {
      if (!user) {setGuestVote(commentId, vote);}
    } else if (user) {
      await dormCommentsService.voteOnComment(commentId, vote);
    } else {
      // Guest: persist in localStorage only
      setGuestVote(commentId, vote);
    }

    // Optimistic UI update (works for both guest and logged-in)
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) {return c;}
        const prevVote = c.myVote;
        let { upvotes, downvotes } = c;
        if (prevVote === 1) {upvotes--;}
        if (prevVote === -1) {downvotes--;}
        if (vote === 1) {upvotes++;}
        if (vote === -1) {downvotes++;}
        return { ...c, upvotes, downvotes, myVote: vote };
      })
    );
  };

  const thumbsUp = comments.filter((c) => c.dorm_vote === 1).length;
  const thumbsDown = comments.filter((c) => c.dorm_vote === -1).length;

  return {
    comments,
    loading,
    user,
    thumbsUp,
    thumbsDown,
    saveComment,
    deleteComment,
    voteOnComment,
  };
}
