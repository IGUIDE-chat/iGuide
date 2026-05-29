import { execFile, execFileSync } from "node:child_process"
import fs from "node:fs"
import { type IncomingMessage, type ServerResponse } from "node:http"
import path from "node:path"
import { promisify } from "node:util"

import { type Plugin } from "vite-plus"

type SearchMode = "bm25" | "vector" | "hybrid"

type SearchRequest = {
  query?: unknown
  lang?: unknown
  limit?: unknown
  mode?: unknown
}

type QmdSearchResult = {
  docid: string
  score: number
  file: string
  title: string
  snippet: string
  metadata?: Record<string, unknown>
}

const execFileAsync = promisify(execFile)
const __dirname = import.meta.dirname
const PROJECT_ROOT = path.resolve(__dirname, "..")
const QMD_CONTENT = path.resolve(PROJECT_ROOT, "../qmd-content")
const NPM_BIN = process.platform === "win32" ? "npm.cmd" : "npm"
const QMD_HOME =
  process.env.HOME ??
  process.env.USERPROFILE ??
  (process.env.HOMEDRIVE && process.env.HOMEPATH
    ? `${process.env.HOMEDRIVE}${process.env.HOMEPATH}`
    : undefined)
const QMD_CACHE_HOME =
  process.env.XDG_CACHE_HOME ??
  (QMD_HOME ? path.join(QMD_HOME, ".cache") : undefined)

if (QMD_HOME && !process.env.HOME) {
  process.env.HOME = QMD_HOME
}

function getExecEnv() {
  return {
    ...process.env,
    ...(QMD_HOME ? { HOME: QMD_HOME } : {}),
    ...(QMD_CACHE_HOME ? { XDG_CACHE_HOME: QMD_CACHE_HOME } : {}),
  }
}

function resolveQmdCli() {
  const candidates = new Set<string>()

  if (process.env.QMD_CLI_PATH) {
    candidates.add(path.resolve(process.env.QMD_CLI_PATH))
  }

  candidates.add(
    path.resolve(PROJECT_ROOT, "node_modules/@tobilu/qmd/dist/cli/qmd.js")
  )

  if (process.env.APPDATA) {
    candidates.add(
      path.join(
        process.env.APPDATA,
        "npm",
        "node_modules",
        "@tobilu",
        "qmd",
        "dist",
        "cli",
        "qmd.js"
      )
    )
  }

  try {
    const npmRootGlobal = execFileSync(NPM_BIN, ["root", "-g"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: getExecEnv(),
    }).trim()

    if (npmRootGlobal) {
      candidates.add(
        path.join(npmRootGlobal, "@tobilu", "qmd", "dist", "cli", "qmd.js")
      )
    }
  } catch {
    // Best-effort only. APPDATA and local node_modules are checked first.
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(
    "Unable to locate @tobilu/qmd CLI entrypoint. Install @tobilu/qmd or set QMD_CLI_PATH."
  )
}

let QMD_CLI: string | null = null
try {
  QMD_CLI = resolveQmdCli()
} catch {
  // QMD CLI not available (e.g. CI/CD build environment) — plugin will be a no-op
}

function normalizeMode(mode: unknown): SearchMode {
  if (mode === "bm25" || mode === "vector" || mode === "hybrid") {
    return mode
  }
  return "hybrid"
}

function normalizeLang(lang: unknown): "en" | "zh" {
  return lang === "zh" ? "zh" : "en"
}

function normalizeLimit(limit: unknown) {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed)) {
    return 10
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 20)
}

function commandForMode(mode: SearchMode) {
  switch (mode) {
    case "bm25":
      return "search"
    case "vector":
      return "vsearch"
    default:
      return "query"
  }
}

function matchesLang(filePath: string, lang: "en" | "zh") {
  const normalized = filePath.replaceAll("\\", "/").toLowerCase()

  if (normalized.includes("/articles/")) {
    return normalized.includes(`/articles/${lang}/`)
  }

  if (normalized.includes("/dorms/")) {
    return normalized.includes(`/dorms/${lang}/`)
  }

  if (normalized.includes("/handbook/")) {
    return lang === "zh" && normalized.includes("/handbook/zh/")
  }

  return true
}

async function queryQmd(body: SearchRequest): Promise<QmdSearchResult[]> {
  if (!QMD_CLI) {
    throw new Error("QMD CLI is not available in this environment.")
  }
  const query = typeof body.query === "string" ? body.query.trim() : ""
  if (!query) {
    throw new Error("Missing search query.")
  }

  const lang = normalizeLang(body.lang)
  const mode = normalizeMode(body.mode)
  const limit = normalizeLimit(body.limit)
  const candidateLimit = Math.max(limit * 3, limit)
  const command = commandForMode(mode)

  const { stdout } = await execFileAsync(
    process.execPath,
    [QMD_CLI, command, query, "--json", "-n", String(candidateLimit)],
    {
      cwd: QMD_CONTENT,
      encoding: "utf8",
      env: getExecEnv(),
      timeout: mode === "hybrid" ? 120_000 : 30_000,
      maxBuffer: 4 * 1024 * 1024,
    }
  )

  const parsed = JSON.parse(stdout.trim()) as QmdSearchResult[]
  return parsed.filter((item) => matchesLang(item.file, lang)).slice(0, limit)
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
    req.on("error", reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("X-QMD-Region", "local")
  res.end(JSON.stringify(payload))
}

async function handleQmdSearch(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." })
    return
  }

  try {
    const rawBody = await readBody(req)
    const body = rawBody ? (JSON.parse(rawBody) as SearchRequest) : {}
    const results = await queryQmd(body)
    sendJson(res, 200, results)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected search error."
    sendJson(res, 500, { error: message })
  }
}

function attachMiddleware(middlewares: {
  use: (
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void
    ) => void | Promise<void>
  ) => void
}) {
  middlewares.use(async (req, res, next) => {
    const url = req.url ? new URL(req.url, "http://localhost") : null
    if (!url || url.pathname !== "/api/search") {
      next()
      return
    }

    await handleQmdSearch(req, res)
  })
}

export function qmdSearchPlugin(): Plugin {
  return {
    name: "qmd-search-gateway",
    configureServer(server) {
      attachMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares)
    },
  }
}
