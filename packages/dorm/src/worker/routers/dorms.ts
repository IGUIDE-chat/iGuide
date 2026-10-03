import { Hono } from "hono"

import { depsFrom, identityFrom, requireAdmin, type DormEnv } from "../deps.ts"
import {
  DormApiError,
  readJsonObject,
  readObject,
  readOptionalString,
  readPathParam,
  readRequiredString,
} from "../errors.ts"
import {
  getDorm,
  getDormRow,
  getEditHistory,
  listDorms,
  logEdit,
  restoreSnapshot,
  updateDorm,
  uploadDormImage,
  type DormUpdate,
  type EditHistoryEntry,
} from "../repositories/dormsRepo.ts"
import { dormCommentsRouter } from "./comments.ts"

/**
 * `/api/dorms` — guest reads plus the admin write surface. Route order matters:
 * `/comments`, `/favorites` and `/history` are mounted before this router in
 * `app.ts`, so `GET /:id` never swallows them.
 */
export const dormsRouter = new Hono<DormEnv>()

dormsRouter.get("/", async (c) => {
  const { supabase } = depsFrom(c)
  return c.json(await listDorms(supabase))
})

dormsRouter.get("/:id/edit-history", async (c) => {
  const { supabase } = depsFrom(c)
  requireAdmin(await identityFrom(c))
  return c.json(await getEditHistory(supabase, readPathParam(c, "id")))
})

dormsRouter.get("/:id", async (c) => {
  const { supabase } = depsFrom(c)
  const dorm = await getDorm(supabase, readPathParam(c, "id"))
  if (!dorm) {
    throw new DormApiError(404, "DORM_NOT_FOUND", "Dorm not found")
  }
  return c.json(dorm)
})

dormsRouter.patch("/:id", async (c) => {
  const { supabase } = depsFrom(c)
  const changedBy = requireAdmin(await identityFrom(c))
  const dormId = readPathParam(c, "id")
  const row = await getDormRow(supabase, dormId)
  if (!row) {
    throw new DormApiError(404, "DORM_NOT_FOUND", "Dorm not found")
  }

  const body = await readJsonObject(c)
  const rawUpdates = readObject(body, "updates")
  if (Object.keys(rawUpdates).length === 0) {
    throw new DormApiError(400, "INVALID_BODY", '"updates" must contain at least one field')
  }
  // Per-column types are the database's job to enforce; dormsRepo strips
  // anything outside KNOWN_DB_COLUMNS before the write.
  const updates = rawUpdates as DormUpdate

  await updateDorm(supabase, dormId, updates)

  if (body.edit_history !== undefined && body.edit_history !== null) {
    const entry = readObject(body, "edit_history")
    void logEdit(
      supabase,
      dormId,
      readOptionalString(entry, "dorm_name", { maxLength: 200 }) ?? (row.name as string),
      readOptionalString(entry, "changed_by", { maxLength: 200 }) ?? changedBy,
      readRequiredString(entry, "summary", { maxLength: 500 }),
      readObject(entry, "snapshot_before"),
    )
  }

  return c.json({ ok: true, id: dormId })
})

dormsRouter.post("/:id/restore", async (c) => {
  const { supabase } = depsFrom(c)
  const changedBy = requireAdmin(await identityFrom(c))
  const dormId = readPathParam(c, "id")
  const row = await getDormRow(supabase, dormId)
  if (!row) {
    throw new DormApiError(404, "DORM_NOT_FOUND", "Dorm not found")
  }

  const body = await readJsonObject(c)
  const entry: EditHistoryEntry = {
    id: readOptionalString(body, "id") ?? "",
    dorm_id: dormId,
    dorm_name: readOptionalString(body, "dorm_name", { maxLength: 200 }) ?? (row.name as string),
    changed_by: readOptionalString(body, "changed_by", { maxLength: 200 }) ?? changedBy,
    changed_at: readOptionalString(body, "changed_at") ?? new Date().toISOString(),
    summary: readRequiredString(body, "summary", { maxLength: 500 }),
    snapshot: readObject(body, "snapshot"),
  }

  await restoreSnapshot(supabase, dormId, entry)
  return c.json({ ok: true, id: dormId })
})

dormsRouter.post("/:id/images", async (c) => {
  const { supabase } = depsFrom(c)
  requireAdmin(await identityFrom(c))
  await getDormRow(supabase, readPathParam(c, "id"))

  let form: FormData
  try {
    form = await c.req.raw.formData()
  } catch {
    throw new DormApiError(400, "INVALID_UPLOAD", "Request body must be multipart/form-data")
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    throw new DormApiError(400, "INVALID_UPLOAD", '"file" must be an uploaded image')
  }

  return c.json(await uploadDormImage(supabase, file), 201)
})

dormsRouter.route("/:dormId/comments", dormCommentsRouter)
