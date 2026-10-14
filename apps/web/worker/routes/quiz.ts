import { json, resolveIdentity } from "../auth.ts"
import type { FetchLike } from "../quiz/generate.ts"
import { QuizError, QuizService } from "../quiz/service.ts"
import { SupabaseQuizStore, type QuizStore } from "../quiz/store.ts"
import type { Env, RouteHandler } from "../types.ts"

export const QUIZ_API_PREFIX = "/api/quiz"

/** Seams for tests: the store and outbound fetch are swappable. */
export interface QuizRouteDeps {
  createStore?: (env: Env, accessToken: string) => QuizStore
  fetch?: FetchLike
  now?: () => Date
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new QuizError(400, "INVALID_JSON", "Request body must be JSON")
  }
}

function errorResponse(error: QuizError): Response {
  return json({ error: error.message, code: error.code }, error.status)
}

/**
 * `/api/quiz/*` — the daily quiz. Every endpoint needs a signed-in caller: the
 * quiz is personal, and the caller's token is what the Supabase store forwards
 * so RLS decides every row. DeepSeek is only ever called from inside the
 * Worker, for a signed-in caller, so no provider call is relayed for guests.
 *
 *   GET   /status         courses, today's quiz if any, open mistakes
 *   PUT   /courses        replace the synced course digests (from the extension)
 *   PATCH /courses/:id    { enabled }
 *   POST  /today          today's quiz, generated on first call ({ language })
 *   POST  /today/answers  { questionId, choice }
 *   GET   /mistakes       the open mistake bank, answers shown
 */
export async function handleQuizRequest(
  request: Request,
  env: Env,
  deps: QuizRouteDeps = {},
): Promise<Response> {
  const identity = await resolveIdentity(request, env)
  if (!identity.ok) return identity.response
  if (!identity.identity.isAuthenticated) {
    return json({ error: "Sign in to use the daily quiz", code: "SIGN_IN_REQUIRED" }, 401)
  }

  const userId = identity.identity.userId
  const accessToken = (request.headers.get("Authorization") ?? "").slice("Bearer ".length)
  const store = deps.createStore?.(env, accessToken) ?? new SupabaseQuizStore(env, accessToken)
  const service = new QuizService(store, {
    deepseekKey: env.DEEPSEEK_API_KEY,
    fetch: deps.fetch,
    now: deps.now,
  })

  const path = new URL(request.url).pathname.slice(QUIZ_API_PREFIX.length).replace(/\/+$/, "")
  const method = request.method

  try {
    if (path === "/status" && method === "GET") return json(await service.status(userId))
    if (path === "/courses" && method === "PUT") {
      return json({ courses: await service.uploadCourses(userId, await readJson(request)) })
    }
    const courseMatch = /^\/courses\/(\d+)$/.exec(path)
    if (courseMatch && method === "PATCH") {
      const body = (await readJson(request)) as { enabled?: unknown } | null
      await service.setCourseEnabled(userId, Number(courseMatch[1]), body?.enabled)
      return json({ ok: true })
    }
    if (path === "/today" && method === "POST") {
      const body = (await readJson(request)) as { language?: unknown } | null
      const language = body?.language === "zh" ? "zh" : "en"
      return json({ quiz: await service.ensureToday(userId, language) })
    }
    if (path === "/today/answers" && method === "POST") {
      return json({ quiz: await service.answer(userId, await readJson(request)) })
    }
    if (path === "/mistakes" && method === "GET") {
      return json({ mistakes: await service.mistakes(userId) })
    }
    return json({ error: "Not found", code: "NOT_FOUND", path: `${QUIZ_API_PREFIX}${path}` }, 404)
  } catch (error) {
    if (error instanceof QuizError) return errorResponse(error)
    console.error("Quiz route error:", error)
    return json({ error: "Quiz request failed", code: "INTERNAL" }, 500)
  }
}

export const onRequest: RouteHandler = ({ request, env }) => handleQuizRequest(request, env)
