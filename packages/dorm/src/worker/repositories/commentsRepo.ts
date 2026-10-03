import type { DormSupabase } from "../deps.ts"
import { DormRepositoryError } from "../errors.ts"

export const COMMENTS_TABLE = "dorm_comments"
export const VOTES_TABLE = "dorm_comment_votes"

export type DormVote = 1 | -1 | null

export interface DormComment {
  id: string
  dorm_id: string
  user_id: string
  display_name: string
  content: string
  dorm_vote: 1 | -1 | null
  created_at: string
  /** Moderation flag — hidden comments are only visible to admins. */
  hidden: boolean
  upvotes: number
  downvotes: number
  myVote: 1 | -1 | null
}

export interface DormCommentStats {
  dormId: string
  totalComments: number
  thumbsUp: number
  positivePercent: number | null
}

interface RawVote {
  vote: number
  user_id: string
}

interface RawComment {
  id: string
  dorm_id: string
  user_id: string
  display_name: string
  content: string
  dorm_vote: number | null
  created_at: string
  // Optional so the app keeps working before add_dorm_comment_hidden.sql runs.
  hidden?: boolean | null
  dorm_comment_votes: RawVote[]
}

function aggregateComment(raw: RawComment, currentUserId: string | null): DormComment {
  let upvotes = 0
  let downvotes = 0
  let myVote: 1 | -1 | null = null

  for (const v of raw.dorm_comment_votes) {
    if (v.vote === 1) upvotes++
    else if (v.vote === -1) downvotes++
    if (currentUserId && v.user_id === currentUserId) {
      myVote = v.vote as 1 | -1
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
    hidden: raw.hidden === true,
    upvotes,
    downvotes,
    myVote,
  }
}

/** Comment counts and thumbs-up share per dorm, for every dorm that has one. */
export async function getAllDormStats(
  supabase: DormSupabase,
): Promise<Record<string, DormCommentStats>> {
  let { data, error } = await supabase.from(COMMENTS_TABLE).select("dorm_id, dorm_vote, hidden")

  // Fall back if add_dorm_comment_hidden.sql has not been run yet (42703).
  if (error?.code === "42703") {
    ;({ data, error } = await supabase.from(COMMENTS_TABLE).select("dorm_id, dorm_vote"))
  }

  if (error) {
    throw new DormRepositoryError("COMMENT_STATS_FAILED", error.message, error.code)
  }

  const statsMap: Record<string, { total: number; up: number }> = {}
  for (const row of data ?? []) {
    // Admins can read hidden rows — they must not skew the public counts.
    if ("hidden" in row && row.hidden === true) continue
    const id = row.dorm_id as string
    if (!statsMap[id]) statsMap[id] = { total: 0, up: 0 }
    statsMap[id].total++
    if (row.dorm_vote === 1) statsMap[id].up++
  }

  const result: Record<string, DormCommentStats> = {}
  for (const [dormId, s] of Object.entries(statsMap)) {
    result[dormId] = {
      dormId,
      totalComments: s.total,
      thumbsUp: s.up,
      positivePercent: s.total > 0 ? Math.round((s.up / s.total) * 100) : null,
    }
  }
  return result
}

/**
 * Comments for one dorm, newest first. The router filters hidden rows for
 * non-admins, so a stale RLS policy can never leak one.
 */
export async function getComments(
  supabase: DormSupabase,
  dormId: string,
  currentUserId: string | null,
): Promise<DormComment[]> {
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .select<RawComment>(`*, ${VOTES_TABLE}(vote, user_id)`)
    .eq("dorm_id", dormId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new DormRepositoryError("COMMENTS_READ_FAILED", error.message, error.code)
  }

  return (data ?? []).map((raw) => aggregateComment(raw, currentUserId))
}

/** Upsert the caller's own comment on a dorm. One comment per user per dorm. */
export async function saveComment(
  supabase: DormSupabase,
  input: { dormId: string; userId: string; displayName: string; content: string; vote: DormVote },
): Promise<DormComment> {
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .upsert<RawComment>(
      {
        dorm_id: input.dormId,
        user_id: input.userId,
        display_name: input.displayName,
        content: input.content,
        dorm_vote: input.vote,
      },
      { onConflict: "dorm_id,user_id" },
    )
    .select<RawComment>(`*, ${VOTES_TABLE}(vote, user_id)`)
    .single()

  if (error) {
    // RLS blocks edits to a comment an admin has hidden (42501).
    if (error.code === "42501") {
      throw new DormRepositoryError("COMMENT_HIDDEN", error.message, error.code)
    }
    throw new DormRepositoryError("COMMENT_SAVE_FAILED", error.message, error.code)
  }

  if (!data) {
    throw new DormRepositoryError("COMMENT_SAVE_FAILED", "Upsert returned no comment row")
  }
  return aggregateComment(data, input.userId)
}

/** Delete the caller's own comment. Throws `COMMENT_NOT_FOUND` for anyone else's. */
export async function deleteComment(
  supabase: DormSupabase,
  commentId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId)
    .select("id")

  if (error) {
    throw new DormRepositoryError("COMMENT_DELETE_FAILED", error.message, error.code)
  }
  if (!data || data.length === 0) {
    throw new DormRepositoryError("COMMENT_NOT_FOUND", `No comment ${commentId} owned by ${userId}`)
  }
}

/** Admin-only: hide or un-hide a comment. */
export async function setCommentHidden(
  supabase: DormSupabase,
  commentId: string,
  hidden: boolean,
): Promise<void> {
  const { error } = await supabase.from(COMMENTS_TABLE).update({ hidden }).eq("id", commentId)
  if (error) {
    throw new DormRepositoryError("COMMENT_MODERATE_FAILED", error.message, error.code)
  }
}

/** Upsert a vote on a comment. Pass null to remove the vote. */
export async function voteOnComment(
  supabase: DormSupabase,
  commentId: string,
  userId: string,
  vote: DormVote,
): Promise<void> {
  if (vote === null) {
    const { error } = await supabase
      .from(VOTES_TABLE)
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId)

    if (error) {
      throw new DormRepositoryError("COMMENT_VOTE_FAILED", error.message, error.code)
    }
    return
  }

  const { error } = await supabase
    .from(VOTES_TABLE)
    .upsert({ comment_id: commentId, user_id: userId, vote }, { onConflict: "comment_id,user_id" })

  if (error) {
    throw new DormRepositoryError("COMMENT_VOTE_FAILED", error.message, error.code)
  }
}
