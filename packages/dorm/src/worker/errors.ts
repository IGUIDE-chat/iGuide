import type { ErrorHandler } from "hono"

/** The stable body every failed dorm endpoint returns. */
export interface DormErrorBody {
  /** Human-readable, safe to show a user. Never a raw Supabase message. */
  error: string
  /** Stable machine code the SPA switches on. */
  code: string
  details?: unknown
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export interface DormApiErrorOptions {
  /** A Response the host already built (identity rejection); returned verbatim. */
  response?: Response
  details?: unknown
}

/** A failure the endpoint can describe without leaking the database. */
export class DormApiError extends Error {
  readonly status: number
  readonly code: string
  readonly response: Response | undefined
  readonly details: unknown

  constructor(status: number, code: string, message?: string, options: DormApiErrorOptions = {}) {
    super(message ?? code)
    this.name = "DormApiError"
    this.status = status
    this.code = code
    this.response = options.response
    this.details = options.details
  }
}

/** A failed database call. The Supabase message is logged, never returned. */
export class DormRepositoryError extends Error {
  readonly code: string
  readonly dbErrorCode: string | undefined

  constructor(code: string, message: string, dbErrorCode?: string) {
    super(message)
    this.name = "DormRepositoryError"
    this.code = code
    this.dbErrorCode = dbErrorCode
  }
}

/** Parse a JSON object body, rejecting anything else with a useful 400. */
export async function readJsonObject(c: {
  req: { json(): Promise<unknown> }
}): Promise<Record<string, unknown>> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new DormApiError(400, "INVALID_JSON", "Request body must be valid JSON")
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new DormApiError(400, "INVALID_BODY", "Request body must be a JSON object")
  }
  return body as Record<string, unknown>
}

export function readRequiredString(
  body: Record<string, unknown>,
  field: string,
  options: { maxLength?: number } = {},
): string {
  const value = body[field]
  if (value === undefined || value === null) {
    throw new DormApiError(400, "INVALID_BODY", `"${field}" is required`)
  }
  if (typeof value !== "string") {
    throw new DormApiError(400, "INVALID_BODY", `"${field}" must be a string`)
  }
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new DormApiError(
      400,
      "INVALID_BODY",
      `"${field}" must be at most ${options.maxLength} characters`,
    )
  }
  return value
}

/** Read a required path parameter; Hono types them as possibly absent. */
export function readPathParam(
  c: { req: { param(name: string): string | undefined } },
  name: string,
): string {
  const value = c.req.param(name)
  if (!value) {
    throw new DormApiError(400, "INVALID_PATH", `"${name}" path parameter is required`)
  }
  return value
}

export function readOptionalString(
  body: Record<string, unknown>,
  field: string,
  options: { maxLength?: number } = {},
): string | null {
  const value = body[field]
  if (value === undefined || value === null) return null
  if (typeof value !== "string") {
    throw new DormApiError(400, "INVALID_BODY", `"${field}" must be a string or null`)
  }
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new DormApiError(
      400,
      "INVALID_BODY",
      `"${field}" must be at most ${options.maxLength} characters`,
    )
  }
  return value
}

export function readObject(body: Record<string, unknown>, field: string): Record<string, unknown> {
  const value = body[field]
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DormApiError(400, "INVALID_BODY", `"${field}" must be a JSON object`)
  }
  return value as Record<string, unknown>
}

/** Parse `?limit=` for list endpoints. */
export function readLimitParam(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new DormApiError(400, "INVALID_QUERY", '"limit" must be an integer from 1 to 100')
  }
  return parsed
}

const REPOSITORY_ERRORS: Record<string, { status: number; message: string }> = {
  COMMENT_HIDDEN: { status: 403, message: "This comment is hidden and cannot be changed" },
  COMMENT_NOT_FOUND: { status: 404, message: "Comment not found" },
  FAVORITE_NOT_FOUND: { status: 404, message: "Favorite not found" },
  HISTORY_NOT_FOUND: { status: 404, message: "History entry not found" },
}

/**
 * Turns every failure into the stable envelope: the database message is
 * logged here and never reaches the caller.
 */
export const dormErrorHandler: ErrorHandler = (err, _c) => {
  if (err instanceof DormApiError) {
    if (err.response) return err.response
    const body: DormErrorBody = { error: err.message, code: err.code }
    if (err.details !== undefined) body.details = err.details
    return json(body, err.status)
  }

  if (err instanceof DormRepositoryError) {
    console.error(`[dormApi] ${err.code} (db code ${err.dbErrorCode ?? "none"}):`, err.message)
    const mapped = REPOSITORY_ERRORS[err.code]
    return json(
      { error: mapped?.message ?? "Dorm data is temporarily unavailable", code: err.code },
      mapped?.status ?? 502,
    )
  }

  console.error("[dormApi] unhandled error:", err)
  return json({ error: "Internal server error", code: "INTERNAL" }, 500)
}
