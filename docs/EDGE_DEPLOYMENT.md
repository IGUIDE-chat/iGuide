# Edge Layer Deployment Guide

Complete guide for deploying IlliniGuide's Edge Layer infrastructure on Cloudflare.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Argo Tunnel Setup](#argo-tunnel-setup)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Access

- ✅ **Cloudflare Account** with Pages access
- ✅ **GitHub Account** with repository access
- ✅ **Supabase Project** (already configured)
- ✅ **Chicago VPS** with SSH access
- ✅ **API Keys**:
  - DeepSeek API key (Global route)
  - SiliconFlow API key (CN route)

### Required Tools

```bash
# Install Node.js (v18+)
node --version  # Should be 18.x or higher

# Install Wrangler CLI (Cloudflare's deployment tool)
npm install -g wrangler

# Verify installation
wrangler --version
```

---

## Cloudflare Pages Deployment

### Step 1: Connect GitHub Repository

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to **Pages** section

2. **Create New Project**
   - Click **"Create a project"**
   - Select **"Connect to Git"**
   - Choose **"GitHub"**
   - Authorize Cloudflare to access your repositories

3. **Select Repository**
   - Find and select your `Ask` repository
   - Click **"Begin setup"**

### Step 2: Configure Build Settings

```yaml
Build Configuration:
  Framework preset: Vite
  Build command: npm run build
  Build output directory: dist
  Root directory: illiniguide---uiuc-knowledge-base
  
Node.js version: 18
```

### Step 3: Set Environment Variables

In Cloudflare Pages dashboard, go to **Settings** → **Environment Variables** and add:

#### Production Environment

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |
| `VITE_DEEPSEEK_API_KEY` | `sk-...` | DeepSeek API key (Global) |
| `VITE_SILICONFLOW_API_KEY` | `sk-...` | SiliconFlow API key (CN) |
| `VITE_BACKEND_URL` | `https://api.illiniguide.com/api/v1/chat` | Argo Tunnel URL |

> [!IMPORTANT]
> Replace placeholder values with your actual credentials. Never commit these to git!

### Step 4: Deploy

1. **Trigger Deployment**
   - Click **"Save and Deploy"**
   - Cloudflare will automatically build and deploy your site

2. **Monitor Build**
   - Watch the build logs for any errors
   - Build should complete in 2-5 minutes

3. **Get Deployment URL**
   - After successful deployment, you'll get a URL like:
   - `https://illiniguide.pages.dev`

---

## Environment Variables Configuration

### Local Development (.env)

Create `.env` file in `illiniguide---uiuc-knowledge-base/`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LLM API Keys
VITE_DEEPSEEK_API_KEY=sk-deepseek-xxx
VITE_SILICONFLOW_API_KEY=sk-siliconflow-xxx

# Backend (for local dev, use localhost)
VITE_BACKEND_URL=http://localhost:8000/api/v1/chat
```

### Production Environment

Set in Cloudflare Pages dashboard (already covered in Step 3 above).

---

## Argo Tunnel Setup

Argo Tunnel creates a secure connection between your Chicago VPS and Cloudflare's network, without exposing your VPS IP publicly.

### Step 1: Install cloudflared on VPS

SSH into your Chicago VPS:

```bash
# SSH into VPS
ssh user@your-vps-ip

# Download cloudflared (Linux x64)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify installation
cloudflared --version
```

### Step 2: Authenticate cloudflared

```bash
# Login to Cloudflare
cloudflared tunnel login
```

This will:
1. Open a browser window
2. Ask you to select your domain
3. Download a certificate to `~/.cloudflared/cert.pem`

### Step 3: Create Tunnel

```bash
# Create a new tunnel named "illiniguide-backend"
cloudflared tunnel create illiniguide-backend

# This creates:
# - Tunnel ID (save this!)
# - Credentials file at ~/.cloudflared/<TUNNEL-ID>.json
```

**Save the Tunnel ID!** You'll need it for configuration.

### Step 4: Configure Tunnel

Create configuration file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Route all traffic to your FastAPI backend
  - hostname: api.illiniguide.com
    service: http://localhost:8000
  
  # Catch-all rule (required)
  - service: http_status:404
```

**Replace:**
- `<TUNNEL-ID>` with your actual tunnel ID
- `api.illiniguide.com` with your domain
- `/home/user/` with your actual home directory path

### Step 5: Configure DNS

```bash
# Create DNS record pointing to your tunnel
cloudflared tunnel route dns illiniguide-backend api.illiniguide.com
```

This creates a CNAME record in Cloudflare DNS:
```
api.illiniguide.com → <TUNNEL-ID>.cfargotunnel.com
```

### Step 6: Run Tunnel

#### Test Run (foreground)

```bash
cloudflared tunnel run illiniguide-backend
```

You should see:
```
INF Connection registered connIndex=0
INF Connection registered connIndex=1
INF Connection registered connIndex=2
INF Connection registered connIndex=3
```

#### Production Run (as service)

