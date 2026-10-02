# IlliniGuide 代码仓库

[English](./README.md) | 中文

---

## 中文版

这是一个围绕 UIUC 校园信息构建的多模块仓库，主要由 React 前端和同时承载 SPA 与全部接口的单一 Cloudflare Worker 组成。

## 仓库结构

| 路径            | 作用                                                                                  |
| :-------------- | :------------------------------------------------------------------------------------ |
| `apps/web/`     | React 应用及其 Cloudflare Worker：静态资源、agent loop、工具注册层、MCP 与 `/api/*`。 |
| `dorm_scripts/` | 独立的 Puppeteer / Bun 评价抓取脚本。                                                 |

## 统一开发入口

### 安装依赖

仓库是一个由 Vite+ 驱动的 pnpm workspace，统一在根目录管理：

```bash
pnpm install
```

### 前端开发

```bash
pnpm run dev:web
pnpm run typecheck
```

`vp` 在根目录具备 workspace 感知能力：`vp dev` 与 `vp build` 会自行解析要运行的包，
`vp -C apps/<package> <command>` 则在指定包内执行命令。批量任务使用 `vp run -r <task>`，
也可以用 `--filter <package>` 只跑其中一个包。

### Supabase 宿舍数据

先在 Supabase 中执行以下 SQL 迁移：

- `apps/web/scripts/migrations/create_dorms_table.sql`
- `apps/web/scripts/migrations/add_categorized_tags.sql`

然后执行初始化或重新同步：

```bash
vp run --filter @iguide/web seed:dorms
```

需要配置：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### 爬虫环境

```bash
cd data_collection
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
chmod +x run_all.sh
./run_all.sh
```

### API Worker 基础调试

```bash
pnpm run dev:web
curl http://localhost:5173/api/health
```

这个 Worker 在同一个源上同时提供 SPA 与全部接口，负责校验 Supabase JWT、承载服务端 tool-use 运行时，并输出 SSE 聊天流。

## API Worker 说明

- 所有接口都位于 `/api/*` 之下，浏览器只发起同源请求。
- 使用 Supabase token 做 JWT 鉴权。
- 提供 `/api/health` 健康检查，以及 `/api/chat` 的流式 tool-use 响应。
- 生产环境核心变量包括：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DEEPSEEK_API_KEY`
  - `TAVILY_API_KEY`
- `/api/chat` 始终运行 Worker 内的 tool-use agent。本地运行时把 `apps/web/.dev.vars.example` 复制为 `apps/web/.dev.vars`；该模板覆盖了 Worker `Env` 接口的全部字段。

## 代码组织规则

- `src/App.tsx` 是唯一活跃的应用组合入口。
- `src/pages/**` 中只保留轻量的路由编排逻辑。
- 功能组件放在 `src/components/<feature>/**`。
- 通用 UI 组件只放在 `src/components/ui/**`。
- 旧代码隔离在 `src/legacy/**`，运行时不要从中导入。
- 新页面在 `src/app/pageRegistry.ts` 注册，路由修改在 `src/app/routes.tsx`。

## 检索与 Tool-Use 策略

1. 浏览器把用户消息发送到 Cloudflare Worker。
2. Worker 在服务端运行 DeepSeek agent loop。
3. 模型按需选择工具：
   - `web_search`：调用 Tavily 进行实时网页搜索
   - `custom_skills`：执行更高层的校园场景技能
4. Tavily 网页搜索是唯一的检索来源。

---

## 架构概览

### 一句话概括

这是一个 **serverless-first** 的架构：Cloudflare Worker 负责 agent 运行时与请求控制，Supabase 负责用户数据层，模型推理与网页搜索由托管 API 提供。

### 运行时分层

#### 第一层：边缘与控制层

- Cloudflare Worker 是公网入口，也是核心控制平面。
- 它负责：JWT 鉴权、限流、SSE 输出、tool-use agent loop，以及 MCP 风格的工具注册层。

#### 第二层：数据与检索层

- Supabase Auth 负责注册、登录、OAuth 和密码找回。
- PostgreSQL 保存聊天记录。
- RLS（行级安全）确保用户只能访问自己的数据。
- 异步日志在主响应完成后写入对话数据。

#### 第三层：外部智能服务层

- DeepSeek 提供托管模型推理。
- Tavily 提供托管网页搜索，并且是唯一的检索来源。

### 为什么强调 Serverless-First

- 默认生产路径不依赖专用 VPS。
- Cloudflare Worker + Supabase 把控制面和数据面都交给托管平台。

### 运维简化带来的收益

- 单一的 `web` Cloudflare Worker 同时承载前端（Workers Static Assets）与全部 `/api/*` 接口，因此不再有独立的网关域名，也不存在跨源跳转。
- 同一个 Worker 还承载 API、工具注册层与 agent loop。
- Supabase 统一承载鉴权、结构化记忆与对话存储。
- 模型推理与网页搜索全部优先走托管 API，减少自维护基础设施。

## 部署与配置快速参考

### 默认生产拓扑

```text
浏览器 -> web Worker（静态资源 + /api/*）
  -> Supabase
  -> DeepSeek API
  -> Tavily API
```

### 必要配置

#### 前端 / App

- 前端应直接调用 Cloudflare Worker 的聊天接口。

#### Cloudflare Worker

必需变量：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`

### 最小部署流程

1. 先部署 Supabase 的鉴权与用户数据 schema。
2. 部署 Cloudflare Worker，并确认 `/api/health` 与 `/api/chat` 的 SSE 响应。
3. 在 staging 中构建前端。
4. 验证 SSE、tool call 与 fallback 行为。
5. 再推广到生产环境。

### 回滚原则

重新部署上一个 Worker 构建即可。当前没有第二条对话路径可供回退。

### 验证示例

```bash
# Worker 健康检查
curl http://localhost:5173/api/health

# 全 workspace 类型检查
pnpm run typecheck

# SPA 与 Worker 本地开发
pnpm run dev:web
```

### 技术栈汇总

- **Supabase：** 鉴权、Postgres、RLS。
- **Cloudflare Workers：** 单 Worker 承载静态资源、`/api/*` 接口、工具注册层、agent loop 与 SSE 运行时。
- **Cloudflare Workers Static Assets：** 前端托管（`web` Worker）。
- **DeepSeek API：** 托管模型推理。
- **Tavily API：** 唯一的检索来源。
