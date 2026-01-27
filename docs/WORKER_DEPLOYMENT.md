# Worker Gateway Deployment Guide

Complete guide for deploying the independent Worker gateway at `api.iguide.chat`.

## 📋 What Changed

### Before
```
illiniguide---uiuc-knowledge-base/
├── functions/
│   ├── _middleware.ts    ← Auth + Geo-IP (Pages Function)
│   └── api/chat.ts       ← API proxy (Pages Function)
└── dist/                 ← Frontend
```

### After
```
api-gateway/              ← NEW: Independent Worker
├── src/index.ts          ← Auth + Geo-IP + API proxy
└── ...

illiniguide---uiuc-knowledge-base/
└── dist/                 ← Frontend only (no functions/)
```

---

## 🚀 Deployment Steps

### Step 1: Configure Worker

#### 1.1 Update wrangler.toml

Edit `api-gateway/wrangler.toml` and uncomment the routes section:

```toml
routes = [
  { pattern = "api.iguide.chat/*", zone_name = "iguide.chat" }
]
```

**Important**: Replace `iguide.chat` with your actual domain name.

#### 1.2 Create .dev.vars for Local Development

```bash
cd api-gateway
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual values:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
DEEPSEEK_API_KEY=sk-deepseek-...
SILICONFLOW_API_KEY=sk-siliconflow-...
BACKEND_URL=https://backend.iguide.chat/api/v1/chat
```

---

### Step 2: Test Locally

```bash
cd api-gateway

# Start Worker locally
npm run dev
```

Worker will be available at `http://localhost:8787`

#### Test Endpoints

```bash
# Health check
curl http://localhost:8787/health

# Chat endpoint (requires auth token)
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "test"}'
```

---

### Step 3: Configure DNS

#### Option A: Automatic (Recommended)

When you deploy with routes configured, Wrangler will automatically create the DNS record.

#### Option B: Manual

In Cloudflare Dashboard:

1. Go to your domain → DNS
2. Add record:
   - **Type**: `AAAA`
   - **Name**: `api`
   - **Content**: `100::`
   - **Proxy**: ✅ Enabled (orange cloud)

---

### Step 4: Set Production Secrets

```bash
cd api-gateway

# Set each secret
wrangler secret put SUPABASE_URL
# Enter: https://your-project.supabase.co

wrangler secret put SUPABASE_ANON_KEY
# Enter: eyJ...

wrangler secret put DEEPSEEK_API_KEY
# Enter: sk-deepseek-...

wrangler secret put SILICONFLOW_API_KEY
# Enter: sk-siliconflow-...

wrangler secret put BACKEND_URL
# Enter: https://backend.iguide.chat/api/v1/chat
```

---

### Step 5: Deploy Worker

```bash
cd api-gateway

# Deploy to production
npm run deploy
```

**Expected output:**
```
✨ Successfully published your script to
   https://api.iguide.chat/*
```

---

### Step 6: Update Frontend

#### 6.1 Update Environment Variables

Edit `illiniguide---uiuc-knowledge-base/.env`:

```bash
# Update backend URL to use Worker gateway
VITE_BACKEND_URL=https://api.iguide.chat/chat
```

#### 6.2 Deploy Frontend to Cloudflare Pages

The frontend no longer has `functions/` directory, so it's now a pure static site.

**In Cloudflare Pages Dashboard**:
1. Go to your Pages project
2. Settings → Environment variables
3. Update `VITE_BACKEND_URL` to `https://api.iguide.chat/chat`
4. Redeploy

Or push to GitHub (if auto-deploy is enabled):

```bash
git add .
git commit -m "feat: Migrate to independent Worker gateway"
git push
```

---

## 🧪 Testing

### Test Worker Deployment

```bash
# Health check
curl https://api.iguide.chat/health

# Expected response:
{
  "status": "ok",
  "region": "Global",
  "country": "US",
  "authenticated": false,
  "timestamp": "2024-01-27T...",
  "version": "1.0.0"
}
```

### Test from Frontend

