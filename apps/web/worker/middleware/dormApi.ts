import { asDormSupabase, dormDeps, type DormSupabase } from "@iguide/dorm"
import { createClient } from "@supabase/supabase-js"
import type { MiddlewareHandler } from "hono"

import type { AppEnv } from "../app"
import { resolveIdentity } from "../auth"
import type { Env } from "../types"

/**
 * supabase-js's per-request header escape hatch. It is not part of the narrow
 * `DormSupabase` type the package exports, so it is named here once.
 */
interface HeaderSetter {
  setHeader(name: string, value: string): unknown
}

interface MemoizedClient {
  url: string
  anonKey: string
  client: DormSupabase
}

/**
 * One client per credential pair, in module scope: `createClient` builds an
 * auth client, a storage client and a realtime client, and doing that per
 * request is avoidable work. The credentials come from the Worker env, so the
 * cache is keyed by them and rebuilt if they ever change.
 */
let memoized: MemoizedClient | null = null

function anonClient(env: Env): DormSupabase {
  if (memoized?.url !== env.SUPABASE_URL || memoized.anonKey !== env.SUPABASE_ANON_KEY) {
    memoized = {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      client: asDormSupabase(
        createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          // The Worker holds no session; the caller's token is forwarded per query.
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          // The client outlives the request that built it, so it must resolve the
          // ambient fetch when it calls rather than pinning whichever one existed
          // at construction time.
          global: { fetch: (input, init) => fetch(input, init) },
        }),
      ),
    }
  }
  return memoized.client
}

/**
 * The memoized anon client, scoped to this caller.
 *
 * supabase-js only fills in `Authorization` when a request does not already
 * carry one, and it copies a query's headers into every builder the query
 * chains, so the caller's bearer token is stamped once per query. That keeps
 * one client for the whole isolate while RLS still evaluates the real caller.
 * There is no service-role key in this Worker.
 *
 * `from()` returns a query builder that only grows into a request once
 * `select`/`insert`/`update`/`upsert`/`delete` is called, and those are exactly
 * the methods that expose supabase-js's per-request `setHeader`. Storage has
 * its own `setHeader` on the file client.
 */
function callerSupabase(env: Env, token: string | null): DormSupabase {
  const client = anonClient(env)
  if (!token) return client

  const authorization = `Bearer ${token}`
  return {
    from: (table) => ({
      select: (columns) => withBearerToken(client.from(table).select(columns), authorization),
      insert: (values) => withBearerToken(client.from(table).insert(values), authorization),
      update: (values) => withBearerToken(client.from(table).update(values), authorization),
      upsert: (values, options) =>
        withBearerToken(client.from(table).upsert(values, options), authorization),
      delete: () => withBearerToken(client.from(table).delete(), authorization),
    }),
    storage: {
      from: (bucket) => withBearerToken(client.storage.from(bucket), authorization),
    },
  }
}

function withBearerToken<T>(target: T, authorization: string): T {
  ;(target as unknown as HeaderSetter).setHeader("Authorization", authorization)
  return target
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization")
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null
}

/**
 * Lends `@iguide/dorm` its per-request dependencies through the package's
 * `dormDeps` context key: a Supabase client bound to the caller's token, and
 * the host's own identity resolver, whose 401/500 `Response` the dorm error
 * handler returns verbatim.
 *
 * Mounted on `/api/dorms` and `/api/dorms/*` before the sub-app, so a dorm path
 * never reaches the Worker's generic `/api/*` 404.
 */
export const lendDormDeps: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set(dormDeps, {
    supabase: callerSupabase(c.env, bearerToken(c.req.raw)),
    resolveIdentity: (request: Request) => resolveIdentity(request, c.env),
  })
  await next()
}
