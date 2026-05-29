# IlliniGuide 代码仓库

[English](./README.md) | 中文

---

## 中文版

这是一个围绕 UIUC 校园信息构建的多模块仓库，主要由前端应用、Cloudflare Worker API 层，以及爬虫 / ETL 流水线组成。

## 仓库结构

| 路径               | 作用                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `app/`             | React 应用、Cloudflare Pages 相关内容、文档、迁移脚本，以及当前活跃的 UI 运行时。         |
| `api/`             | Cloudflare Worker 层，负责 JWT 鉴权、Geo 路由、SSE 响应，以及服务端 tool-use 运行时入口。 |
| `data_collection/` | Python 爬虫 / ETL 流水线，用于抓取、清洗和增量更新 UIUC 数据源。                          |

## 统一开发入口

### 前端开发

```bash
cd app
pnpm install
pnpm run dev
pnpm run typecheck
```

### Supabase 宿舍数据

先在 Supabase 中执行以下 SQL 迁移：

- `scripts/migrations/create_dorms_table.sql`
- `scripts/migrations/add_categorized_tags.sql`

然后执行初始化或重新同步：

```bash
npx tsx scripts/seed-dorms-table.ts
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
cd api
pnpm install
pnpm run dev
curl http://localhost:8787/health
```

这个 Worker 负责校验 Supabase JWT、根据 Geo-IP 执行路由、承载服务端 tool-use 运行时，并输出 SSE 聊天流。

## API Worker 说明

- 使用 Supabase token 做 JWT 鉴权。
- 基于 Geo-IP 区分中国大陆与全球流量。
- 提供 CORS、健康检查和流式 tool-use 响应。
- 生产环境核心变量包括：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DEEPSEEK_API_KEY`
  - `TAVILY_API_KEY`
  - `USE_TOOL_USE_RAG`
  - `EMBEDDING_API_BASE_URL`
  - `EMBEDDING_API_KEY`
  - `EMBEDDING_MODEL`
  - `EMBEDDING_DIMENSIONS`
- `EMBEDDING_FALLBACK_URL` 是可选项，只有在你明确启用自建 embedding fallback 时才需要配置。

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
   - `search_knowledge_base`：调用 Supabase 混合检索
   - `web_search`：调用 Tavily 进行实时网页搜索
   - `grep_docs`：做精确文本匹配
   - `custom_skills`：执行更高层的校园场景技能
4. 知识库检索仍然是默认路径；网页搜索只在本地知识不足时作为补充或回退。
5. 前端 prompt-stuffing 和浏览器侧检索编排属于遗留路径，只应在 feature flag 下保留。

---

## 架构概览

### 一句话概括

这是一个 **serverless-first** 的架构：Cloudflare Worker 负责 agent 运行时与请求控制，Supabase 负责统一的数据与检索层，模型推理、网页搜索和 embedding 由托管 API 提供。

### 运行时分层

#### 第一层：边缘与控制层

- Cloudflare Worker 是公网入口，也是核心控制平面。
- 它负责：JWT 鉴权、限流、SSE 输出、tool-use agent loop，以及 MCP 风格的工具注册层。

#### 第二层：数据与检索层

- Supabase Auth 负责注册、登录、OAuth 和密码找回。
- PostgreSQL 保存聊天记录。
- Supabase pgvector + PostgreSQL 全文检索构成知识库的统一检索能力。
- RLS（行级安全）确保用户只能访问自己的数据。
- 异步日志在主响应完成后写入对话数据。

#### 第三层：外部智能服务层

- DeepSeek 提供托管模型推理。
- Tavily 提供托管网页搜索。
- 托管 embedding API 是 query / document 向量化的默认路径。
- 可选的自建 embedding fallback 可以配置，但**不属于默认生产路径**。

### 混合检索流程

#### Extract（抽取）

- 使用 `httpx` 抓取 HTML。
- 使用 MD5 哈希跳过未变化页面。
- 抓取状态由爬虫流水线维护。

#### Transform（转换）

- 使用 Trafilatura 清洗页面内容。
- 按 Markdown 标题拆分，而不是按原始字符数硬切。
- 给每个 chunk 注入来源元数据，保留课程、页面、宿舍等上下文。

#### Load（入库）

- 知识库存入 Supabase PostgreSQL。
- 使用 pgvector 做语义检索。
- 使用 PostgreSQL 全文检索做精确匹配和关键词检索。
- embedding 维度由 `EMBEDDING_DIMENSIONS` 统一约束。

#### Query（查询）

- 先通过配置好的 embedding provider 生成查询向量。
- 再通过 Supabase RPC 并行执行向量检索和全文检索。
- 使用 RRF 融合结果。
- 模型再决定是否继续调用网页搜索、grep 或自定义技能。

### 为什么强调 Serverless-First

- 默认生产路径不依赖专用 VPS。
- Cloudflare Worker + Supabase 把控制面和数据面都交给托管平台。
- 托管 embedding API 显著降低了运维成本，同时保留足够的检索质量。
- 如果未来在成本或可用性上有特殊需求，仍然可以显式启用自建 fallback，但它不是默认依赖。

### 运维简化带来的收益

- Cloudflare Pages 承载前端。
- Cloudflare Worker 承载 API、工具注册层与 agent loop。
- Supabase 统一承载鉴权、结构化记忆、对话存储、pgvector 与全文检索。
- 模型推理、网页搜索、embedding 全部优先走托管 API，减少自维护基础设施。

## 部署与配置快速参考

### 默认生产拓扑

```text
浏览器 / Cloudflare Pages
  -> Cloudflare Worker
    -> Supabase
    -> DeepSeek API
    -> Tavily API
    -> 托管 Embedding API