1. Open your frontend: `https://iguide.chat`
2. Login with Supabase
3. Send a chat message
4. Verify streaming response works

### Test Geo-Routing

Use VPN to test from different regions:

```bash
# From US
curl https://api.iguide.chat/health
# Should show: "region": "Global", "country": "US"

# From China (use VPN)
curl https://api.iguide.chat/health
# Should show: "region": "CN", "country": "CN"
```

---

## 📊 Monitoring

### View Worker Logs

```bash
cd api-gateway
npm run tail
```

### Cloudflare Dashboard

1. Go to Workers & Pages → api-gateway
2. View:
   - Requests per second
   - Errors
   - CPU time
   - Logs

---

## 🔧 Troubleshooting

### Worker not accessible

**Problem**: `https://api.iguide.chat` returns 404

**Solutions**:
1. Check DNS record exists
2. Verify routes in `wrangler.toml`
3. Ensure domain is added to Cloudflare
4. Wait 1-2 minutes for DNS propagation

### CORS errors in frontend

**Problem**: Browser shows CORS errors

**Solutions**:
1. Update CORS origin in `src/index.ts`:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://iguide.chat', // Your frontend domain
     // ...
   };
   ```
2. Redeploy Worker: `npm run deploy`

### Auth errors

**Problem**: All requests return 401

**Solutions**:
1. Verify secrets are set: `wrangler secret list`
2. Check `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Test JWT token validity

### Backend connection fails

**Problem**: Worker can't reach backend

**Solutions**:
1. Verify `BACKEND_URL` is correct
2. Check Argo Tunnel is running on VPS
3. Test backend directly: `curl https://backend.iguide.chat/api/v1/health`

---

## 🔄 Updates and Maintenance

### Update Worker Code

```bash
cd api-gateway

# Make changes to src/index.ts

# Deploy
npm run deploy
```

### Update Secrets

```bash
# Update a secret
wrangler secret put BACKEND_URL

# Delete a secret
wrangler secret delete OLD_SECRET_NAME

# List all secrets
wrangler secret list
```

### Rollback

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

---

## 📝 Architecture Summary

```
User Browser
    ↓
iguide.chat (Cloudflare Pages - Frontend)
    ↓
api.iguide.chat (Cloudflare Worker - Gateway)
    ↓  ├─ JWT Verification (Supabase)
    ↓  ├─ Geo-IP Detection (CN vs Global)
    ↓  └─ CORS Handling
    ↓
backend.iguide.chat (Argo Tunnel)
    ↓
Chicago VPS (FastAPI + RAG)
```

---

## ✅ Deployment Checklist

### Worker Gateway
- [ ] Updated `wrangler.toml` with domain
- [ ] Created `.dev.vars` for local testing
- [ ] Tested locally (`npm run dev`)
- [ ] Set production secrets
- [ ] Deployed Worker (`npm run deploy`)
- [ ] Verified DNS routing
- [ ] Tested `/health` endpoint
- [ ] Tested `/chat` endpoint

### Frontend
- [ ] Removed `functions/` directory
- [ ] Removed `wrangler.toml`
- [ ] Updated `.env` with Worker URL
- [ ] Updated environment variables in Cloudflare Pages
- [ ] Deployed frontend
- [ ] Tested end-to-end flow

### Backend
- [ ] Argo Tunnel running
- [ ] Backend accessible via tunnel
- [ ] Health endpoint working

---

## 🎯 Next Steps

After successful deployment:

1. **Monitor Performance**
   - Check Worker analytics
   - Monitor error rates
   - Track response times

2. **Optimize**
   - Add caching if needed
   - Implement rate limiting
   - Add request logging

3. **Security**
   - Update CORS to specific domain
   - Add request validation
   - Implement rate limiting

4. **Documentation**
   - Document API endpoints
   - Create troubleshooting guide
   - Update team documentation

---

## 📚 Additional Resources

- **Worker Code**: `api-gateway/src/index.ts`
- **Worker README**: `api-gateway/README.md`
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
