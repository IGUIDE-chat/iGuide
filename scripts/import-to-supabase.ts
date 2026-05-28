import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_EMBEDDING_MODEL = "multilingual-e5-small"
const DEFAULT_EMBEDDING_DIMENSIONS = 384
const EMBEDDING_BATCH_SIZE = 32
const DEFAULT_CHUNK_SIZE = 2000
const DEFAULT_CHUNK_OVERLAP = 200
const DEFAULT_SCHOOL_ID = "uiuc"
const PROGRESS_INTERVAL = 10

type SourceKind = "jsonl" | "markdown" | "directory"
type ImportSourceKind = "manual" | "imported_qmd"
type ArtifactType = "normalized_json" | "clean_markdown"

interface CliOptions {
  source: string
  dryRun: boolean
  limit?: number
}

interface RuntimeEnv {
  supabaseUrl?: string
  supabaseServiceKey?: string
  embeddingApiBaseUrl?: string
  embeddingApiKey?: string
  embeddingModel: string
  embeddingDimensions: number
  schoolId: string
}

interface ParsedMarkdown {
  frontmatter: Record<string, string>
  body: string
}

interface JsonlLineRecord {
  url: string
  title: string
  content: string
  category: string | null
  metadata: Record<string, unknown>
  raw: Record<string, unknown>
}

interface ImportUnit {
  filePath: string
  relativePath: string
  artifactType: ArtifactType
  contentText: string
  cleanedContent: string
  contentJson: Array<Record<string, unknown>> | null
  title: string
  canonicalUrl: string | null
  mimeType: string
  metadata: Record<string, unknown>
  rawContentHash: string
  chunks: string[]
}

interface ImportPlan {
  sourcePath: string
  sourceKey: string
  sourceName: string
  sourceKind: ImportSourceKind
  units: ImportUnit[]
  snapshotContentHash: string
  snapshotMetadata: Record<string, unknown>
}

interface ImportStats {
  total_files: number
  processed: number
  total_chunks: number
  skipped: number
  failed: number
  dry_run: boolean
}

interface SourceRecord {
  id: string
  source_key: string
}

interface SourceSnapshotRecord {
  id: string
}

interface ArtifactRecord {
  id: string
}

interface SourcePayload {
  school_id: string
  source_key: string
  name: string
  source_kind: ImportSourceKind
  is_active: boolean
  metadata: Record<string, unknown>
}

interface SourceSnapshotPayload {
  source_id: string
  snapshot_key: string
  capture_mode: "manual_import"
  capture_status: "success"
  captured_at: string
  is_current: boolean
  content_hash: string
  raw_metadata: Record<string, unknown>
}

interface ArtifactPayload {
  source_snapshot_id: string
  artifact_type: ArtifactType
  artifact_role: "primary"
  mime_type: string
  language: "en"
  title: string
  content_text: string
  content_json: Array<Record<string, unknown>> | null
  canonical_url: string | null
  is_searchable: boolean
  is_primary: boolean
  metadata: Record<string, unknown>
  parser_name: string
  parser_version: string
  normalization_status: string
}

interface ChunkPayload {
  artifact_id: string
  chunk_index: number
  chunk_text: string
  search_text: string
  token_count: number
  embedding: number[] | null
  is_active: boolean
  embedding_model: string
  metadata: Record<string, unknown>
  chunk_hash: string
  language: "en"
}

export function parseArgs(argv: string[]): CliOptions {
  let source = ""
  let dryRun = false
  let limit: number | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--source") {
      source = argv[index + 1] ?? ""
      index += 1
      continue
    }

    if (arg === "--dry-run") {
      dryRun = true
      continue
    }

    if (arg === "--limit") {
      const rawLimit = argv[index + 1] ?? ""
      const parsed = Number.parseInt(rawLimit, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("--limit must be a positive integer")
      }
      limit = parsed
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!source) {
    throw new Error("Missing required --source <path> argument")
  }

  return { source, dryRun, limit }
}