```

仅在需要时：

```text
Cloudflare Worker
  -> EMBEDDING_FALLBACK_URL（自建 embedding fallback）
```

### 必要配置

#### 前端 / App

- 前端应直接调用 Cloudflare Worker 的聊天接口。
- 浏览器侧 RAG 编排只应在 `USE_TOOL_USE_RAG=false` 的遗留模式下保留。

#### Cloudflare Worker

必需变量：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`
- `USE_TOOL_USE_RAG`
- `EMBEDDING_API_BASE_URL`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`

可选变量：

- `EMBEDDING_FALLBACK_URL`

#### Supabase

- 启用 `pgvector`。
- 执行检索相关 migrations。
- 在启用新路径前，验证 documents / chunks 表和 RPC 函数是否可用。

### 最小部署流程

1. 先部署 Supabase schema 和 RPC 函数。
2. 配置并验证托管 embedding provider。
3. 先以 `USE_TOOL_USE_RAG=false` 部署 Cloudflare Worker。
4. 将数据导入 Supabase，并验证混合检索结果。
5. 在 staging 中将 `USE_TOOL_USE_RAG=true` 打开。
6. 验证 SSE、tool call、fallback 行为以及 benchmark 质量。
7. 再推广到生产环境。

### 回滚原则

如果新的 tool-use 路径出现回归，直接把 `USE_TOOL_USE_RAG=false` 切回即可。默认回滚目标是旧的前端驱动路径，不应要求依赖 VPS 才能恢复服务。

### 验证示例

```bash
# Worker 健康检查
curl http://localhost:8787/health

# 前端类型检查
cd app && pnpm run typecheck

# Worker 本地开发
cd api && pnpm run dev
```

### 技术栈汇总

- **Supabase：** 鉴权、Postgres、RLS。
- **Supabase pgvector + PostgreSQL 全文检索：** 统一知识检索层。
- **Cloudflare Workers：** 边缘网关、工具注册层、agent loop、SSE 运行时。
- **Cloudflare Pages：** 前端托管。
- **DeepSeek API：** 托管模型推理。
- **托管 Embedding API：** 默认向量生成路径。
- **可选自建 embedding endpoint：** 仅在明确启用时作为 fallback。
- **httpx + Trafilatura：** 抓取与清洗。
- **Tavily API：** 网页搜索补充能力。
