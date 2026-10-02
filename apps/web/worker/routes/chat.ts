import { runStreamingAgentLoop } from "../agent/loop"
import { createSSEStream } from "../agent/stream"
import { json, resolveIdentity } from "../auth"
import { registerRuntimeMCPTools } from "../mcp/service"
import { createCustomSkillsTool } from "../tools/custom-skills"
import { ToolRegistry } from "../tools/registry"
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
  createWebSearchTool(registry)
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
    lang: body.lang,
    writer,
  }).catch((error) => {
    console.error("Streaming agent loop error:", error)
  })

  options.waitUntil(runPromise)

  return new Response(stream, { status: 200, headers: streamHeaders() })
}

/**
 * POST /api/chat. The browser's only chat path: the tool-use agent loop
 * retrieves through the Worker's own tools and streams SSE.
 */
export const onRequestPost: RouteHandler = async (context) => {
  const { request, env, waitUntil } = context

  const identity = await resolveIdentity(request, env)
  if (!identity.ok) return identity.response
  const { userId, isAuthenticated } = identity.identity

  return runAgentStream({ request, env, userId, isAuthenticated, waitUntil })
}
