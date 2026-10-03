import { useState, useEffect, useCallback } from "react"

import { useAuth } from "../../../contexts/DormHostContext"
import { dormCommentsService, DormComment } from "../../../services/dormCommentsService"
import { SHOW_COMMENTS, SHOW_GOOGLE_REVIEWS } from "../constants/featureFlags"

const GUEST_VOTES_KEY = "guest_comment_votes"

function getGuestVotes(): Record<string, 1 | -1 | null> {
  try {
    const raw = localStorage.getItem(GUEST_VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setGuestVote(commentId: string, vote: 1 | -1 | null) {
  const votes = getGuestVotes()
  if (vote === null) {
    delete votes[commentId]
  } else {
    votes[commentId] = vote
  }
  localStorage.setItem(GUEST_VOTES_KEY, JSON.stringify(votes))
}

export function useDormComments(dormId: string) {
  const { user } = useAuth()
  const [comments, setComments] = useState<DormComment[]>([])
  const [loading, setLoading] = useState(SHOW_COMMENTS)

  const load = useCallback(async () => {
    if (!SHOW_COMMENTS) return
    setLoading(true)
    let data = await dormCommentsService.getComments(dormId)

    if (SHOW_GOOGLE_REVIEWS) {
      const { GOOGLE_REVIEWS } = await import("../constants/googleReviews")
      const googleCommentsForDorm = GOOGLE_REVIEWS.filter((c) => c.dorm_id === dormId)
      data = [...data, ...googleCommentsForDorm]
    }

    if (!user) {
      const guestVotes = getGuestVotes()
      const merged = data.map((c) => {
        const gv = guestVotes[c.id]
        if (gv == null) return c
        return {
          ...c,
          myVote: gv,
          upvotes: c.upvotes + (gv === 1 ? 1 : 0),
          downvotes: c.downvotes + (gv === -1 ? 1 : 0),
        }
      })
      setComments(merged)
    } else {
      setComments(data)
    }
    setLoading(false)
  }, [dormId, user])

  useEffect(() => {
    load()
  }, [load])

  const saveComment = async (content: string, dormVote: 1 | -1 | null) => {
    if (!SHOW_COMMENTS) return
    const saved = await dormCommentsService.saveComment(dormId, content, dormVote)
    setComments((prev) => {
      const without = prev.filter((c) => c.user_id !== saved.user_id)
      return [saved, ...without]
    })
  }

  const deleteComment = async (id: string) => {
    if (!SHOW_COMMENTS) return
    await dormCommentsService.deleteComment(id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  /**
   * Admin-only moderation. Comments prefixed `gm-` come from the static Google
   * Reviews fixture rather than Supabase, so they have no row to update.
   */
  const setCommentHidden = async (commentId: string, hidden: boolean) => {
    if (!SHOW_COMMENTS || commentId.startsWith("gm-")) return
    await dormCommentsService.setCommentHidden(commentId, hidden)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, hidden } : c)))
  }

  const voteOnComment = async (commentId: string, vote: 1 | -1 | null) => {
    if (!SHOW_COMMENTS) return
    if (commentId.startsWith("gm-")) {
      if (!user) setGuestVote(commentId, vote)
    } else if (user) {
      await dormCommentsService.voteOnComment(commentId, vote)
    } else {
      setGuestVote(commentId, vote)
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c
        const prevVote = c.myVote
        let { upvotes, downvotes } = c
        if (prevVote === 1) upvotes--
        if (prevVote === -1) downvotes--
        if (vote === 1) upvotes++
        if (vote === -1) downvotes++
        return { ...c, upvotes, downvotes, myVote: vote }
      }),
    )
  }

  // Hidden comments are only present for admins; they must not move the counts.
  const visible = comments.filter((c) => !c.hidden)
  const thumbsUp = visible.filter((c) => c.dorm_vote === 1).length
  const thumbsDown = visible.filter((c) => c.dorm_vote === -1).length

  return {
    comments,
    loading,
    user,
    thumbsUp,
    thumbsDown,
    saveComment,
    deleteComment,
    voteOnComment,
    setCommentHidden,
  }
}
