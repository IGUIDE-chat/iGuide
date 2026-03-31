#!/usr/bin/env node
/**
 * QMD Search HTTP Server — deploy on any VPS with @tobilu/qmd + qmd-content.
 *
 * Usage:
 *   QMD_CONTENT=/path/to/qmd-content QMD_PORT=3001 QMD_REGION=cn QMD_API_KEY=secret node qmd-server.mjs
 *
 * Endpoints:
 *   POST /api/search  — { query, lang, limit, mode }
 *   GET  /health      — { status, region }
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ── Config ──────────────────────────────────────────────────────
const PORT = Number(process.env.QMD_PORT) || 3001;
const API_KEY = process.env.QMD_API_KEY || '';
const QMD_CONTENT = resolve(process.env.QMD_CONTENT || './qmd-content');
const REGION = process.env.QMD_REGION || 'unknown';

// ── Resolve QMD CLI ─────────────────────────────────────────────
// QMD can be a bash script (calling bun) or a Node.js entry point.
// We detect which case and set QMD_CMD + QMD_ARGS accordingly.
let QMD_CMD;  // The executable to run
let QMD_IS_SCRIPT = false; // If true, run as shell command, not node

function resolveQmdCli() {
  // Prefer explicit env var
  if (process.env.QMD_CLI_PATH) {
    const p = resolve(process.env.QMD_CLI_PATH);
    if (existsSync(p)) return p;
  }

  // Check known paths
  const candidates = [
    '/usr/bin/qmd',
    '/usr/local/bin/qmd',
    resolve(process.cwd(), 'node_modules/.bin/qmd'),
    resolve(process.cwd(), 'node_modules/@tobilu/qmd/dist/cli/qmd.js'),
  ];

  if (process.env.APPDATA) {
    candidates.push(join(process.env.APPDATA, 'npm/node_modules/@tobilu/qmd/dist/cli/qmd.js'));
  }

  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    candidates.push(join(home, '.npm-global/lib/node_modules/@tobilu/qmd/dist/cli/qmd.js'));
  }

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    'Cannot find qmd CLI. Install @tobilu/qmd or set QMD_CLI_PATH.\nSearched:\n' +
    candidates.map(c => `  - ${c}`).join('\n'),
  );
}

const QMD_CLI = resolveQmdCli();
// Detect if it's a shell script (starts with #!) or a JS file
const firstLine = readFileSync(QMD_CLI, 'utf8').split('\n')[0];
QMD_IS_SCRIPT = firstLine.startsWith('#!');
QMD_CMD = QMD_IS_SCRIPT ? QMD_CLI : process.execPath;
console.log(`[QMD Server] CLI: ${QMD_CLI} (${QMD_IS_SCRIPT ? 'shell script' : 'node module'})`);
console.log(`[QMD Server] Content: ${QMD_CONTENT}`);
console.log(`[QMD Server] Region: ${REGION}`);
console.log(`[QMD Server] Port: ${PORT}`);
console.log(`[QMD Server] Auth: ${API_KEY ? 'enabled' : 'disabled'}`);

// ── Search Logic (from qmdSearchGateway.ts) ─────────────────────
function commandForMode(mode) {
  if (mode === 'bm25') return 'search';
  if (mode === 'vector') return 'vsearch';
  return 'query';
}

function matchesLang(filePath, lang) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('/articles/')) return norm.includes(`/articles/${lang}/`);
  if (norm.includes('/dorms/')) return norm.includes(`/dorms/${lang}/`);
  if (norm.includes('/handbook/')) return lang === 'zh' && norm.includes('/handbook/zh/');
  return true;
}

async function queryQmd({ query, lang = 'en', limit = 10, mode = 'hybrid' }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Missing search query');
  }

  const safeLang = lang === 'zh' ? 'zh' : 'en';
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const safeMode = ['bm25', 'vector', 'hybrid'].includes(mode) ? mode : 'hybrid';
  const candidateLimit = Math.max(safeLimit * 3, safeLimit);
  const command = commandForMode(safeMode);

  const args = QMD_IS_SCRIPT
    ? [command, query.trim(), '--json', '-n', String(candidateLimit)]
    : [QMD_CLI, command, query.trim(), '--json', '-n', String(candidateLimit)];

  const { stdout } = await execFileAsync(
    QMD_CMD,
    args,
    {
      cwd: QMD_CONTENT,
      encoding: 'utf8',
      timeout: safeMode === 'hybrid' ? 120_000 : 30_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );

  const parsed = JSON.parse(stdout.trim());
  return parsed.filter((item) => matchesLang(item.file, safeLang)).slice(0, safeLimit);
}

// ── HTTP Server ─────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-QMD-Region': REGION,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, '');
    return;
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok', region: REGION, timestamp: new Date().toISOString() });
    return;
  }

  // API key check
  if (API_KEY) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${API_KEY}`) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
  }

  // Search endpoint
  if (req.url === '/api/search' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const results = await queryQmd(body);
      sendJson(res, 200, results);
    } catch (err) {
      console.error('[QMD Server] Search error:', err.message);
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[QMD Server] Ready at http://0.0.0.0:${PORT}`);
});
