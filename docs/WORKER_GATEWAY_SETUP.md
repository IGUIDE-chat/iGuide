# Worker 网关配置指南

配置 `api.iguide.chat` 作为独立的 Cloudflare Worker 网关，用于处理 API 请求。

## 📋 架构说明

```
用户请求
    ↓
api.iguide.chat (Worker 网关)
    ↓
├─ Auth 验证 (JWT)
├─ Geo-IP 检测 (CN vs Global)
├─ 路由到不同 LLM
│   ├─ CN 用户 → SiliconFlow
│   └─ Global 用户 → DeepSeek
└─ 转发到 VPS Backend (通过 Argo Tunnel)
    ↓
Chicago VPS (FastAPI + RAG)
```

---

## 方案选择

### 方案 A: 独立 Worker (推荐用于 API 网关)

**优势**:
- ✅ 独立域名 `api.iguide.chat`
- ✅ 可以单独管理和部署
- ✅ 更灵活的路由配置
- ✅ 适合纯 API 服务

**劣势**:
- ❌ 需要单独部署
- ❌ 需要配置 CORS（如果前端在不同域名）

### 方案 B: Pages Functions (当前方案)

**优势**:
- ✅ 与前端一起部署
- ✅ 无需 CORS 配置
- ✅ 自动路由

**劣势**:
- ❌ 域名是 `illiniguide.pages.dev/api/*`
- ❌ 不能独立管理

---

## 方案 A: 配置独立 Worker 网关

### Step 1: 创建 Worker 项目

```bash
# 创建新目录
mkdir api-gateway
cd api-gateway

# 初始化 Worker 项目
npm init -y
npm install -D wrangler
```

### Step 2: 创建 Worker 代码

创建 `src/index.ts`:

```typescript
// API Gateway Worker for api.iguide.chat
// Handles: Auth, Geo-IP routing, LLM selection, Backend proxy

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DEEPSEEK_API_KEY: string;
  SILICONFLOW_API_KEY: string;
  BACKEND_URL: string; // Argo Tunnel URL
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 或指定你的前端域名
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // 1. Geo-IP Detection
      const cf = (request as any).cf;
      const country = cf?.country || 'US';
      const isCN = country === 'CN';
      const region = isCN ? 'CN' : 'Global';

      // 2. Auth Verification (JWT)
      const authHeader = request.headers.get('Authorization');
      let userId = 'anonymous';

      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          
          // Verify JWT with Supabase
          const supabaseResponse = await fetch(
            `${env.SUPABASE_URL}/auth/v1/user`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': env.SUPABASE_ANON_KEY,
              },
            }
          );

          if (supabaseResponse.ok) {
            const userData = await supabaseResponse.json();
            userId = userData.id;
          } else {
            return new Response(
              JSON.stringify({ error: 'Invalid token' }),
              { status: 401, headers: corsHeaders }
            );
          }
        } catch (err) {
          return new Response(
            JSON.stringify({ error: 'Auth error' }),
            { status: 500, headers: corsHeaders }
          );
        }
      }

      // 3. Route based on path
      if (url.pathname === '/chat' || url.pathname === '/api/chat') {
        // Forward to VPS backend
        const backendResponse = await fetch(env.BACKEND_URL, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            'X-User-Region': region,
            'X-User-Country': country,
            'X-User-ID': userId,
          },
          body: request.method === 'POST' ? await request.text() : undefined,
        });

        // Handle streaming response
        if (backendResponse.headers.get('content-type')?.includes('text/event-stream')) {
          return new Response(backendResponse.body, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }

        // Regular response
        const responseData = await backendResponse.text();
        return new Response(responseData, {
          status: backendResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 4. Health check endpoint
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            region,
            country,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // 404 for unknown paths
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
```

### Step 3: 创建 wrangler.toml

创建 `wrangler.toml`:

