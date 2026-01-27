# Quick Start Guide - Edge Layer Deployment

快速部署指南 - 边缘层部署

## 🚀 5-Step Deployment Process

### Step 1: 准备环境变量 (Prepare Environment Variables)

```bash
# 1. 复制环境变量模板
cd illiniguide---uiuc-knowledge-base
cp .env.example .env

# 2. 编辑 .env 文件，填入你的实际值
# - Supabase URL 和 Key
# - DeepSeek API Key
# - SiliconFlow API Key
```

### Step 2: 部署到 Cloudflare Pages (Deploy to Cloudflare Pages)

**方法 A: 通过 GitHub (推荐)**

1. 推送代码到 GitHub
2. 访问 https://dash.cloudflare.com
3. Pages → Create a project → Connect to Git
4. 选择你的仓库
5. 配置构建设置:
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: `illiniguide---uiuc-knowledge-base`
6. 添加环境变量 (在 Settings → Environment variables)
7. Deploy!

**方法 B: 使用 Wrangler CLI**

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
cd illiniguide---uiuc-knowledge-base
wrangler pages deploy dist --project-name=illiniguide
```

### Step 3: 设置 Argo Tunnel (在 VPS 上)

```bash
# SSH 到你的芝加哥 VPS
ssh user@your-vps-ip

# 安装 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 登录 Cloudflare
cloudflared tunnel login

# 创建 tunnel
cloudflared tunnel create illiniguide-backend

# 配置 tunnel (复制 backend/tunnel-config.yml 到 ~/.cloudflared/config.yml)
# 记得替换 <YOUR-TUNNEL-ID> 和 <YOUR-USERNAME>

# 配置 DNS
cloudflared tunnel route dns illiniguide-backend api.illiniguide.com

# 安装为系统服务
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Step 4: 启动后端 (Start Backend)

```bash
# 在 VPS 上
cd /path/to/Ask/backend

# 安装依赖
pip install -r requirements.txt

# 启动 FastAPI
uvicorn main:app --host 0.0.0.0 --port 8000

# 或使用 PM2 (推荐生产环境)
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name illiniguide-backend
pm2 save
pm2 startup
```

### Step 5: 测试 (Test)

```bash
# 测试 Argo Tunnel
curl https://api.illiniguide.com/api/v1/health

# 测试前端
# 访问: https://illiniguide.pages.dev
# 或你的自定义域名
```

## ✅ 验证清单 (Verification Checklist)

- [ ] Cloudflare Pages 部署成功
- [ ] 环境变量已设置
- [ ] Argo Tunnel 运行中 (`sudo systemctl status cloudflared`)
- [ ] 后端 API 可访问 (`curl https://api.illiniguide.com`)
- [ ] 前端可以加载
- [ ] 登录功能正常
- [ ] 聊天功能正常
- [ ] 流式响应正常

## 🔧 常见问题 (Common Issues)

### 1. Build 失败

```bash
# 本地测试构建
cd illiniguide---uiuc-knowledge-base
npm install
npm run build
```

### 2. Tunnel 连接失败

```bash
# 查看日志
sudo journalctl -u cloudflared -f

# 检查配置
cloudflared tunnel info illiniguide-backend
```

### 3. 后端无响应

```bash
# 检查后端是否运行
curl http://localhost:8000

# 查看后端日志
pm2 logs illiniguide-backend
```

### 4. CORS 错误

在 `functions/_middleware.ts` 中添加 CORS 头部（已包含在代码中）

## 📚 详细文档 (Detailed Documentation)

- **完整部署指南**: [docs/EDGE_DEPLOYMENT.md](file:///d:/NewFolder/Ask/Ask/docs/EDGE_DEPLOYMENT.md)
- **Argo Tunnel 设置**: [docs/ARGO_TUNNEL_SETUP.md](file:///d:/NewFolder/Ask/Ask/docs/ARGO_TUNNEL_SETUP.md)

## 🆘 需要帮助? (Need Help?)

1. 检查 Cloudflare Pages 日志
2. 检查 Tunnel 日志: `sudo journalctl -u cloudflared -f`
3. 检查后端日志: `pm2 logs` 或 `tail -f /var/log/backend.log`
4. 查看浏览器控制台 (F12)

## 🎯 下一步 (Next Steps)

部署成功后:

1. 设置自定义域名
2. 配置 SSL/TLS
3. 设置监控和告警
4. 优化性能
5. 添加速率限制
