import { Hono } from "hono"

import { depsFrom, identityFrom, requireUser, type DormEnv } from "../deps.ts"
import {
  readJsonObject,
  readLimitParam,
  readOptionalString,
  readPathParam,
  readRequiredString,
} from "../errors.ts"
import {
  addToHistory,
  clearHistory,
  listHistory,
  removeFromHistory,
  removeFromHistoryByDormId,
} from "../repositories/historyRepo.ts"

/** `/api/dorms/history` — the caller's own dorm viewing history. */
export const historyRouter = new Hono<DormEnv>()

historyRouter.get("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  return c.json(await listHistory(supabase, userId, readLimitParam(c.req.query("limit"), 20)))
})

historyRouter.post("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)
  await addToHistory(supabase, {
    userId,
    dormId: readRequiredString(body, "dorm_id", { maxLength: 120 }),
    dormName: readRequiredString(body, "dorm_name", { maxLength: 200 }),
    dormNameZh: readOptionalString(body, "dorm_name_zh", { maxLength: 200 }),
    viewedAt: new Date().toISOString(),
  })
  return c.json({ ok: true })
})

historyRouter.delete("/by-dorm/:dormId", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await removeFromHistoryByDormId(supabase, readPathParam(c, "dormId"), userId)
  return c.json({ ok: true })
})

historyRouter.delete("/:id", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await removeFromHistory(supabase, readPathParam(c, "id"), userId)
  return c.json({ ok: true })
})

historyRouter.delete("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await clearHistory(supabase, userId)
  return c.json({ ok: true })
})
