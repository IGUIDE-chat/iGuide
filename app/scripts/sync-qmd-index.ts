/**
 * @file scripts/sync-qmd-index.ts
 * @description Syncs the generated QMD markdown corpus and local index.
 *
 * 1. Runs generate-qmd-markdown.ts to regenerate article, dorm, and handbook markdown
 * 2. Ensures QMD collections match the current corpus layout
 * 3. Calls `qmd update` to re-index changed files
 * 4. Calls `qmd embed` to update vector embeddings for new/changed docs
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/sync-qmd-index.ts
 */

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { generateQmdMarkdown } from "./generate-qmd-markdown.ts"

const __dirname = import.meta.dirname
const PROJECT_ROOT = path.resolve(__dirname, "..")
const QMD_CONTENT = path.resolve(PROJECT_ROOT, "../qmd-content")
const DEFAULT_GLOB = "**/*.md"
const NPM_BIN = process.platform === "win32" ? "npm.cmd" : "npm"
const QMD_HOME =
  process.env.HOME ||
  process.env.USERPROFILE ||
  (process.env.HOMEDRIVE && process.env.HOMEPATH
    ? `${process.env.HOMEDRIVE}${process.env.HOMEPATH}`
    : undefined)
const QMD_CACHE_HOME =
  process.env.XDG_CACHE_HOME ||
  (QMD_HOME ? path.join(QMD_HOME, ".cache") : undefined)

if (QMD_HOME && !process.env.HOME) {
  process.env.HOME = QMD_HOME
}

type CollectionSpec = {
  name: string
  path: string
}

const TARGET_COLLECTIONS: CollectionSpec[] = [
  {
    name: path.resolve(QMD_CONTENT, "articles"),
    path: path.resolve(QMD_CONTENT, "articles"),
  },
  {
    name: path.resolve(QMD_CONTENT, "dorms"),
    path: path.resolve(QMD_CONTENT, "dorms"),
  },
  {
    name: path.resolve(QMD_CONTENT, "handbook"),
    path: path.resolve(QMD_CONTENT, "handbook"),
  },
]

const STALE_COLLECTION_NAMES = [
  path.resolve(QMD_CONTENT, "articles-zh"),
  path.resolve(QMD_CONTENT, "dorms-zh"),
]

function normalizePath(value: string) {
  return path.resolve(value).replaceAll("\\", "/").toLowerCase()
}

function run(command: string, args: string[], cwd = PROJECT_ROOT) {
  const display = [command, ...args].join(" ")
  console.log(`\n$ ${display}`)
  execFileSync(command, args, {
    stdio: "inherit",
    cwd,
    env: {
      ...process.env,
      ...(QMD_HOME ? { HOME: QMD_HOME } : {}),
      ...(QMD_CACHE_HOME ? { XDG_CACHE_HOME: QMD_CACHE_HOME } : {}),
    },
  })
}

function runCapture(command: string, args: string[], cwd = PROJECT_ROOT) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...(QMD_HOME ? { HOME: QMD_HOME } : {}),
      ...(QMD_CACHE_HOME ? { XDG_CACHE_HOME: QMD_CACHE_HOME } : {}),
    },
  })
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
    const npmRootGlobal = runCapture(NPM_BIN, ["root", "-g"]).trim()
    if (npmRootGlobal) {
      candidates.add(
        path.join(npmRootGlobal, "@tobilu", "qmd", "dist", "cli", "qmd.js")
      )
    }
  } catch {
    // Keep the candidate list best-effort. We still have local and APPDATA fallbacks.
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(
    "Unable to locate @tobilu/qmd CLI entrypoint. Set QMD_CLI_PATH or install @tobilu/qmd so dist/cli/qmd.js is available."
  )
}

const QMD_CLI = resolveQmdCli()

function runQmd(args: string[], cwd = QMD_CONTENT) {
  run(process.execPath, [QMD_CLI, ...args], cwd)
}

function runQmdCapture(args: string[], cwd = QMD_CONTENT) {
  return runCapture(process.execPath, [QMD_CLI, ...args], cwd)
}

function getCollectionInfo(name: string) {
  try {
    const output = runQmdCapture(["collection", "show", name])
    const pathMatch = output.match(/^\s+Path:\s+(.+)$/m)
    const patternMatch = output.match(/^\s+Pattern:\s+(.+)$/m)

    return {
      exists: true,
      path: pathMatch?.[1]?.trim(),
      pattern: patternMatch?.[1]?.trim(),
    }
  } catch {
    return { exists: false }
  }
}

function ensureCollection(spec: CollectionSpec) {
  const info = getCollectionInfo(spec.name)
  const expectedPath = path.resolve(spec.path)

  if (!info.exists) {
    console.log(`Ensuring collection '${spec.name}'...`)
    runQmd([
      "collection",
      "add",
      expectedPath,
      "--name",
      spec.name,
      "--mask",
      DEFAULT_GLOB,
    ])
    return
  }

  const pathMismatch =
    !info.path || normalizePath(info.path) !== normalizePath(expectedPath)
  const patternMismatch = info.pattern !== DEFAULT_GLOB

  if (!pathMismatch && !patternMismatch) {
    return
  }

  console.log(`Resetting collection '${spec.name}' to match ${expectedPath}...`)
  runQmd(["collection", "remove", spec.name])
  runQmd([
    "collection",
    "add",
    expectedPath,
    "--name",
    spec.name,
    "--mask",
    DEFAULT_GLOB,
  ])
}

function removeStaleCollection(name: string) {
  const info = getCollectionInfo(name)
  if (!info.exists || !info.path) {
    return
  }

  if (!normalizePath(info.path).startsWith(normalizePath(QMD_CONTENT))) {
    return
  }

  console.log(`Removing stale collection '${name}'...`)
  runQmd(["collection", "remove", name])
}

async function main() {
  console.log("\nStep 1: Regenerate markdown corpus...")
  await generateQmdMarkdown()

  console.log("\nStep 2: Align QMD collections...")
  for (const staleName of STALE_COLLECTION_NAMES) {
    removeStaleCollection(staleName)
  }
  for (const spec of TARGET_COLLECTIONS) {
    ensureCollection(spec)
  }

  console.log("\nStep 3: Re-index changed files...")
  runQmd(["update"])

  console.log("\nStep 4: Update vector embeddings...")
  runQmd(["embed"])

  console.log("\nQMD index sync complete.")
}

try {
  await main()
} catch (err) {
  console.error("Sync failed:", err)
  process.exit(1)
}
