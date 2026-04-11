#!/usr/bin/env node
/**
 * QMD Search HTTP Server — deploy on any VPS with @tobilu/qmd + qmd-content.
 *
 * Features:
 *   - BM25 search via qmd CLI
 *   - In-process vector search via multilingual-e5-small (loaded once, ~200MB)
 *   - Fusion mode: BM25 + vector → RRF merge
 *   - Concurrency control (semaphore + request queue)
 *   - LRU response cache with TTL
 *   - Health endpoint with metrics
 *
 * Usage:
 *   QMD_CONTENT=/path/to/qmd-content QMD_PORT=3001 QMD_REGION=cn QMD_API_KEY=secret node qmd-server.mjs
 *
 * Endpoints:
 *   POST /api/search       — { query, lang, limit, mode }
 *   GET  /health           — { status, region, metrics }
 *   POST /api/cache/clear  — clear search cache (requires API key)
 *   POST /api/embeddings/rebuild — rebuild document embeddings (requires API key)
 */

import { execFile } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import { join, resolve, relative } from "node:path";
import { promisify } from "node:util";
import { freemem, totalmem } from "node:os";

const execFileAsync = promisify(execFile);

// ── Config ──────────────────────────────────────────────────────
const PORT = Number(process.env.QMD_PORT) || 3001;
const API_KEY = process.env.QMD_API_KEY || "";
const QMD_CONTENT = resolve(process.env.QMD_CONTENT || "./qmd-content");
const REGION = process.env.QMD_REGION || "unknown";
const EMBEDDINGS_PATH = join(QMD_CONTENT, "embeddings.json");
const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "Xenova/multilingual-e5-small";

// ── Concurrency Control ─────────────────────────────────────────
const MAX_CONCURRENT = Number(process.env.QMD_MAX_CONCURRENT) || 3;
const MAX_QUEUE = 50;
const QUEUE_TIMEOUT_MS = 10_000;

let running = 0;
const queue = [];

function acquireSlot() {
  if (running < MAX_CONCURRENT) {
    running++;
    return Promise.resolve();
  }
  if (queue.length >= MAX_QUEUE) {
    return Promise.reject(new Error("queue_full"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = queue.findIndex((e) => e.resolve === resolve);
      if (idx !== -1) queue.splice(idx, 1);
      reject(new Error("queue_timeout"));
    }, QUEUE_TIMEOUT_MS);
    queue.push({ resolve, timer });
  });
}

function releaseSlot() {
  if (queue.length > 0) {
    const next = queue.shift();
    clearTimeout(next.timer);
    next.resolve();
  } else {
    running--;
  }
}

// ── LRU Cache ───────────────────────────────────────────────────
const CACHE_MAX = 200;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const cache = new Map();
let cacheHits = 0;
let cacheMisses = 0;

function makeCacheKey({ query, lang, mode, limit }) {
  return JSON.stringify({
    query: (query || "").trim().toLowerCase(),
    lang,
    mode,
    limit,
  });
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  cacheHits++;
  return entry.data;
}

function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function cacheClear() {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

// ── Resolve QMD CLI ─────────────────────────────────────────────
let QMD_CMD;
let QMD_IS_SCRIPT = false;

function resolveQmdCli() {
  if (process.env.QMD_CLI_PATH) {
    const p = resolve(process.env.QMD_CLI_PATH);
    if (existsSync(p)) return p;
  }
  const candidates = [
    "/usr/bin/qmd",
    "/usr/local/bin/qmd",
    resolve(process.cwd(), "node_modules/.bin/qmd"),
    resolve(process.cwd(), "node_modules/@tobilu/qmd/dist/cli/qmd.js"),
  ];
  if (process.env.APPDATA) {
    candidates.push(
      join(process.env.APPDATA, "npm/node_modules/@tobilu/qmd/dist/cli/qmd.js")
    );
  }
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    candidates.push(
      join(home, ".npm-global/lib/node_modules/@tobilu/qmd/dist/cli/qmd.js")
    );
  }
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    "Cannot find qmd CLI. Install @tobilu/qmd or set QMD_CLI_PATH.\nSearched:\n" +
      candidates.map((c) => `  - ${c}`).join("\n")
  );
}

const QMD_CLI = resolveQmdCli();
const firstLine = readFileSync(QMD_CLI, "utf8").split("\n")[0];
QMD_IS_SCRIPT = firstLine.startsWith("#!");
QMD_CMD = QMD_IS_SCRIPT ? QMD_CLI : process.execPath;

