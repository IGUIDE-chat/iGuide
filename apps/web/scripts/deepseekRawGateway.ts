import { mkdir, writeFile } from "node:fs/promises"
import type { ClientRequest, IncomingMessage, OutgoingHttpHeaders } from "node:http"
import https from "node:https"
import path from "node:path"

import type { Plugin } from "vite"

type DevEnv = Record<string, string>

interface LlmRequestDumpInput {
  env: DevEnv
  provider: string
  localPath?: string
  upstreamUrl: string
  proxyReq: ClientRequest
  body: string
}

const UPSTREAM_URL = "https://api.deepseek.com/chat/completions"
const TRUTHY_ENV_VALUES = new Set(["1", "true", "yes", "on"])
const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "proxy-authorization", "x-api-key"])
const SENSITIVE_QUERY_KEYS = new Set(["access_token", "api_key", "key", "token"])
/** Connection-scoped headers must not be copied from the upstream response. */
const HOP_BY_HOP_HEADERS = new Set(["connection", "keep-alive", "transfer-encoding"])

let llmDumpCounter = 0

function isTruthyEnv(value: string | undefined) {
  return TRUTHY_ENV_VALUES.has((value || "").trim().toLowerCase())
}

function redactHeaders(headers: OutgoingHttpHeaders, includeSecrets: boolean) {
  if (includeSecrets) return headers

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value,
    ]),
  )
}

function redactUrl(rawUrl: string, includeSecrets: boolean) {
  if (includeSecrets) return rawUrl

  try {
    const url = new URL(rawUrl)
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, "[REDACTED]")
      }
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

function parseJsonBody(body: string) {
  if (!body.trim()) return null

  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}

async function dumpLlmRequest({
  env,
  provider,
  localPath,
  upstreamUrl,
  proxyReq,
  body,
}: LlmRequestDumpInput) {
  if (!isTruthyEnv(env.LLM_REQUEST_DUMP)) return

  const includeSecrets = isTruthyEnv(env.LLM_REQUEST_DUMP_INCLUDE_SECRETS)
  const timestamp = new Date().toISOString()
  const requestId = `${timestamp.replace(/[:.]/g, "-")}-${String(++llmDumpCounter).padStart(4, "0")}`
  const dumpDir = path.resolve(env.LLM_REQUEST_DUMP_DIR || ".debug/llm-requests")
  const filePath = path.join(dumpDir, `${requestId}-${provider}.json`)
  const bodyJson = parseJsonBody(body)

  try {
    await mkdir(dumpDir, { recursive: true })
    await writeFile(
      filePath,
      JSON.stringify(
        {
          requestId,
          timestamp,
          provider,
          localPath,
          method: proxyReq.method,
          upstreamUrl: redactUrl(upstreamUrl, includeSecrets),
          includeSecrets,
          headers: redactHeaders(proxyReq.getHeaders(), includeSecrets),
          bodyText: body,
          bodyJson,
        },
        null,
        2,
      ),
      "utf8",
    )

    console.log(`[LLM dump] ${provider} request written to ${filePath}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[LLM dump] Failed to write ${provider} request: ${message}`)
  }
}

function collectRequestBody(req: IncomingMessage, onEnd: (body: string) => void) {
  const chunks: Buffer[] = []
  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk)
  })
  req.on("end", () => {
    onEnd(Buffer.concat(chunks).toString("utf8"))
  })
}

/**
 * `/api/deepseek-raw` is the browser-RAG path's passthrough: the client owns
 * prompt assembly and sends `model`/`messages`/`stream`/`temperature`, which the
 * `/api/deepseek` Worker route overrides with its own defaults. The Worker has no
 * such route, so dev proxies it here and injects the key server-side.
 *
 * It is mounted as `configureServer` middleware rather than kept in
 * `server.proxy` because Vite installs the proxy table *after* every
 * `configureServer` hook, which would leave it behind the Cloudflare plugin's
 * interception of all of `/api/*`.
 */
export function deepseekRawProxyPlugin(env: DevEnv): Plugin {
  return {
    name: "deepseek-raw-proxy",
    configureServer(server) {
      server.middlewares.use("/api/deepseek-raw", (req, res, next) => {
        if (req.method !== "POST") {
          next()
          return
        }

        const apiKey = env.DEEPSEEK_API_KEY
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: "Missing DEEPSEEK_API_KEY in .env.local" }))
          return
        }

        const upstream = https.request(
          UPSTREAM_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": req.headers["content-type"] || "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          },
          (upstreamRes) => {
            const headers: OutgoingHttpHeaders = {}
            for (const [name, value] of Object.entries(upstreamRes.headers)) {
              if (!HOP_BY_HOP_HEADERS.has(name)) headers[name] = value
            }
            res.writeHead(upstreamRes.statusCode || 502, headers)
            upstreamRes.pipe(res)
          },
        )

        upstream.on("error", (error: Error) => {
          res.statusCode = 502
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({ error: `DeepSeek proxy failed: ${error.message}` }))
        })

        collectRequestBody(req, (body) => {
          void dumpLlmRequest({
            env,
            provider: "deepseek",
            localPath: "/api/deepseek-raw",
            upstreamUrl: UPSTREAM_URL,
            proxyReq: upstream,
            body,
          })
          upstream.end(body)
        })
      })
    },
  }
}
