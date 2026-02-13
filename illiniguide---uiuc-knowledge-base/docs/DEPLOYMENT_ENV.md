# 部署环境变量配置

## VITE_MAPBOX_TOKEN（选宿舍地图必需）

选宿舍页面的地图依赖 Mapbox，需配置此环境变量。

### 1. 获取 Mapbox Token

1. 打开 [Mapbox](https://www.mapbox.com/) 并注册/登录
2. 进入 [Account → Access tokens](https://account.mapbox.com/access-tokens/)
3. 点击 **Create a token**
4. 复制生成的 **Public token**（以 `pk.` 开头）

### 2. 本地开发

在项目根目录的 `.env.local` 中添加：

```env
VITE_MAPBOX_TOKEN=pk.你的公钥
```

重启 `npm run dev` 后生效。

### 3. Cloudflare Pages 部署

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
2. 选择你的项目（如 `ask-3k4` 或对应项目名）
3. 进入 **Settings** → **Environment variables**
4. 点击 **Add variable**：
   - **Variable name**: `VITE_MAPBOX_TOKEN`
   - **Value**: 粘贴你的 Mapbox Public token（`pk.xxx`）
   - **Environment**: 勾选 Production 和 Preview
5. 保存后，在 **Deployments** 中点击 **Retry deployment** 或重新触发部署

### 4. 其他平台（Vercel / Netlify 等）

在项目 Settings → Environment Variables 中添加：

| Name | Value |
|------|-------|
| VITE_MAPBOX_TOKEN | pk.你的Mapbox公钥 |

部署后重新构建即可。
