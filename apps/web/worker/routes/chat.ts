import { runStreamingAgentLoop } from "../agent/loop"
import { createSSEStream } from "../agent/stream"
import { json, resolveIdentity } from "../auth"
import { registerRuntimeMCPTools } from "../mcp/service"
import { createCustomSkillsTool } from "../tools/custom-skills"
import { createGrepDocsTool } from "../tools/grep-docs"
import { ToolRegistry } from "../tools/registry"
import { createSearchKnowledgeBaseTool } from "../tools/search-knowledge-base"
import { createWebSearchTool } from "../tools/web-search"
import type { Env, RouteHandler } from "../types"

interface ChatRequestBody {
  message?: string
  newMessage?: string
  history?: Array<{
    role?: string
    content?: string
  }>
  lang?: string
}

/** Headers for a streaming agent response. No CORS: the SPA is same-origin now. */
function streamHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  }
}

async function runAgentStream(options: {
  request: Request
  env: Env
  userId: string
  isAuthenticated: boolean
  region: string
  waitUntil: (promise: Promise<unknown>) => void
}): Promise<Response> {
  const body = (await options.request.json()) as ChatRequestBody
  const message =
    typeof body.message === "string"
      ? body.message
      : typeof body.newMessage === "string"
        ? body.newMessage
        : ""

  if (!message.trim()) {
    return json({ error: "Message is required" }, 400)
  }

  const history = Array.isArray(body.history)
    ? body.history.flatMap((entry) => {
        if (typeof entry?.role !== "string" || typeof entry?.content !== "string") {
          return []
        }
        return [{ role: entry.role, content: entry.content }]
      })
    : []

  const registry = new ToolRegistry()
  createSearchKnowledgeBaseTool(registry)
  createWebSearchTool(registry)
  createGrepDocsTool(registry)
  createCustomSkillsTool(registry)
  await registerRuntimeMCPTools({ registry, viewerId: options.userId, env: options.env })

  const { stream, writer } = createSSEStream()
  // The agent loop reads its provider settings off a flat string record.
  const loopEnv = options.env as unknown as Record<string, string>
  const runPromise = runStreamingAgentLoop({
    message,
    history,
    registry,
    env: loopEnv,
    userId: options.isAuthenticated ? options.userId : undefined,
    region: options.region,
    lang: body.lang,
    writer,
  }).catch((error) => {
    console.error("Streaming agent loop error:", error)
  })

  options.waitUntil(runPromise)

  return new Response(stream, { status: 200, headers: streamHeaders() })
}

/**
 * POST /api/chat. With `USE_TOOL_USE_RAG === "true"` the tool-use agent loop
 * answers as SSE; otherwise the request is proxied to the legacy backend so the
 * flag stays a live rollback switch.
 */
export const onRequestPost: RouteHandler = async (context) => {
  const { request, env, waitUntil } = context

  const identity = await resolveIdentity(request, env)
  if (!identity.ok) return identity.response

  // `cf` is a Workers-only field that the DOM lib types loosely, so narrow it.
  const cfCountry = request.cf?.country
  const country = typeof cfCountry === "string" ? cfCountry : "US"
  const region = country === "CN" ? "CN" : "Global"
  const { userId, isAuthenticated } = identity.identity

  if (env.USE_TOOL_USE_RAG === "true") {
    return runAgentStream({ request, env, userId, isAuthenticated, region, waitUntil })
  }

  if (!env.BACKEND_URL) {
    return json(
      {
        error: "Chat backend not configured",
        detail: "Set USE_TOOL_USE_RAG=true or provide BACKEND_URL",
      },
      503,
    )
  }

  const backendResponse = await fetch(env.BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Region": region,
      "X-User-Country": country,
      "X-User-ID": userId,
      "X-Authenticated": isAuthenticated.toString(),
    },
    body: await request.text(),
  })

  const contentType = backendResponse.headers.get("content-type") || ""
  if (contentType.includes("text/event-stream")) {
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: streamHeaders(),
    })
  }

  return new Response(await backendResponse.text(), {
    status: backendResponse.status,
    headers: { "Content-Type": "application/json" },
  })
}
