# Serverless RAG Architecture Deployment Runbook

This document provides step-by-step instructions for deploying the IlliniGuide serverless RAG architecture.

**IMPORTANT:** The default production path does NOT depend on a dedicated VPS. All core services run on serverless infrastructure.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Cloudflare Worker Deployment](#cloudflare-worker-deployment)
5. [Supabase Configuration](#supabase-configuration)
6. [Data Import](#data-import)
7. [Embedding Provider Configuration](#embedding-provider-configuration)
8. [Frontend Deployment](#frontend-deployment)
9. [Cutover Flow](#cutover-flow)
10. [Rollback](#rollback)
11. [Verification Commands](#verification-commands)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The serverless RAG architecture consists of the following components:

```
User Request
    |
    v
Cloudflare Pages (Frontend) -> VITE_USE_TOOL_USE_RAG flag
    |
    v
Cloudflare Worker (API Gateway) - api.iguide.chat
    ├── JWT Verification (Supabase)
    ├── Geo-IP Detection (CN vs Global)
    ├── Tool-use RAG (when USE_TOOL_USE_RAG=true)
    │       ├── Search Knowledge Base (Supabase pgvector)
    │       ├── Web Search (Tavily fallback)
    │       └── DeepSeek/SiliconFlow LLM
    └── Legacy Proxy (when USE_TOOL_USE_RAG=false)
            └── Forward to VPS Backend
    |
    v
Supabase (PostgreSQL + pgvector)
    ├── documents table (384-dim embeddings)
    ├── document_chunks table
    └── hybrid_search() RPC function
    |
    v
Managed Embedding Provider (OpenAI-compatible API)
    └── multilingual-e5-small (384 dimensions)
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| **Cloudflare Pages** | Static frontend hosting with edge caching |
| **Cloudflare Worker** | API gateway, auth, routing, RAG orchestration |
| **Supabase** | Document storage, vector search, user auth |
| **DeepSeek** | LLM for global traffic |
| **SiliconFlow** | LLM for China traffic |
| **Tavily** | Web search fallback |
| **Managed Embedding Provider** | Text-to-vector embeddings (OpenAI-compatible) |

---

## Prerequisites

### Required Accounts

Create accounts on the following platforms:

1. **Cloudflare** (https://dash.cloudflare.com)
   - Domain added to Cloudflare (e.g., `iguide.chat`)
   - Workers/Pages plan enabled

2. **Supabase** (https://supabase.com)
   - New project created
   - Note the project URL and API keys

3. **DeepSeek** (https://platform.deepseek.com)
   - API key for LLM access

4. **SiliconFlow** (https://siliconflow.cn)
   - API key for China-region LLM

5. **Tavily** (https://tavily.com)
   - API key for web search fallback

6. **Managed Embedding Provider**
   - Any OpenAI-compatible API (e.g., OpenAI, Azure, or self-hosted)
   - API endpoint URL and key

### Required CLI Tools

Install the following tools locally:

```bash
# Node.js 18+ and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Cloudflare Wrangler
npm install -g wrangler

# Supabase CLI
npm install -g supabase

# Verify installations
wrangler --version  # Should be 3.x or higher
supabase --version   # Should be 1.x or higher
node --version       # Should be 18.x or higher
```

### Domain Setup

Configure DNS records in Cloudflare:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | `www` | `<pages-domain>.pages.dev` | Proxied (orange cloud) |
| AAAA | `api` | `100::` | Proxied (orange cloud) |

---

## Environment Variables

Complete list of all environment variables required for the serverless RAG deployment.

### Cloudflare Worker Secrets (set via `wrangler secret put`)

| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `SUPABASE_URL` | Supabase project URL | Yes | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJhbGci...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes | `eyJhbGci...` |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Yes | `sk-abc123...` |
| `SILICONFLOW_API_KEY` | SiliconFlow API key | Yes | `sk-def456...` |
| `TAVILY_API_KEY` | Tavily search API key | Yes | `tvly-ghi789...` |
| `BACKEND_URL` | VPS backend URL (legacy) | Yes | `https://backend.iguide.chat` |
| `QMD_CN_URL` | China QMD service URL | Yes | `https://qmd-cn.example.com` |
| `QMD_US_URL` | US QMD service URL | Yes | `https://qmd-us.example.com` |
| `QMD_API_KEY` | QMD service auth key | Yes | `Bearer qmd-key-123` |
| `EMBEDDING_API_BASE_URL` | Embedding provider base URL | Yes | `https://api.openai.com` |
| `EMBEDDING_API_KEY` | Embedding provider API key | Yes | `sk-embedding-key-123` |
| `EMBEDDING_FALLBACK_URL` | Fallback embedding URL (optional) | No | `https://fallback.example.com` |

### Cloudflare Worker Vars (set in wrangler.jsonc)

| Variable | Description | Required | Default Value |
|----------|-------------|----------|---------------|
| `EMBEDDING_MODEL` | Embedding model name | Yes | `multilingual-e5-small` |
| `EMBEDDING_DIMENSIONS` | Embedding vector dimensions | Yes | `384` |
| `USE_TOOL_USE_RAG` | Feature flag for serverless RAG | Yes | `false` |

### Frontend Environment Variables (app/.env.local)

| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `VITE_SUPABASE_URL` | Public Supabase URL | Yes | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon key | Yes | `eyJhbGci...` |
| `VITE_MAPBOX_TOKEN` | Mapbox public token | Yes | `pk.abc123...` |
| `VITE_COZE_BOT_ID` | Coze bot ID | Yes | `123456789` |
| `VITE_USE_TOOL_USE_RAG` | Frontend RAG toggle | Yes | `false` |
| `VITE_API_GATEWAY_URL` | API Gateway URL | Yes | `https://api.iguide.chat` |

### Server-side Variables (app/.env.local, NOT VITE_ prefixed)

| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `COZE_API_TOKEN` | Coze API token (dev proxy) | No | `pat-abc123...` |
| `DEEPSEEK_API_KEY` | DeepSeek API (dev proxy) | No | `sk-abc123...` |
| `TAVILY_API_KEY` | Tavily API (dev proxy) | No | `tvly-ghi789...` |

### Data Import Variables (scripts/import-to-supabase.ts)

| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `SUPABASE_URL` | Supabase project URL | Yes | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes | `eyJhbGci...` |
| `EMBEDDING_API_BASE_URL` | Embedding provider URL | Yes | `https://api.openai.com` |
| `EMBEDDING_API_KEY` | Embedding provider key | Yes | `sk-embedding-key-123` |
| `EMBEDDING_MODEL` | Model name | No | `multilingual-e5-small` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | No | `384` |

---

## Cloudflare Worker Deployment

### Step 1: Configure wrangler.jsonc

Verify the Worker configuration file at `api/wrangler.jsonc`:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "api-gateway",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-08",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "build": {
    "watch_dir": "src"
  },
  "vars": {
    "EMBEDDING_MODEL": "multilingual-e5-small",
    "EMBEDDING_DIMENSIONS": "384",
    "USE_TOOL_USE_RAG": "false"
  },
  "env": {
    "production": {},
    "development": {}
  }
}
```

### Step 2: Set Production Secrets

Run these commands to set all required secrets:

```bash
cd api

# Supabase configuration
wrangler secret put SUPABASE_URL
# Enter: https://your-project.supabase.co

wrangler secret put SUPABASE_ANON_KEY
# Enter: your-anon-key

wrangler secret put SUPABASE_SERVICE_KEY
# Enter: your-service-role-key

# LLM API keys
wrangler secret put DEEPSEEK_API_KEY
# Enter: your-deepseek-key

wrangler secret put SILICONFLOW_API_KEY
# Enter: your-siliconflow-key

# Web search
wrangler secret put TAVILY_API_KEY
# Enter: your-tavily-key

# Legacy backend (VPS)
wrangler secret put BACKEND_URL
# Enter: https://backend.iguide.chat

# QMD service endpoints
wrangler secret put QMD_CN_URL
# Enter: https://your-cn-qmd-service.com

wrangler secret put QMD_US_URL
# Enter: https://your-us-qmd-service.com

wrangler secret put QMD_API_KEY
# Enter: Bearer your-qmd-key

# Embedding provider
wrangler secret put EMBEDDING_API_BASE_URL
# Enter: https://api.openai.com

wrangler secret put EMBEDDING_API_KEY
# Enter: your-embedding-key

# Optional fallback
wrangler secret put EMBEDDING_FALLBACK_URL
# Enter: https://fallback-embedding.com (or empty)
```

### Step 3: Deploy the Worker

```bash
# Deploy to production
wrangler deploy --env production

# Expected output:
# Successfully created the 'api-gateway' script
# Successfully published your script to the following routes:
#   api.iguide.chat/*
```

### Step 4: Verify Health Check

```bash
# Test the health endpoint
curl https://api.iguide.chat/health

# Expected output:
# {
#   "status": "ok",
#   "region": "Global",
#   "country": "US",
#   "authenticated": false,
#   "timestamp": "2024-01-27T12:00:00.000Z",
#   "version": "1.0.0"
# }
```

---

## Supabase Configuration

### Step 1: Enable pgvector Extension

In the Supabase SQL Editor, run:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Verification:**

```sql
-- Check extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');

-- Expected output: 2 rows with vector and pg_trgm
```

### Step 2: Run Migration 001 - Create Documents Table

Run the following SQL in Supabase SQL Editor (see file: `supabase/migrations/001_create_documents.sql`):

**Verification:**

```sql
-- Verify table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';

-- Expected output: id, title, content, url, source, category, embedding, fts_vector, metadata, indexed_at, created_at, updated_at
```

### Step 3: Run Migration 002 - Chunks and RLS

Run the following SQL in Supabase SQL Editor (see file: `supabase/migrations/002_chunks_and_rls.sql`):

**Verification:**

```sql
-- Verify chunks table
SELECT * FROM public.document_stats;

-- Expected output:
-- total_documents | total_chunks | chunks_with_embedding | categories
-- 0               | 0            | 0                     | 0
```

### Step 4: Run Migration 003 - Search Functions

Run the following SQL in Supabase SQL Editor (see file: `supabase/migrations/003_search_functions.sql`):

**Verification:**

```sql
-- Verify functions exist
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname IN ('hybrid_search', 'hybrid_search_chunks', 'keyword_search');

-- Expected output: 3 rows with the function names
```

---

## Data Import

### Step 1: Prepare Data Source

Ensure your data is in one of these formats:

- **JSONL file** with fields: `url`, `title`, `content`, `category`
- **Markdown files** with YAML frontmatter
- **Directory** containing either of the above

Example JSONL format:

```json
{"url": "https://example.com/page1", "title": "Page Title", "content": "Page content...", "category": "general"}
{"url": "https://example.com/page2", "title": "Another Page", "content": "More content...", "category": "faq"}
```

### Step 2: Run Import Script

Set environment variables and run the import:

```bash
# Set required env vars
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export EMBEDDING_API_BASE_URL="https://api.openai.com"
export EMBEDDING_API_KEY="your-embedding-key"
export EMBEDDING_MODEL="multilingual-e5-small"
export EMBEDDING_DIMENSIONS="384"

# Run import from JSONL
npx tsx scripts/import-to-supabase.ts --source ./data/raw_crawl.jsonl

# Or import from single markdown file
npx tsx scripts/import-to-supabase.ts --source ./data/document.md

# Or import from directory
npx tsx scripts/import-to-supabase.ts --source ./data/documents/

# Dry run to preview (no actual import)
npx tsx scripts/import-to-supabase.ts --source ./data/raw_crawl.jsonl --dry-run

# Limit to first N documents
npx tsx scripts/import-to-supabase.ts --source ./data/raw_crawl.jsonl --limit 100
```

### Step 3: Verify Import

```sql
-- Check document count
SELECT * FROM public.document_stats;

-- Expected output:
-- total_documents | total_chunks | chunks_with_embedding | categories
-- 100             | 500          | 500                   | 5
```

---

## Embedding Provider Configuration

### Step 1: Choose a Provider

Select an OpenAI-compatible embedding provider:

**Option A: OpenAI API**
- URL: `https://api.openai.com`
- Model: `text-embedding-3-small` (1536 dim) or `text-embedding-ada-002` (1536 dim)
- Note: Must update `EMBEDDING_DIMENSIONS` to match

**Option B: Azure OpenAI**
- URL: `https://your-resource.openai.azure.com/openai/deployments/your-deployment`
- Model: Your deployment name

**Option C: Self-hosted (optional VPS)**
- Deploy a local embedding service
- URL: `https://your-vps.example.com`
- Model: `multilingual-e5-small`

**Recommended for 384-dim compatibility:**
- Use `multilingual-e5-small` with 384 dimensions
- Update `wrangler.jsonc` if using different dimensions

### Step 2: Verify Provider Connectivity

```bash
# Test embedding endpoint
curl -X POST https://your-embedding-provider.com/v1/embeddings \
  -H "Authorization: Bearer your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "multilingual-e5-small",
    "input": ["passage: test document"]
  }'

# Expected output:
# {
#   "data": [
#     {
#       "embedding": [0.1, 0.2, ...],
#       "index": 0,
#       "object": "embedding"
#     }
#   ],
#   "model": "multilingual-e5-small",
#   "object": "list"
# }
```

### Step 3: Configure Fallback (Optional)

If using a VPS as fallback:

```bash
# Set fallback URL
wrangler secret put EMBEDDING_FALLBACK_URL
# Enter: https://your-vps-embedding.com
```

---

## Frontend Deployment

### Step 1: Configure Environment

Create `app/.env.local`:

```bash
# Public Keys (VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAPBOX_TOKEN=your-mapbox-token
VITE_COZE_BOT_ID=your-coze-bot-id
VITE_USE_TOOL_USE_RAG=false
VITE_API_GATEWAY_URL=https://api.iguide.chat

# Server-side only (no VITE_ prefix)
COZE_API_TOKEN=your-coze-token
DEEPSEEK_API_KEY=your-deepseek-key
TAVILY_API_KEY=your-tavily-key
```

### Step 2: Deploy to Cloudflare Pages

```bash
cd app

# Install dependencies
pnpm install

# Build the application
pnpm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=iguide-app

# Expected output:
# Successfully created the 'iguide-app' project
# Successfully published your site
```

### Step 3: Configure Custom Domain

In Cloudflare Dashboard:

1. Go to Workers and Pages -> iguide-app
2. Click "Custom domains" tab
3. Add `www.iguide.chat`
4. Verify DNS record is proxied (orange cloud)

---

## Cutover Flow

### Pre-Cutover Checklist

Before enabling serverless RAG:

- [ ] Worker deployed and health check passing
- [ ] Supabase migrations applied
- [ ] Documents imported with embeddings
- [ ] Embedding provider responding
- [ ] Frontend deployed with matching config
- [ ] Staging verification complete

### Step 1: Verify Staging

```bash
# Test on staging URL
curl https://staging-api.iguide.chat/health

# Test chat with tool-use RAG (staging)
curl -X POST https://staging-api.iguide.chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"message": "What is UIUC?"}'
```

### Step 2: Enable Serverless RAG

```bash
cd api

# Update the feature flag in wrangler.jsonc
# Change: "USE_TOOL_USE_RAG": "true"

# Or set via secret (overrides wrangler.jsonc)
wrangler secret put USE_TOOL_USE_RAG
# Enter: true

# Redeploy
wrangler deploy --env production
```

### Step 3: Update Frontend

```bash
cd app

# Update frontend env
echo 'VITE_USE_TOOL_USE_RAG=true' >> .env.local

# Rebuild and deploy
pnpm run build
wrangler pages deploy dist --project-name=iguide-app
```

### Step 4: Verify Cutover

```bash
# Health check should show new behavior
curl https://api.iguide.chat/health

# Test chat - should use tool-use RAG
curl -X POST https://api.iguide.chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Tell me about dorms"}'
```

---

## Rollback

### 30-Second Rollback via Feature Flag

If issues occur, immediately disable serverless RAG:

```bash
cd api

# Set the feature flag to false
wrangler secret put USE_TOOL_USE_RAG
# Enter: false

# Redeploy
wrangler deploy --env production
```

Or update `wrangler.jsonc`:

```json
{
  "vars": {
    "USE_TOOL_USE_RAG": "false"
  }
}
```

Then redeploy frontend:

```bash
cd app

# Update frontend env
echo 'VITE_USE_TOOL_USE_RAG=false' >> .env.local

# Rebuild and deploy
pnpm run build
wrangler pages deploy dist --project-name=iguide-app
```

**Rollback reverts to VPS backend proxy within 30 seconds.**

---

## Verification Commands

### 1. Health Check

```bash
curl https://api.iguide.chat/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "region": "Global",
  "country": "US",
  "authenticated": false,
  "timestamp": "2024-01-27T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Check Supabase Tables

```bash
# Get document stats
supabase db query "SELECT * FROM public.document_stats;"
```

**Expected Output:**
```
 total_documents | total_chunks | chunks_with_embedding | categories
-----------------+--------------+----------------------+------------
             100 |          500 |                  500 |          5
```

### 3. Test Hybrid Search RPC

```bash
curl -X POST "https://your-project.supabase.co/rest/v1/rpc/hybrid_search" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "dorms",
    "query_embedding": [0.1, 0.2, ...],
    "match_count": 5
  }'
```

**Expected Output:** JSON array with matching documents

### 4. Test Embedding Provider

```bash
curl -X POST https://your-embedding-provider.com/v1/embeddings \
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "multilingual-e5-small", "input": ["passage: test"]}'
```

**Expected Output:** JSON with 384-dimension embedding array

### 5. Check Worker Secrets

```bash
wrangler secret list
```

**Expected Output:** List of all configured secrets

### 6. Test QMD Search

```bash
curl -X POST https://api.iguide.chat/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "dorms"}'
```

**Expected Output:** JSON with search results or error if not configured

### 7. Verify Frontend Env

```bash
cd app
grep VITE_USE_TOOL_USE_RAG .env.local
```

**Expected Output:** `VITE_USE_TOOL_USE_RAG=true` or `false`

### 8. Test Streaming Chat

```bash
curl -X POST https://api.iguide.chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"message": "Hello", "history": []}'
```

**Expected Output:** SSE stream with response tokens

---

## Troubleshooting

### Issue: Embedding Provider Unavailable

**Symptoms:** Import fails with "Embedding API returned 5xx"

**Solution:**
```bash
# Check embedding provider health
curl -I https://your-embedding-provider.com/v1/embeddings

# Test with direct request
curl -X POST https://your-embedding-provider.com/v1/embeddings \
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \
  -d '{"model": "multilingual-e5-small", "input": ["test"]}'

# If using fallback, verify EMBEDDING_FALLBACK_URL is set
wrangler secret put EMBEDDING_FALLBACK_URL
```

### Issue: Supabase RPC Failure

**Symptoms:** Search returns empty or errors

**Solution:**
```sql
-- Verify functions exist
SELECT * FROM pg_proc WHERE proname LIKE '%search%';

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');

-- Test function directly
SELECT * FROM public.hybrid_search('test', ARRAY[]::VECTOR(384), 5);

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'documents';
```

### Issue: Worker Timeout

**Symptoms:** 524 errors or timeouts

**Solution:**
```bash
# Check Worker logs
wrangler tail

# Verify BACKEND_URL is reachable
curl -I $BACKEND_URL

# Reduce embedding batch size in import script
# Edit scripts/import-to-supabase.ts: EMBEDDING_BATCH_SIZE = 16
```

### Issue: SSE Streaming Problems

**Symptoms:** Chat responses not streaming

**Solution:**
```bash
# Verify response headers include:
# Content-Type: text/event-stream
# Cache-Control: no-cache
# Connection: keep-alive

# Test with curl to see raw stream
curl -N https://api.iguide.chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Issue: Fallback Triggers Too Often

**Symptoms:** Tavily web search used instead of knowledge base

**Solution:**
```bash
# Check if documents have embeddings
supabase db query "SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;"

# Verify similarity threshold in code
# Check api/src/agent/loop.ts for score thresholds

# Re-run import if embeddings missing
npx tsx scripts/import-to-supabase.ts --source ./data/raw_crawl.jsonl
```

### Issue: Auth Errors

**Symptoms:** 401 Unauthorized responses

**Solution:**
```bash
# Verify Supabase credentials
wrangler secret get SUPABASE_URL
wrangler secret get SUPABASE_ANON_KEY

# Test Supabase directly
curl $SUPABASE_URL/auth/v1/user \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

---

## Summary

This runbook covers the complete deployment of the serverless RAG architecture. Key points:

1. **Serverless-first:** No VPS required for default operation
2. **Feature flag:** USE_TOOL_USE_RAG enables/disables RAG
3. **30-second rollback:** Change flag and redeploy
4. **All env vars documented:** Copy-paste ready commands
5. **8+ verification commands:** Health, RPC, embedding, etc.

For questions or issues, check the Troubleshooting section or review the component logs.