```bash
# Install as system service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Step 7: Update Backend URL

Update your Cloudflare Pages environment variable:

```
VITE_BACKEND_URL=https://api.illiniguide.com/api/v1/chat
```

---

## Testing & Validation

### 1. Test Cloudflare Pages Deployment

```bash
# Visit your deployment URL
https://illiniguide.pages.dev
```

**Expected:** Frontend loads successfully

### 2. Test Auth Proxy

```bash
# Test without token (should fail or allow based on endpoint)
curl https://illiniguide.pages.dev/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Test with valid token
curl https://illiniguide.pages.dev/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "test"}'
```

**Expected:** 
- Without token: 401 Unauthorized (if auth required)
- With valid token: Successful response

### 3. Test Geo-Routing

```bash
# Check headers being set
curl -I https://illiniguide.pages.dev/api/chat

# Test from different regions (use VPN)
# From US: Should route to DeepSeek Global
# From CN: Should route to SiliconFlow
```

### 4. Test Argo Tunnel

```bash
# Test direct tunnel access
curl https://api.illiniguide.com/api/v1/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Expected:** Response from your FastAPI backend

### 5. End-to-End Test

1. Open frontend in browser
2. Login with Supabase auth
3. Send a chat message
4. Verify streaming response works
5. Check browser DevTools → Network tab for:
   - Auth headers being sent
   - SSE stream working
   - No CORS errors

---

## Troubleshooting

### Issue: Build Fails on Cloudflare Pages

**Symptoms:** Build errors during deployment

**Solutions:**
```bash
# Check Node.js version
# Ensure it's set to 18 in Cloudflare Pages settings

# Check dependencies
cd illiniguide---uiuc-knowledge-base
npm install
npm run build  # Test locally first
```

### Issue: 401 Unauthorized Errors

**Symptoms:** All API requests return 401

**Solutions:**
1. Check Supabase environment variables are set correctly
2. Verify JWT token is being sent in `Authorization` header
3. Check token hasn't expired
4. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your Supabase project

### Issue: Argo Tunnel Not Connecting

**Symptoms:** `cloudflared` shows connection errors

**Solutions:**
```bash
# Check tunnel status
cloudflared tunnel info illiniguide-backend

# Check service logs
sudo journalctl -u cloudflared -f

# Verify config file
cat ~/.cloudflared/config.yml

# Test backend is running
curl http://localhost:8000/api/v1/chat
```

### Issue: Backend Not Responding

**Symptoms:** Requests timeout or fail

**Solutions:**
1. Verify FastAPI backend is running on VPS
2. Check backend logs for errors
3. Verify port 8000 is open (or whatever port you're using)
4. Test local backend access: `curl http://localhost:8000`

### Issue: CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solutions:**
Add CORS headers in `_middleware.ts`:

```typescript
// In middleware, before returning response
const response = await next();
response.headers.set('Access-Control-Allow-Origin', '*');
response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
return response;
```

### Issue: Geo-Routing Not Working

**Symptoms:** All users routed to same endpoint

**Solutions:**
1. Check `cf` object is available in request
2. Add logging to see detected country:
   ```typescript
   console.log('Detected country:', country);
   ```
3. Verify environment variables for both API keys are set

---

## Next Steps

After successful deployment:

1. ✅ **Monitor Performance**
   - Check Cloudflare Analytics
   - Monitor backend logs
   - Track error rates

2. ✅ **Set Up Monitoring**
   - Configure uptime monitoring (e.g., UptimeRobot)
   - Set up error alerting
   - Monitor tunnel health

3. ✅ **Optimize**
   - Enable Cloudflare caching where appropriate
   - Optimize bundle size
   - Add rate limiting if needed

4. ✅ **Documentation**
   - Document your specific domain/URLs
   - Create runbook for common issues
   - Train team on deployment process

---

## Quick Reference

### Useful Commands

```bash
# Cloudflare Pages
wrangler pages dev                    # Local development
wrangler pages deployment list        # List deployments
wrangler pages deployment tail        # View logs

# Argo Tunnel
cloudflared tunnel list               # List all tunnels
cloudflared tunnel info <NAME>        # Tunnel details
sudo systemctl restart cloudflared    # Restart tunnel service
sudo journalctl -u cloudflared -f     # View tunnel logs

# Backend
ssh user@vps-ip                       # SSH to VPS
pm2 status                            # Check FastAPI status (if using PM2)
tail -f /var/log/backend.log          # View backend logs
```

### Important URLs

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Supabase Dashboard:** https://app.supabase.com
- **Your Frontend:** https://illiniguide.pages.dev
- **Your API (Tunnel):** https://api.illiniguide.com

---

## Support

If you encounter issues not covered here:

1. Check Cloudflare Pages logs in dashboard
2. Check tunnel logs: `sudo journalctl -u cloudflared -f`
3. Check backend logs on VPS
4. Review browser DevTools console and Network tab
5. Consult Cloudflare documentation: https://developers.cloudflare.com/pages/