```toml
name = "api-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-27"

# Routes - 绑定到你的域名
routes = [
  { pattern = "api.iguide.chat/*", zone_name = "iguide.chat" }
]

# Environment variables (production)
[env.production.vars]
# 在 Cloudflare Dashboard 中设置这些 secrets:
# wrangler secret put SUPABASE_URL
# wrangler secret put SUPABASE_ANON_KEY
# wrangler secret put DEEPSEEK_API_KEY
# wrangler secret put SILICONFLOW_API_KEY
# wrangler secret put BACKEND_URL

# Development environment
[env.development]
vars = { }
```

### Step 4: 配置 DNS

在 Cloudflare DNS 中添加记录：

```
类型: AAAA
名称: api
内容: 100::  (Worker 的占位符 IP)
代理: 已启用 (橙色云朵)
```

或使用 CLI:

```bash
# 这会自动创建 DNS 记录
wrangler deploy
```

### Step 5: 设置环境变量

```bash
# 设置 secrets
wrangler secret put SUPABASE_URL
# 输入: https://your-project.supabase.co

wrangler secret put SUPABASE_ANON_KEY
# 输入: eyJ...

wrangler secret put DEEPSEEK_API_KEY
# 输入: sk-deepseek-...

wrangler secret put SILICONFLOW_API_KEY
# 输入: sk-siliconflow-...

wrangler secret put BACKEND_URL
# 输入: https://backend.iguide.chat/api/v1/chat
```

### Step 6: 部署

```bash
# 部署到生产环境
wrangler deploy

# 或部署到开发环境
wrangler deploy --env development
```

### Step 7: 测试

```bash
# 测试健康检查
curl https://api.iguide.chat/health

# 测试聊天 API
curl -X POST https://api.iguide.chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Hello"}'
```

---

## 方案 B: 使用 Pages Functions (当前方案)

如果你想继续使用 Pages Functions，但用自定义域名：

### Step 1: 在 Cloudflare Pages 添加自定义域名

1. 进入 Cloudflare Pages → 你的项目
2. **Custom domains** → **Set up a custom domain**
3. 添加 `iguide.chat` 和 `www.iguide.chat`

### Step 2: 配置 DNS

Cloudflare 会自动创建 DNS 记录指向你的 Pages 部署。

### Step 3: API 访问

你的 API 会在:
- `https://iguide.chat/api/chat`
- 或 `https://www.iguide.chat/api/chat`

**问题**: 不能用 `api.iguide.chat` 子域名（Pages 不支持）

---

## 混合方案 (推荐)

**前端**: Cloudflare Pages (`iguide.chat`)  
**API 网关**: Cloudflare Worker (`api.iguide.chat`)

### 架构

```
用户浏览器
    ↓
iguide.chat (Pages - 前端)
    ↓
api.iguide.chat (Worker - API 网关)
    ↓
backend.iguide.chat (Argo Tunnel - VPS)
```

### 配置步骤

1. **前端 (Pages)**:
   - 部署到 Cloudflare Pages
   - 自定义域名: `iguide.chat`
   - 删除 `functions/` 目录（API 逻辑移到 Worker）

2. **API 网关 (Worker)**:
   - 创建独立 Worker 项目（见方案 A）
   - 域名: `api.iguide.chat`
   - 处理所有 API 请求

3. **后端 (VPS)**:
   - Argo Tunnel
   - 域名: `backend.iguide.chat` (内部使用)

### 前端配置

更新前端环境变量:

```bash
# .env
VITE_BACKEND_URL=https://api.iguide.chat/chat
```

---

## 总结

### 推荐配置

| 组件 | 域名 | 技术 |
|------|------|------|
| 前端 | `iguide.chat` | Cloudflare Pages |
| API 网关 | `api.iguide.chat` | Cloudflare Worker |
| 后端 | `backend.iguide.chat` | VPS + Argo Tunnel |

### 下一步

1. 决定使用哪个方案
2. 如果选择独立 Worker，我可以帮你创建完整的项目结构
3. 配置 DNS 和域名
4. 部署和测试

你想使用哪个方案？
