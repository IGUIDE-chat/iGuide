import { Hono } from "hono"

import { depsFrom, identityFrom, requireUser, type DormEnv } from "../deps.ts"
import {
  DormApiError,
  readJsonObject,
  readOptionalString,
  readPathParam,
  readRequiredString,
} from "../errors.ts"
import {
  addOrKeepFavorite,
  clearFavorites,
  listFavorites,
  removeFavorite,
  toggleFavorite,
  updateFavoriteNotes,
  type FavoriteInput,
} from "../repositories/favoritesRepo.ts"

/** `/api/dorms/favorites` — every route here is scoped to the signed-in caller. */
export const favoritesRouter = new Hono<DormEnv>()

favoritesRouter.get("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  return c.json(await listFavorites(supabase, userId))
})

favoritesRouter.post("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)
  return c.json(await addOrKeepFavorite(supabase, readFavoriteInput(body, userId)))
})

favoritesRouter.post("/toggle", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)
  return c.json(await toggleFavorite(supabase, readFavoriteInput(body, userId)))
})

favoritesRouter.patch("/:id", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  const body = await readJsonObject(c)
  if (!("notes" in body)) {
    throw new DormApiError(400, "INVALID_BODY", '"notes" is required')
  }
  await updateFavoriteNotes(
    supabase,
    readPathParam(c, "id"),
    userId,
    readOptionalString(body, "notes", { maxLength: 4000 }),
  )
  return c.json({ ok: true })
})

favoritesRouter.delete("/:id", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await removeFavorite(supabase, readPathParam(c, "id"), userId)
  return c.json({ ok: true })
})

favoritesRouter.delete("/", async (c) => {
  const { supabase } = depsFrom(c)
  const userId = requireUser(await identityFrom(c))
  await clearFavorites(supabase, userId)
  return c.json({ ok: true })
})

function readFavoriteInput(body: Record<string, unknown>, userId: string): FavoriteInput {
  return {
    userId,
    dormId: readRequiredString(body, "dorm_id", { maxLength: 120 }),
    dormName: readRequiredString(body, "dorm_name", { maxLength: 200 }),
    dormNameZh: readOptionalString(body, "dorm_name_zh", { maxLength: 200 }),
  }
}