// ── In-process Vector Search (multilingual-e5-small) ────────────
let embedder = null; // pipeline instance (loaded once)
let docEmbeddings = []; // [{ file, title, snippet, vector }]
let vectorReady = false;

/** Collect all .md files recursively */
function collectMdFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== ".qmd" &&
      entry.name !== "node_modules"
    ) {
      files.push(...collectMdFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

/** Extract title and first N chars of content from a markdown file */
function parseMarkdownFile(filePath) {
  const raw = readFileSync(filePath, "utf8");
  // Extract title from frontmatter or first heading
  let title = "";
  const fmMatch = raw.match(/^---[\s\S]*?title:\s*["']?(.+?)["']?\s*$/m);
  if (fmMatch) {
    title = fmMatch[1];
  } else {
    const headingMatch = raw.match(/^#\s+(.+)/m);
    if (headingMatch) title = headingMatch[1];
  }
  // Strip frontmatter for content
  const content = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  // Use first 500 chars as snippet for embedding (enough for semantic meaning)
  const snippet = content.slice(0, 500);
  return { title, snippet, content: content.slice(0, 1000) };
}

/** Cosine similarity between two vectors */
function cosineSim(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

/** Initialize the embedding model and document vectors */
async function initVectorSearch() {
  try {
    console.log("[Vector] Loading embedding model...");
    const { pipeline, env } = await import("@huggingface/transformers");

    // Use Chinese HF mirror if HF_ENDPOINT is set (huggingface.co blocked in China)
    if (process.env.HF_ENDPOINT) {
      env.remoteHost = process.env.HF_ENDPOINT;
      console.log(`[Vector] Using HF mirror: ${env.remoteHost}`);
    }
    // Disable local model check to avoid filesystem issues
    env.allowLocalModels = false;

    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL, {
      quantized: true,
    });
    console.log(`[Vector] Model "${EMBEDDING_MODEL}" loaded.`);

    // Load or build document embeddings
    await buildDocEmbeddings();
    vectorReady = true;
    console.log(
      `[Vector] Ready. ${docEmbeddings.length} document embeddings loaded.`
    );
  } catch (err) {
    console.warn(`[Vector] Failed to initialize: ${err.message}`);
    console.warn("[Vector] Fusion mode will fall back to BM25 only.");
    vectorReady = false;
  }
}

/** Build embeddings for all documents, cache to disk */
async function buildDocEmbeddings() {
  const mdFiles = collectMdFiles(QMD_CONTENT);
  console.log(`[Vector] Found ${mdFiles.length} markdown files.`);

  // Try to load cached embeddings
  let cached = {};
  if (existsSync(EMBEDDINGS_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(EMBEDDINGS_PATH, "utf8"));
      for (const doc of raw) cached[doc.file] = doc;
      console.log(`[Vector] Loaded ${raw.length} cached embeddings from disk.`);
    } catch {
      /* ignore corrupt file */
    }
  }

  const results = [];
  let computed = 0;

  for (const fullPath of mdFiles) {
    const relPath = relative(QMD_CONTENT, fullPath).replace(/\\/g, "/");
    const { title, snippet, content } = parseMarkdownFile(fullPath);
    const mtime = statSync(fullPath).mtimeMs;

    // Reuse cached embedding if file unchanged
    if (cached[relPath] && cached[relPath].mtime === mtime) {
      results.push(cached[relPath]);
      continue;
    }

    // Compute new embedding
    // e5 models expect "passage: " prefix for documents
    const textToEmbed = `passage: ${title} ${content}`;
    const output = await embedder(textToEmbed, {
      pooling: "mean",
      normalize: true,
    });
    const vector = Array.from(output.data);

    results.push({ file: relPath, title, snippet, vector, mtime });
    computed++;
    if (computed % 10 === 0)
      console.log(`[Vector] Embedded ${computed} documents...`);
  }

  if (computed > 0) {
    console.log(
      `[Vector] Computed ${computed} new embeddings, saving to disk...`
    );
    writeFileSync(EMBEDDINGS_PATH, JSON.stringify(results));
  }

  docEmbeddings = results;
}

/** Vector search: embed query, compute cosine similarity against all docs */
async function vectorSearch(query, lang, limit) {
  if (!vectorReady || !embedder) return [];

  // e5 models expect "query: " prefix for queries
  const output = await embedder(`query: ${query}`, {
    pooling: "mean",
    normalize: true,
  });
  const queryVec = Array.from(output.data);

  return docEmbeddings
    .map((doc) => ({
      docid: doc.file,
      score: cosineSim(queryVec, doc.vector),
      file: doc.file,
      title: doc.title,
      snippet: doc.snippet,
    }))
    .filter((d) => matchesLang(d.file, lang))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ── BM25 Search (QMD CLI) ───────────────────────────────────────
function commandForMode(mode) {
  if (mode === "bm25") return "search";
  if (mode === "vector") return "vsearch";
  return "query";
}

function matchesLang(filePath, lang) {
  // Normalize: strip qmd:// prefix, ensure leading slash for consistent matching
  let norm = filePath
    .replace(/\\/g, "/")
    .replace(/^qmd:\/\/[^/]+\//, "")
    .toLowerCase();
  if (!norm.startsWith("/")) norm = "/" + norm;
  if (norm.includes("/articles/")) return norm.includes(`/articles/${lang}/`);
  if (norm.includes("/dorms/")) return norm.includes(`/dorms/${lang}/`);
  if (norm.includes("/handbook/"))
    return lang === "zh" && norm.includes("/handbook/zh/");
  return true;
}

/** Run BM25 search via qmd CLI. Returns [] on no results. */
async function runBm25Search(query, candidateLimit) {
  const args = QMD_IS_SCRIPT
    ? ["search", query, "--json", "-n", String(candidateLimit)]
    : [QMD_CLI, "search", query, "--json", "-n", String(candidateLimit)];

  const { stdout } = await execFileAsync(QMD_CMD, args, {
    cwd: QMD_CONTENT,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const trimmed = stdout.trim();
  if (!trimmed || !trimmed.startsWith("[")) return [];
  try {
    return JSON.parse(trimmed);
  } catch {
    return [];
  }
}

/**
 * Reciprocal Rank Fusion: merge two ranked lists.
 * score(d) = sum of 1/(k + rank) across lists. k=60 is standard.
 */
/** Normalize file path: strip qmd:// prefix for consistent dedup */
function normalizeFilePath(fp) {
  return (fp || "").replace(/\\/g, "/").replace(/^qmd:\/\/[^/]+\//, "");
}

function rrfFuse(listA, listB, k = 60) {
  const scores = new Map();

  for (const [rank, item] of listA.entries()) {
    const id = normalizeFilePath(item.file || item.docid);
    const prev = scores.get(id);
    const s = 1 / (k + rank + 1);
    if (prev) {
      prev.score += s;
    } else {
      scores.set(id, { score: s, item: { ...item, file: id } });
    }
  }
  for (const [rank, item] of listB.entries()) {
    const id = normalizeFilePath(item.file || item.docid);
    const prev = scores.get(id);
    const s = 1 / (k + rank + 1);
    if (prev) {
      prev.score += s;
    } else {
      scores.set(id, { score: s, item: { ...item, file: id } });
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ score, item }) => ({ ...item, score }));
}

// ── Main Search Logic ───────────────────────────────────────────
async function queryQmd({ query, lang = "en", limit = 10, mode = "fusion" }) {
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("Missing search query");
  }

  const safeLang = lang === "zh" ? "zh" : "en";
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const safeMode = ["bm25", "vector", "fusion"].includes(mode)
    ? mode
    : "fusion";
  const candidateLimit = Math.max(safeLimit * 3, safeLimit);
  const trimmedQuery = query.trim();

  // Check cache
  const key = makeCacheKey({
    query,
    lang: safeLang,
    mode: safeMode,
    limit: safeLimit,
  });
  const cached = cacheGet(key);
  if (cached) return cached;

  // Acquire concurrency slot (only needed for BM25 which spawns child process)
  const needsSlot = safeMode !== "vector";

  if (needsSlot) await acquireSlot();
  try {
    const cached2 = cacheGet(key);
    if (cached2) return cached2;

    let results;

    if (safeMode === "fusion") {
      // Run BM25 + in-process vector search in parallel, then RRF merge
      const [bm25Raw, vecRaw] = await Promise.all([
        runBm25Search(trimmedQuery, candidateLimit).then((r) =>
          r.filter((item) => matchesLang(item.file, safeLang))
        ),
        vectorSearch(trimmedQuery, safeLang, candidateLimit),
      ]);
      if (vecRaw.length > 0 && bm25Raw.length > 0) {
        results = rrfFuse(bm25Raw, vecRaw)
          .filter((item) => matchesLang(item.file, safeLang))
          .slice(0, safeLimit);
      } else if (vecRaw.length > 0) {
        results = vecRaw.slice(0, safeLimit);
      } else {
        results = bm25Raw.slice(0, safeLimit);
      }
    } else if (safeMode === "vector") {
      results = await vectorSearch(trimmedQuery, safeLang, safeLimit);
    } else {
      // bm25
      const raw = await runBm25Search(trimmedQuery, candidateLimit);
      results = raw
        .filter((item) => matchesLang(item.file, safeLang))
        .slice(0, safeLimit);
    }

    cacheSet(key, results);
    return results;
  } finally {
    if (needsSlot) releaseSlot();
  }
}

// ── HTTP Server ─────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-QMD-Region": REGION,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, "");
    return;
  }

  // Health check
  if (req.url === "/health" && req.method === "GET") {
    const totalReqs = cacheHits + cacheMisses;
    const mem = process.memoryUsage();
    sendJson(res, 200, {
      status: queue.length > 30 ? "degraded" : "ok",
      region: REGION,
      timestamp: new Date().toISOString(),
      vectorReady,
      metrics: {
        activeProcesses: running,
        queueDepth: queue.length,
        maxConcurrent: MAX_CONCURRENT,
        cacheSize: cache.size,
        cacheHitRate: totalReqs > 0 ? +(cacheHits / totalReqs).toFixed(2) : 0,
        docCount: docEmbeddings.length,
        memoryUsageMB: Math.round(mem.rss / 1024 / 1024),
        freeMemoryMB: Math.round(freemem() / 1024 / 1024),
        totalMemoryMB: Math.round(totalmem() / 1024 / 1024),
      },
    });
    return;
  }

  const authOk = !API_KEY || req.headers.authorization === `Bearer ${API_KEY}`;

  // Cache clear
  if (req.url === "/api/cache/clear" && req.method === "POST") {
    if (!authOk) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    const prev = cache.size;
    cacheClear();
    sendJson(res, 200, { cleared: prev });
    return;
  }

  // Rebuild embeddings
  if (req.url === "/api/embeddings/rebuild" && req.method === "POST") {
    if (!authOk) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    if (!embedder) {
      sendJson(res, 503, { error: "Embedding model not loaded" });
      return;
    }
    try {
      await buildDocEmbeddings();
      cacheClear();
      sendJson(res, 200, { rebuilt: docEmbeddings.length });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // Search
  if (req.url === "/api/search" && req.method === "POST") {
    if (!authOk) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const start = Date.now();
      const results = await queryQmd(body);
      const elapsed = Date.now() - start;
      console.log(
        `[QMD] q="${(body.query || "").slice(0, 50)}" mode=${body.mode || "fusion"} lang=${body.lang || "en"} n=${results.length} ${elapsed}ms ${elapsed < 5 ? "cache" : ""}`
      );
      sendJson(res, 200, results);
    } catch (err) {
      if (err.message === "queue_full") {
        sendJson(
          res,
          503,
          { error: "Server overloaded, try again later" },
          { "Retry-After": "5" }
        );
      } else if (err.message === "queue_timeout") {
        sendJson(res, 504, {
          error: "Request queued too long, try again later",
        });
      } else {
        console.error("[QMD] Search error:", err.message);
        sendJson(res, 500, { error: err.message });
      }
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

// ── Startup ─────────────────────────────────────────────────────
console.log(
  `[QMD Server] CLI: ${QMD_CLI} (${QMD_IS_SCRIPT ? "script" : "module"})`
);
console.log(`[QMD Server] Content: ${QMD_CONTENT}`);
console.log(
  `[QMD Server] Region: ${REGION} | Port: ${PORT} | Auth: ${API_KEY ? "on" : "off"}`
);
console.log(
  `[QMD Server] Concurrency: max ${MAX_CONCURRENT}, queue ${MAX_QUEUE}`
);

// Start HTTP server immediately (BM25 works right away)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[QMD Server] Ready at http://0.0.0.0:${PORT} (BM25 available)`);
});

// Load embedding model in background (non-blocking)
initVectorSearch().catch((err) => {
  console.error("[Vector] Init failed:", err.message);
});

// Memory watchdog
setInterval(() => {
  const freeMB = Math.round(freemem() / 1024 / 1024);
  if (freeMB < 500) {
    console.warn(`[QMD Server] LOW MEMORY: ${freeMB}MB free`);
  }
}, 60_000);
