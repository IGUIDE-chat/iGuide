# API Gateway Worker

Cloudflare Worker serving as API gateway for IlliniGuide at `api.iguide.chat`.

## Features

- ✅ **JWT Authentication** - Verifies Supabase tokens
- ✅ **Geo-IP Routing** - Detects user location (CN vs Global)
- ✅ **Backend Proxy** - Forwards requests to VPS via Argo Tunnel
- ✅ **CORS Handling** - Supports cross-origin requests
- ✅ **Health Check** - `/health` endpoint for monitoring
- ✅ **Streaming Support** - Handles SSE responses from backend

## Project Structure

```
api-gateway/
├── src/
│   └── index.ts          # Main Worker handler
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── wrangler.toml         # Worker configuration
├── .dev.vars.example     # Environment variables template
└── README.md             # This file
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

For local development:

```bash
# Copy template
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your actual values
```

For production (use Wrangler secrets):

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put SILICONFLOW_API_KEY
wrangler secret put BACKEND_URL
```

### 3. Update wrangler.toml

Uncomment and update the routes section:

```toml
routes = [
  { pattern = "api.iguide.chat/*", zone_name = "iguide.chat" }
]
```

## Development

### Run Locally

```bash
pnpm run dev
```

The Worker will be available at `http://localhost:8787`

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/health

# Chat endpoint (requires auth)
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Hello"}'
```

## Deployment

### Deploy to Production

```bash
pnpm run deploy
```

Or with environment:

```bash
pnpm run deploy:production
```

### View Logs

```bash
pnpm run tail
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
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

### POST /chat

Chat endpoint (requires authentication).

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Request:**
```json
{
  "message": "Hello",
  "conversationId": "optional-id",
  "history": []
}
```

**Response:**
Streaming SSE response from backend.

## Environment Variables

| Variable              | Description                   | Required |
|-----------------------|-------------------------------|----------|
| `SUPABASE_URL`        | Supabase project URL          | Yes      |
| `SUPABASE_ANON_KEY`   | Supabase anon key             | Yes      |
| `DEEPSEEK_API_KEY`    | DeepSeek API key              | Yes      |
| `SILICONFLOW_API_KEY` | SiliconFlow API key           | Yes      |
| `BACKEND_URL`         | Backend API URL (Argo Tunnel) | Yes      |

## DNS Configuration

Add DNS record in Cloudflare:

```
Type: AAAA
Name: api
Content: 100::
Proxy: Enabled (orange cloud)
```

Or let Wrangler create it automatically when you deploy with routes configured.

## Architecture

```
User Request
    ↓
api.iguide.chat (This Worker)
    ↓
├─ JWT Verification (Supabase)
├─ Geo-IP Detection (CN vs Global)
├─ CORS Handling
└─ Proxy to Backend
    ↓
backend.iguide.chat (Argo Tunnel)
    ↓
Chicago VPS (FastAPI + RAG)
```

## Troubleshooting

### Worker not accessible

1. Check DNS configuration
2. Verify routes in `wrangler.toml`
3. Ensure domain is added to Cloudflare

### Auth errors

1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Check JWT token is valid
3. Test with Supabase directly

### Backend connection fails

1. Verify `BACKEND_URL` is correct
2. Check Argo Tunnel is running
3. Test backend directly

## License

MIT
