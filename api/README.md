# API Worker

Cloudflare Worker serving IlliniGuide at `api.iguide.chat`.

This README is intentionally **Worker-specific**. For the full product architecture, deployment topology, and shared runbook context, see the root [`README.md`](../README.md).

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
api/
├── src/
│   └── index.ts        # Main Worker entrypoint
├── package.json        # Scripts and dependencies
├── tsconfig.json       # TypeScript config
├── wrangler.toml       # Worker configuration
├── .dev.vars.example   # Local env template (if present)
└── README.md           # This file
```

## Local Development

### Install

```bash
cd api
pnpm install
```

### Run Locally

```bash
cd api
pnpm run dev
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

## Wrangler Setup

### Local vars

If the repo provides `.dev.vars.example`, copy it first:

```bash
cd api
cp .dev.vars.example .dev.vars
```

Then fill in real values for the required variables above.

### Production secrets

Set secrets and vars with Wrangler:

```bash
cd api
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put TAVILY_API_KEY
wrangler secret put EMBEDDING_API_BASE_URL
wrangler secret put EMBEDDING_API_KEY
wrangler secret put EMBEDDING_MODEL
wrangler secret put EMBEDDING_DIMENSIONS
```

Optional fallback only:

```bash
cd api
wrangler secret put EMBEDDING_FALLBACK_URL
```

### Routes

Configure `wrangler.toml` with the Worker route, for example:

```toml
routes = [
  { pattern = "api.iguide.chat/*", zone_name = "iguide.chat" }
]
```

## Deployment

### Deploy

```bash
cd api
pnpm run deploy
```

If the project defines an environment-specific script, you can use that instead:

```bash
cd api
pnpm run deploy:production
```

### Tail logs

```bash
cd api
pnpm run tail
```

## Worker-Specific Troubleshooting

### Worker not accessible

1. Verify the route in `wrangler.toml`
2. Confirm Cloudflare DNS/proxy setup
3. Check `pnpm run tail` for runtime errors

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
