# AI Agent Worker

Cloudflare Worker serving IlliniGuide at `api.iguide.chat`.

This README is intentionally **Worker-specific**. For the full product architecture, deployment topology, and shared runbook context, see the root [`README.md`](../../README.md).

## What This Worker Owns

- Supabase JWT verification
- Geo-IP based request routing logic
- CORS handling
- Health checks
- SSE chat responses
- Server-side tool-use runtime entrypoint
- MCP-style tool registry host
- Integration with Supabase, DeepSeek, Tavily, and the configured embedding provider

It is **not** documented here as a generic backend proxy. The default production path is serverless-first.

## Project Structure

```text
apps/ai-agent/
├── src/
│   └── index.ts        # Main Worker entrypoint
├── package.json        # Scripts and dependencies
├── tsconfig.json       # TypeScript config
├── cloudflare.config.ts  # Worker configuration (cf/config)
├── vite.config.ts        # Wires cf's build pipeline to Vite
├── .dev.vars.example   # Local env template (if present)
└── README.md           # This file
```

## Local Development

### Install

Dependencies are installed once for the whole workspace, from the repository root:

```bash
pnpm install
```

### Run Locally

```bash
pnpm run dev:ai-agent
```

Worker default local URL:

```text
http://localhost:8787
```

### Basic Verification

```bash
# Health check
curl http://localhost:8787/health

# Chat endpoint (requires valid auth token)
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello","history":[]}'
```

## Runtime Responsibilities

### Request Flow

```text
Browser / App
  -> api.iguide.chat (Cloudflare Worker)
     -> JWT verification
     -> rate limiting / routing
     -> tool-use agent runtime
     -> SSE response stream
     -> external services as needed:
        -> Supabase
        -> DeepSeek API
        -> Tavily API
        -> Managed Embedding API
```

Optional only:

```text
Cloudflare Worker
  -> EMBEDDING_FALLBACK_URL
```

### Endpoints

#### `GET /health`

Health check endpoint.

Typical response shape:

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

#### `POST /chat`

Authenticated chat entrypoint.

Headers:

- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

Example request:

```json
{
  "message": "Hello",
  "conversationId": "optional-id",
  "history": []
}
```

Response:

- SSE stream for chat output
- May include server-side tool-use events depending on the active path

## Configuration

This section only lists Worker-relevant configuration. For broader deployment sequencing, see the root README.

### Required Environment Variables

| Variable                    | Description                                            | Required |
| --------------------------- | ------------------------------------------------------ | -------- |
| `SUPABASE_URL`              | Supabase project URL                                   | Yes      |
| `SUPABASE_ANON_KEY`         | Supabase anon key for auth verification                | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged server-side operations | Yes      |
| `DEEPSEEK_API_KEY`          | DeepSeek API key                                       | Yes      |
| `TAVILY_API_KEY`            | Tavily API key                                         | Yes      |
| `USE_TOOL_USE_RAG`          | Feature flag for the new server-side tool-use path     | Yes      |
| `EMBEDDING_API_BASE_URL`    | Managed embedding provider base URL                    | Yes      |
| `EMBEDDING_API_KEY`         | Managed embedding provider API key                     | Yes      |
| `EMBEDDING_MODEL`           | Embedding model identifier                             | Yes      |
| `EMBEDDING_DIMENSIONS`      | Embedding dimension expected by Supabase schema        | Yes      |

### Optional Environment Variables

| Variable                 | Description                                                           | Required |
| ------------------------ | --------------------------------------------------------------------- | -------- |
| `EMBEDDING_FALLBACK_URL` | Optional self-hosted embedding fallback endpoint                      | No       |
| `SILICONFLOW_API_KEY`    | Optional regional model-routing provider if still used in this Worker | No       |

`EMBEDDING_FALLBACK_URL` must stay optional. Do not treat a VPS as a default dependency for this Worker.

## cf Setup

### Local vars

If the repo provides `.dev.vars.example`, copy it first:

```bash
cp apps/ai-agent/.dev.vars.example apps/ai-agent/.dev.vars
```

Then fill in real values for the required variables above.

### Production secrets

Set secrets with `cf`:

```bash
vp -C apps/ai-agent exec cf workers secrets update SUPABASE_URL
vp -C apps/ai-agent exec cf workers secrets update SUPABASE_ANON_KEY
vp -C apps/ai-agent exec cf workers secrets update SUPABASE_SERVICE_ROLE_KEY
vp -C apps/ai-agent exec cf workers secrets update DEEPSEEK_API_KEY
vp -C apps/ai-agent exec cf workers secrets update TAVILY_API_KEY
vp -C apps/ai-agent exec cf workers secrets update EMBEDDING_API_BASE_URL
vp -C apps/ai-agent exec cf workers secrets update EMBEDDING_API_KEY
```

`EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS` are plain vars declared in
`cloudflare.config.ts`, not secrets. `EMBEDDING_FALLBACK_URL` is optional:

```bash
vp -C apps/ai-agent exec cf workers secrets update EMBEDDING_FALLBACK_URL
```

### Routes

The `api.iguide.chat` hostname is a custom domain on the Worker, not a route
pattern. Declare it under `domains` in `cloudflare.config.ts`:

```ts
worker: {
  domains: ["api.iguide.chat"],
}
```

## Deployment

### Deploy

```bash
vp -C apps/ai-agent run deploy
```

`cf deploy` builds the Worker and uploads it in one step. Use
`cf deploy --dry-run` first to validate `cloudflare.config.ts` and the bundle
without touching the account.

### Logs

`cf` has no equivalent of `wrangler tail`, so there is no `tail` script. Read
Worker logs from the Cloudflare dashboard (observability is enabled in
`cloudflare.config.ts`) or with `cf observability queries`.

## Worker-Specific Troubleshooting

### Worker not accessible

1. Verify the custom domain in `cloudflare.config.ts`
2. Confirm Cloudflare DNS/proxy setup
3. Check Worker observability in the dashboard for runtime errors

### Auth errors

1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Confirm the JWT token is valid
3. Check whether the Worker is rejecting unauthenticated requests as expected

### Tool-use path not activating

1. Confirm `USE_TOOL_USE_RAG=true`
2. Check Worker logs for tool registry / agent loop errors
3. Verify `DEEPSEEK_API_KEY`, `TAVILY_API_KEY`, and embedding provider settings

### Embedding failures

1. Verify `EMBEDDING_API_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, and `EMBEDDING_DIMENSIONS`
2. Confirm the provider is reachable from the Worker runtime
3. If using `EMBEDDING_FALLBACK_URL`, verify it is intentionally configured and healthy

### SSE issues

1. Check `GET /health`
2. Inspect Worker logs for stream termination or timeout errors
3. Verify the frontend is consuming SSE correctly

## Keep This File Focused

Do not duplicate the full monorepo architecture or the full deployment runbook here. This file should stay focused on:

- what the Worker does
- how to configure it
- how to run it locally
- how to deploy and debug it

## License

MIT
