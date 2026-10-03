import type { SupabaseClient } from "@supabase/supabase-js"
import type { Context } from "hono"

import { DormApiError } from "./errors.ts"

/** The caller fields the dorm API enforces on. */
export interface DormIdentity {
  /** Supabase user id; the host's placeholder value when unauthenticated. */
  userId: string
  isAuthenticated: boolean
  isAdmin: boolean
}

export type IdentityResult =
  | { ok: true; identity: DormIdentity }
  | { ok: false; response: Response }

/** A DB error as the repositories need it: message plus the code RLS returns. */
export interface DormDbError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export interface DormResult<T> {
  data: T | null
  error: DormDbError | null
}

export type DormRow = Record<string, unknown>

/**
 * The narrow slice of a PostgREST query builder the repositories use. The real
 * `SupabaseClient` is assignable to this; a test fake needs no network.
 */
export interface DormFilterBuilder<Row = DormRow> extends PromiseLike<DormResult<Row[]>> {
  select<Next = Row>(columns: string): DormFilterBuilder<Next>
  eq(column: string, value: unknown): DormFilterBuilder<Row>
  order(column: string, options?: { ascending?: boolean }): DormFilterBuilder<Row>
  limit(count: number): DormFilterBuilder<Row>
  maybeSingle(): PromiseLike<DormResult<Row | null>>
  single(): PromiseLike<DormResult<Row | null>>
}

export interface DormTableClient {
  select<Row = DormRow>(columns: string): DormFilterBuilder<Row>
  insert<Row = DormRow>(values: DormRow): DormFilterBuilder<Row>
  update<Row = DormRow>(values: DormRow): DormFilterBuilder<Row>
  upsert<Row = DormRow>(values: DormRow, options?: { onConflict?: string }): DormFilterBuilder<Row>
  delete<Row = DormRow>(): DormFilterBuilder<Row>
}

export interface DormStorageUploadResult {
  data: { path: string; fullPath: string } | null
  error: DormDbError | null
}

export interface DormStorageBucket {
  upload(
    path: string,
    file: Blob | ArrayBuffer,
    options?: { cacheControl?: string; upsert?: boolean; contentType?: string },
  ): PromiseLike<DormStorageUploadResult>
  getPublicUrl(path: string): { data: { publicUrl: string } | null }
}

/**
 * Everything the repositories are allowed to touch. Deliberately narrow: it
 * carries no service-role path, so the anon client plus RLS stays the only
 * authority.
 */
export interface DormSupabase {
  from(table: string): DormTableClient
  storage: { from(bucket: string): DormStorageBucket }
}

/**
 * Narrow the host's Supabase client to {@link DormSupabase}.
 *
 * supabase-js's builders are deeply self-referential, so TypeScript cannot
 * compare one structurally against this narrow interface without exceeding its
 * instantiation depth limit (TS2589). Narrowing happens once, here, instead of
 * at every call site. The runtime value is passed through untouched.
 */
export function asDormSupabase(client: SupabaseClient): DormSupabase {
  return client as unknown as DormSupabase
}

/**
 * What the host lends the dorm API for one request. There is no ambient env:
 * the sub-app reads these per request from the Hono context.
 */
export interface DormApiDeps {
  /**
   * A Supabase client that forwards this caller's `Authorization: Bearer`
   * token. The host builds it per request from `SUPABASE_URL` and
   * `SUPABASE_ANON_KEY`; it must never hold a service-role key.
   */
  supabase: DormSupabase
  resolveIdentity: (request: Request) => Promise<IdentityResult>
}

/** Context key the host's middleware sets before mounting the sub-app. */
export const dormDeps: unique symbol = Symbol("@iguide/dorm:deps")

export type DormEnv = { Variables: { [dormDeps]: DormApiDeps } }
export type DormContext = Context<DormEnv>

/** Read the per-request dependencies, or fail loudly when middleware skipped. */
export function depsFrom(c: DormContext): DormApiDeps {
  const deps = c.get(dormDeps)
  if (!deps) {
    throw new DormApiError(
      500,
      "DORM_DEPS_MISSING",
      "@iguide/dorm: dorm dependencies are missing; the host must set the dormDeps context key before routing /api/dorms",
    )
  }
  return deps
}

/** Resolve the caller, propagating the host's rejection Response as-is. */
export async function identityFrom(c: DormContext): Promise<DormIdentity> {
  const deps = depsFrom(c)
  const result = await deps.resolveIdentity(c.req.raw)
  if (!result.ok) {
    throw new DormApiError(result.response.status, "IDENTITY_REJECTED", undefined, {
      response: result.response,
    })
  }
  return result.identity
}

/** Return the caller id, or 401 when nobody signed in. */
export function requireUser(identity: DormIdentity): string {
  if (!identity.isAuthenticated) {
    throw new DormApiError(401, "UNAUTHENTICATED", "Sign in to continue")
  }
  return identity.userId
}

/** Return the caller id for an admin route: 401 signed out, 403 signed in but not admin. */
export function requireAdmin(identity: DormIdentity): string {
  const userId = requireUser(identity)
  if (!identity.isAdmin) {
    throw new DormApiError(403, "FORBIDDEN", "Admin privileges required")
  }
  return userId
}