export function cleanText(input: string): string {
  return decodeHtmlEntities(input)
    .replaceAll(/<script[\s\S]*?<\/script>/gi, " ")
    .replaceAll(/<style[\s\S]*?<\/style>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll("\r\n", "\n")
    .replaceAll(/\s+/g, " ")
    .trim()
}

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
): string[] {
  if (!text) {
    return []
  }

  if (text.length <= chunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk) {
      chunks.push(chunk)
    }
    if (end >= text.length) {
      break
    }
    start = Math.max(0, end - overlap)
  }

  return chunks
}

export function detectSourceKind(
  sourcePath: string,
  isDirectory: boolean
): SourceKind {
  if (isDirectory) {
    return "directory"
  }

  if (sourcePath.endsWith(".jsonl")) {
    return "jsonl"
  }

  if (
    sourcePath.endsWith(".md") ||
    sourcePath.endsWith(".markdown") ||
    sourcePath.endsWith(".qmd")
  ) {
    return "markdown"
  }

  throw new Error(`Unsupported source path: ${sourcePath}`)
}

function decodeHtmlEntities(input: string): string {
  const entityMap: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  }

  return input.replaceAll(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => {
    return entityMap[match] ?? match
  })
}

function getEnv(): RuntimeEnv {
  const embeddingDimensions = Number.parseInt(
    process.env.EMBEDDING_DIMENSIONS || String(DEFAULT_EMBEDDING_DIMENSIONS),
    10
  )

  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    embeddingApiBaseUrl: process.env.EMBEDDING_API_BASE_URL,
    embeddingApiKey: process.env.EMBEDDING_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    embeddingDimensions:
      Number.isFinite(embeddingDimensions) && embeddingDimensions > 0
        ? embeddingDimensions
        : DEFAULT_EMBEDDING_DIMENSIONS,
    schoolId: process.env.SCHOOL_ID || DEFAULT_SCHOOL_ID,
  }
}

async function main() {
  const argv = process.argv.slice(2)
  if (isHelpArg(argv)) {
    printHelp()
    return
  }

  const options = parseArgs(argv)
  const env = getEnv()
  const importPlan = await loadImportPlan(options.source, options.limit)

  if (!options.dryRun) {
    requireEnv(env)
  }

  const stats: ImportStats = {
    total_files: importPlan.units.length,
    processed: 0,
    total_chunks: 0,
    skipped: 0,
    failed: 0,
    dry_run: options.dryRun,
  }

  const sourcePayload = buildSourcePayload(importPlan, env.schoolId)
  const snapshotKey = `${importPlan.sourceKey}-${Date.now()}`
  const snapshotMetadata = {
    ...importPlan.snapshotMetadata,
    imported_via: "scripts/import-to-supabase.ts",
  }

  if (options.dryRun) {
    const dryRunSnapshotId = `dry-run-snapshot:${snapshotKey}`
    for (const [index, unit] of importPlan.units.entries()) {
      logDryRunChain(sourcePayload, dryRunSnapshotId, unit)
      stats.processed += 1
      stats.total_chunks += unit.chunks.length
      logProgress(index + 1, stats)
    }

    console.log(JSON.stringify(stats, null, 2))
    return
  }

  const supabaseClient = new SupabaseRestClient(env)
  const embeddingClient = new EmbeddingApiClient(env)

  const source = await supabaseClient.upsertSource(sourcePayload)
  await supabaseClient.markSnapshotsNotCurrent(source.id)
  const snapshot = await supabaseClient.insertSourceSnapshot({
    source_id: source.id,
    snapshot_key: snapshotKey,
    capture_mode: "manual_import",
    capture_status: "success",
    captured_at: new Date().toISOString(),
    is_current: true,
    content_hash: importPlan.snapshotContentHash,
    raw_metadata: snapshotMetadata,
  })

  await Promise.all(
    importPlan.units.map(async (unit, index) => {
      try {
        if (unit.chunks.length === 0) {
          stats.skipped += 1
          console.warn(
            JSON.stringify({
              event: "skip_file",
              file: unit.relativePath,
              reason: "No importable chunks produced",
            })
          )
          return
        }

        const chunkEmbeddings = await embeddingClient.embedDocuments(unit.chunks)
        const artifact = await supabaseClient.insertArtifact({
          source_snapshot_id: snapshot.id,
          artifact_type: unit.artifactType,
          artifact_role: "primary",
          mime_type: unit.mimeType,
          language: "en",
          title: unit.title,
          content_text: unit.contentText,
          content_json: unit.contentJson,
          canonical_url: unit.canonicalUrl,
          is_searchable: true,
          is_primary: true,
          metadata: unit.metadata,
          parser_name: "manual_import_pipeline",
          parser_version: "a1",
          normalization_status: "success",
        })

        const chunkPayloads: ChunkPayload[] = unit.chunks.map(
          (chunk, chunkIndex) => ({
            artifact_id: artifact.id,
            chunk_index: chunkIndex,
            chunk_text: chunk,
            search_text: chunk,
            token_count: approximateTokenCount(chunk),
            embedding: chunkEmbeddings[chunkIndex] ?? null,
            is_active: true,
            embedding_model: env.embeddingModel,
            metadata: {
              source_path: unit.relativePath,
              artifact_type: unit.artifactType,
            },
            chunk_hash: hashContent(
              `${unit.relativePath}:${chunkIndex}:${chunk}`
            ),
            language: "en",
          })
        )

        await supabaseClient.insertChunks(chunkPayloads)
        stats.processed += 1
        stats.total_chunks += unit.chunks.length
      } catch (error) {
        stats.failed += 1
        console.error(
          JSON.stringify({
            event: "file_import_failed",
            file: unit.relativePath,
            error: error instanceof Error ? error.message : String(error),
          })
        )
      }

      logProgress(index + 1, stats)
    })
  )

  console.log(JSON.stringify(stats, null, 2))
}

