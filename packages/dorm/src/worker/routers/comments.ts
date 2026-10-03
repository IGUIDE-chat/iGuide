import { Hono } from "hono"

import { depsFrom, identityFrom, requireAdmin, requireUser, type DormEnv } from "../deps.ts"
import {
  DormApiError,
  readJsonObject,
  readOptionalString,
  readPathParam,
  readRequiredString,
} from "../errors.ts"
import {
  deleteComment,
  getAllDormStats,
  getComments,
  saveComment,
  setCommentHidden,
  voteOnComment,
  type DormVote,
} from "../repositories/commentsRepo.ts"

const MAX_CONTENT_LENGTH = 2000

/** Throws a 400 unless `value` is a whole number, null, or absent-as-null. */
function parseVote(value: unknown): DormVote {
  if (value === undefined || value === null) return null
  if (value === 1 || value === -1) return value
  throw new DormApiError(400, "INVALID_VOTE", '"vote" must be 1, -1, or null')
}

/** `/api/dorms/comments` — stats, votes, moderation, and comment deletion. */
export const commentsRouter = new Hono<DormEnv>()

commentsRouter.get("/stats", async (c) => {
  const { supabase } = depsFrom(c)
  return c.json(await getAllDormStats(supabase))
})

commentsRouter.post("/:commentId/vote", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)
  await voteOnComment(supabase, readPathParam(c, "commentId"), userId, parseVote(body.vote))
  return c.json({ ok: true })
})

commentsRouter.patch("/:commentId", async (c) => {
  const { supabase } = depsFrom(c)
  requireAdmin(await identityFrom(c))
  const body = await readJsonObject(c)
  if (typeof body.hidden !== "boolean") {
    throw new DormApiError(400, "INVALID_BODY", '"hidden" must be a boolean')
  }
  await setCommentHidden(supabase, readPathParam(c, "commentId"), body.hidden)
  return c.json({ ok: true })
})

commentsRouter.delete("/:commentId", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await deleteComment(supabase, readPathParam(c, "commentId"), userId)
  return c.json({ ok: true })
})

/** `/api/dorms/:dormId/comments` — the guest-visible list and its own posting. */
export const dormCommentsRouter = new Hono<DormEnv>()

dormCommentsRouter.get("/", async (c) => {
  const { supabase } = depsFrom(c)
  const identity = await identityFrom(c)
  const currentUserId = identity.isAuthenticated ? identity.userId : null
  const comments = await getComments(supabase, readPathParam(c, "dormId"), currentUserId)
  // RLS already withholds hidden rows from non-admins; filter again so a stale
  // policy can never leak one into the dorm page.
  return c.json(identity.isAdmin ? comments : comments.filter((comment) => !comment.hidden))
})

dormCommentsRouter.post("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)

  const content = readRequiredString(body, "content", { maxLength: MAX_CONTENT_LENGTH }).trim()
  if (content.length === 0) {
    throw new DormApiError(400, "INVALID_BODY", '"content" must not be blank')
  }

  return c.json(
    await saveComment(supabase, {
      dormId: readPathParam(c, "dormId"),
      userId,
      displayName: readOptionalString(body, "display_name", { maxLength: 120 }) ?? "Anonymous",
      content,
      vote: parseVote(body.dorm_vote),
    }),
    201,
  )
})