function isHelpArg(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h")
}

function printHelp() {
  console.log(`Usage: npx tsx scripts/import-to-supabase.ts --source <path> [options]

Options:
  --source <path>   Source file or directory to import
  --dry-run         Print the A1 import chain without writing to Supabase
  --limit <n>       Limit the number of files processed
  --help, -h        Show this help message`)
}

function requireEnv(env: RuntimeEnv) {
  const missing = [
    ["SUPABASE_URL", env.supabaseUrl],
    ["SUPABASE_SERVICE_KEY", env.supabaseServiceKey],
    ["EMBEDDING_API_BASE_URL", env.embeddingApiBaseUrl],
    ["EMBEDDING_API_KEY", env.embeddingApiKey],
  ]
    .filter((entry) => !entry[1])
    .map((entry) => entry[0])

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`)
  }
}

function buildSourcePayload(
  importPlan: ImportPlan,
  schoolId: string
): SourcePayload {
  return {
    school_id: schoolId,
    source_key: importPlan.sourceKey,
    name: importPlan.sourceName,
    source_kind: importPlan.sourceKind,
    is_active: true,
    metadata: {
      import_source: importPlan.sourcePath,
      file_count: importPlan.units.length,
      source_kind: importPlan.sourceKind,
    },
  }
}

function logDryRunChain(
  sourcePayload: SourcePayload,
  snapshotId: string,
  unit: ImportUnit
) {
  console.log(
    JSON.stringify({
      event: "dry_run_chain",
      source_key: sourcePayload.source_key,
      source_kind: sourcePayload.source_kind,
      snapshot_id: snapshotId,
      artifact_type: unit.artifactType,
      file: unit.relativePath,
      chunk_count: unit.chunks.length,
    })
  )
}

function logProgress(processedCount: number, stats: ImportStats) {
  if (
    processedCount % PROGRESS_INTERVAL !== 0 &&
    processedCount !== stats.total_files
  ) {
    return
  }

  console.log(
    JSON.stringify({
      progress_files: processedCount,
      processed: stats.processed,
      failed: stats.failed,
      skipped: stats.skipped,
      total_chunks: stats.total_chunks,
      dry_run: stats.dry_run,
    })
  )
}

async function loadImportPlan(
  source: string,
  limit?: number
): Promise<ImportPlan> {
  const absoluteSource = path.resolve(source)
  const stats = await fs.stat(absoluteSource)
  const detectedKind = detectSourceKind(absoluteSource, stats.isDirectory())
  const files = await resolveInputFiles(absoluteSource, detectedKind, limit)

  if (files.length === 0) {
    throw new Error(`No supported source files found in ${absoluteSource}`)
  }

  const units = await Promise.all(
    files.map((filePath) => loadImportUnit(absoluteSource, filePath))
  )
  const sourceKind = deriveImportSourceKind(units)
  const sourceName = deriveNameFromReference(absoluteSource)
  const sourceKey = deriveSourceKey(absoluteSource)

  return {
    sourcePath: absoluteSource,
    sourceKey,
    sourceName,
    sourceKind,
    units,
    snapshotContentHash: hashContent(
      JSON.stringify(
        units.map((unit) => ({
          file: unit.relativePath,
          hash: unit.rawContentHash,
          chunk_count: unit.chunks.length,
        }))
      )
    ),
    snapshotMetadata: {
      source_path: absoluteSource,
      file_count: units.length,
      input_kind: detectedKind,
      files: units.map((unit) => unit.relativePath),
    },
  }
}

async function resolveInputFiles(
  absoluteSource: string,
  sourceKind: SourceKind,
  limit?: number
): Promise<string[]> {
  if (sourceKind !== "directory") {
    return [absoluteSource]
  }

  const files = await walkDirectory(absoluteSource)
  const supportedFiles = files
    .filter((filePath) => isSupportedFile(filePath))
    .toSorted((left, right) => left.localeCompare(right))

  return typeof limit === "number"
    ? supportedFiles.slice(0, limit)
    : supportedFiles
}

function isSupportedFile(filePath: string): boolean {
  return (
    filePath.endsWith(".jsonl") ||
    filePath.endsWith(".md") ||
    filePath.endsWith(".markdown") ||
    filePath.endsWith(".qmd")
  )
}

async function walkDirectory(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const filePaths = await Promise.all(
    entries.map(async (entry) => {
      const resolvedPath = path.join(directoryPath, entry.name)
      if (entry.isDirectory()) {
        return walkDirectory(resolvedPath)
      }
      return [resolvedPath]
    })
  )

  return filePaths.flat()
}

async function loadImportUnit(
  rootSource: string,
  filePath: string
): Promise<ImportUnit> {
  const stats = await fs.stat(filePath)
  const kind = detectSourceKind(filePath, stats.isDirectory())
  if (kind === "directory") {
    throw new Error(
      `Directory imports must be expanded before loading units: ${filePath}`
    )
  }

  if (kind === "jsonl") {
    return loadJsonlUnit(rootSource, filePath)
  }

  return loadMarkdownUnit(rootSource, filePath)
}

async function loadJsonlUnit(
  rootSource: string,
  filePath: string
): Promise<ImportUnit> {
  const rawContents = await fs.readFile(filePath, "utf8")
  const records = parseJsonlRecords(rawContents, filePath)
  const contentText = buildJsonlArtifactText(records)
  const cleanedContent = cleanText(contentText)
  const chunks = chunkText(cleanedContent)
  const title = records[0]?.title || deriveNameFromReference(filePath)
  const canonicalUrl = records[0]?.url || null

  return {
    filePath,
    relativePath:
      path.relative(rootSource, filePath) || path.basename(filePath),
    artifactType: "normalized_json",
    contentText,
    cleanedContent,
    contentJson: records.map((record) => record.raw),
    title,
    canonicalUrl,
    mimeType: "application/x-ndjson",
    metadata: {
      source_type: "jsonl",
      record_count: records.length,
      file_path: filePath,
    },
    rawContentHash: hashContent(rawContents),
    chunks,
  }
}

async function loadMarkdownUnit(
  rootSource: string,
  filePath: string
): Promise<ImportUnit> {
  const rawContents = await fs.readFile(filePath, "utf8")
  const parsed = parseMarkdown(rawContents)
  const normalizedBody = normalizeMultilineText(parsed.body)
  const cleanedContent = cleanText(normalizedBody)
  const chunks = chunkText(cleanedContent)
  const title =
    parsed.frontmatter.title ||
    findMarkdownHeading(parsed.body) ||
    deriveNameFromReference(filePath)
  const canonicalUrl = parsed.frontmatter.url || null

  return {
    filePath,
    relativePath:
      path.relative(rootSource, filePath) || path.basename(filePath),
    artifactType: "clean_markdown",
    contentText: normalizedBody,
    cleanedContent,
    contentJson: null,
    title,
    canonicalUrl,
    mimeType: "text/markdown",
    metadata: {
      source_type: filePath.endsWith(".qmd") ? "qmd" : "markdown",
      ...parsed.frontmatter,
      file_path: filePath,
    },
    rawContentHash: hashContent(rawContents),
    chunks,
  }
}

function deriveImportSourceKind(units: ImportUnit[]): ImportSourceKind {
  const kinds = new Set(
    units.map((unit) =>
      unit.artifactType === "normalized_json" ? "manual" : "imported_qmd"
    )
  )

  if (kinds.size > 1) {
    throw new Error(
      "Mixed markdown/qmd and jsonl imports in a single source path are not supported"
    )
  }

  return (Array.from(kinds)[0] ?? "imported_qmd") as ImportSourceKind
}

function parseJsonlRecords(
  contents: string,
  filePath: string
): JsonlLineRecord[] {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error(`No JSONL records found in ${filePath}`)
  }

  return lines.map((line, index) => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(line) as Record<string, unknown>
    } catch (error) {
      throw new Error(
        `Invalid JSONL at ${filePath}:${index + 1}: ${String(error)}`,
        { cause: error }
      )
    }

    return {
      url: asString(parsed.url),
      title: asString(parsed.title),
      content: asString(parsed.content),
      category: nullableString(parsed.category),
      metadata: {
        links: Array.isArray(parsed.links) ? parsed.links : [],
        timestamp: parsed.timestamp ?? null,
      },
      raw: parsed,
    }
  })
}

function buildJsonlArtifactText(records: JsonlLineRecord[]): string {
  return normalizeMultilineText(
    records
      .map((record, index) => {
        const lines = [
          `Record ${index + 1}`,
          record.title ? `Title: ${record.title}` : null,
          record.url ? `URL: ${record.url}` : null,
          record.category ? `Category: ${record.category}` : null,
          record.content ? `Content: ${record.content}` : null,
        ]
          .filter(Boolean)
          .join("\n")

        return lines
      })
      .join("\n\n")
  )
}

function parseMarkdown(contents: string): ParsedMarkdown {
  if (!contents.startsWith("---\n")) {
    return { frontmatter: {}, body: contents }
  }

  const closingIndex = contents.indexOf("\n---\n", 4)
  if (closingIndex === -1) {
    return { frontmatter: {}, body: contents }
  }

  const frontmatterBlock = contents.slice(4, closingIndex)
  const body = contents.slice(closingIndex + 5)
  const frontmatter: Record<string, string> = {}

  for (const line of frontmatterBlock.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    frontmatter[key] = unquoteYamlValue(rawValue)
  }

  return { frontmatter, body }
}

function unquoteYamlValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function findMarkdownHeading(contents: string): string | null {
  const match = contents.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() || null
}

function normalizeMultilineText(input: string): string {
  return decodeHtmlEntities(input).replaceAll("\r\n", "\n").trim()
}

function deriveNameFromReference(reference: string): string {
  const sanitizedReference = reference.replace(/[?#].*$/, "")
  const parsedPath = sanitizedReference.endsWith(path.sep)
    ? sanitizedReference.slice(0, -1)
    : sanitizedReference
  return path.basename(parsedPath, path.extname(parsedPath)) || "import-source"
}

function deriveSourceKey(reference: string): string {
  const name = deriveNameFromReference(reference)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")

  return name || "import-source"
}

function approximateTokenCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function hashContent(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

export class EmbeddingApiClient {
  constructor(private readonly env: RuntimeEnv) {}

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batches: Array<{ texts: string[] }> = []

    for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(index, index + EMBEDDING_BATCH_SIZE)
      if (batch.length === 0) {
        continue
      }
      batches.push({ texts: batch })
    }

    const batchResults = await Promise.all(
      batches.map(async ({ texts: batch }) => {
        const response = await fetch(
          `${this.env.embeddingApiBaseUrl?.replace(/\/+$/, "")}/v1/embeddings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.env.embeddingApiKey}`,
            },
            body: JSON.stringify({
              model: this.env.embeddingModel,
              input: batch.map((text) => `passage: ${text}`),
            }),
          }
        )

        if (!response.ok) {
          throw new Error(
            `Embedding API returned ${response.status}: ${await response.text()}`
          )
        }

        const payload = (await response.json()) as {
          data?: Array<{ embedding?: number[] }>
        }

        const embeddings = (payload.data || []).map(
          (item) => item.embedding || []
        )
        if (embeddings.length !== batch.length) {
          throw new Error(
            `Embedding API returned ${embeddings.length} embeddings for ${batch.length} inputs`
          )
        }

        for (const embedding of embeddings) {
          if (embedding.length !== this.env.embeddingDimensions) {
            throw new Error(
              `Embedding dimensions mismatch: expected ${this.env.embeddingDimensions}, received ${embedding.length}`
            )
          }
        }

        return embeddings
      })
    )

    return batchResults.flat()
  }
}

export class SupabaseRestClient {
  constructor(private readonly env: RuntimeEnv) {}

  async upsertSource(payload: SourcePayload): Promise<SourceRecord> {
    const response = await this.request(
      "/sources?on_conflict=source_key&select=id,source_key",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      }
    )
    const rows = (await response.json()) as SourceRecord[]
    if (!rows[0]) {
      throw new Error("Supabase did not return source row")
    }
    return rows[0]
  }

  async markSnapshotsNotCurrent(sourceId: string): Promise<void> {
    await this.request(
      `/source_snapshots?source_id=eq.${sourceId}&is_current=eq.true`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_current: false }),
      }
    )
  }

  async insertSourceSnapshot(
    payload: SourceSnapshotPayload
  ): Promise<SourceSnapshotRecord> {
    const response = await this.request("/source_snapshots?select=id", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    })
    const rows = (await response.json()) as SourceSnapshotRecord[]
    if (!rows[0]) {
      throw new Error("Supabase did not return source snapshot row")
    }
    return rows[0]
  }

  async insertArtifact(payload: ArtifactPayload): Promise<ArtifactRecord> {
    const response = await this.request("/artifacts?select=id", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    })
    const rows = (await response.json()) as ArtifactRecord[]
    if (!rows[0]) {
      throw new Error("Supabase did not return artifact row")
    }
    return rows[0]
  }

  async insertChunks(payload: ChunkPayload[]): Promise<void> {
    if (payload.length === 0) {
      return
    }

    await this.request("/chunks", {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    })
  }

  private async request(
    relativePath: string,
    init?: RequestInit
  ): Promise<Response> {
    const response = await fetch(
      `${this.env.supabaseUrl?.replace(/\/+$/, "")}/rest/v1${relativePath}`,
      {
        ...init,
        headers: {
          apikey: this.env.supabaseServiceKey || "",
          Authorization: `Bearer ${this.env.supabaseServiceKey || ""}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Supabase request failed (${response.status}) ${relativePath}: ${await response.text()}`
      )
    }

    return response
  }
}

function isExecutedDirectly() {
  const entryPath = process.argv[1]
  if (!entryPath) {
    return false
  }

  return path.resolve(entryPath) === path.resolve(import.meta.filename)
}

if (isExecutedDirectly()) {
  try {
    await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
