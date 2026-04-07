# IlliniGuide 代码仓库

[English](./README.md) | 中文

---

## 中文版本

一个三层架构的 UIUC 知识平台，前端、API 网关和爬虫/ETL 流水线各司其职。

## 仓库结构

| 路径 | 作用 |
|:-----|:-----|
| `app/` | React 应用、Cloudflare Pages 函数、文档、数据迁移，以及主要 UI 运行时。 |
| `api/` | Cloudflare Worker 网关，负责 JWT 鉴权、地理路由、代理转发、CORS 和健康检查。 |
| `data_collection/` | Python 爬虫/ETL 流水线，用于抓取、清洗和增量更新 UIUC 数据源。 |

## 快速开始

### 前端开发

```bash
cd app
pnpm install
pnpm run dev
pnpm run typecheck
```

### Supabase 宿舍数据

在 Supabase 中执行 SQL 迁移文件：

- `scripts/migrations/create_dorms_table.sql`
- `scripts/migrations/add_categorized_tags.sql`

然后初始化或重新同步数据：

```bash
npx tsx scripts/seed-dorms-table.ts
```

需要配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`。

### 爬虫配置

```bash
cd data_collection
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
chmod +x run_all.sh
./run_all.sh
```

### API 网关基础

```bash
cd api
pnpm install
pnpm run dev
curl http://localhost:8787/health
```

网关会校验 Supabase JWT、根据 IP 地理位置路由、通过 Argo Tunnel 代理到后端，并支持 SSE 聊天流式响应。

## API 网关说明

- 通过 Supabase tokens 进行 JWT 鉴权。
- 基于 Geo-IP 区分中国大陆和全球流量进行路由。
- 处理 CORS、健康检查和流式代理。
- 生产环境变量：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`DEEPSEEK_API_KEY`、`SILICONFLOW_API_KEY`、`BACKEND_URL`。

## 代码组织规则

- `src/App.tsx` 是唯一活跃的应用组合入口。
- `src/pages/**` 中只保留轻量的路由编排逻辑。
- 功能组件放在 `src/components/<feature>/**`。
- 通用 UI 组件只放在 `src/components/ui/**`。
- 旧代码隔离在 `src/legacy/**`，运行时请勿从中导入。
- 新页面在 `src/app/pageRegistry.ts` 注册，路由修改在 `src/app/routes.tsx`。

## Dify 工作流配置

1. 先从 `UIUC Campus Guide` 知识库中检索。
2. 如果检索有结果，直接传给 LLM 并作答。
3. 如果检索为空，调用 Tavily 等网络搜索工具，基于实时结果作答。
4. 保持知识库优先的策略，网络搜索仅作为备选方案。

---

## 架构概览

### 一句话概括

Cloudflare 边缘层、Supabase 用户数据层和芝加哥 VPS 智能层协同工作，组成面向 UIUC 内容的低延迟 RAG 系统。

### 三层架构

#### 第一层 — 边缘层

- Cloudflare Workers 处理公网入口。
- 鉴权代理在转发流量前校验 Supabase JWT。
- Geo-IP 路由将中国大陆流量导向 SiliconFlow，全球流量导向 DeepSeek US。
- Argo Tunnel 保护芝加哥 VPS 的私密性，并稳定边缘到核心的请求链路。

#### 第二层 — 用户数据层

- Supabase Auth 负责注册、登录、OAuth 和密码找回。
- PostgreSQL 存储聊天记录。
- RLS（行级安全）确保每个用户只能访问自己的数据。
- 异步日志在主响应完成后写入对话记录。

#### 第三层 — 核心智能层

- 位于芝加哥的 VPS 运行 Python 核心服务，推荐使用 FastAPI。
- 核心层靠近 UIUC 数据源，便于低延迟抓取和本地处理。

### 混合检索流程

#### 抽取

- 用 `httpx` 获取 HTML。
- 用 MD5 计算内容哈希，跳过未变更的页面。
- 文档状态记录在 `knowledge.db` 中。

#### 转换

- 用 Trafilatura 清洗页面内容。
- 按 Markdown 标题拆分内容，而非按原始字符数切割。
- 向每个片段注入源数据，保留课程和页面上下文。

#### 加载

- 知识库存储在 SQLite 中。
- 用 FTS5 实现精确关键词匹配。
- 用 sqlite-vec 结合 ONNX embedding 实现语义检索。

#### 查询

- FTS5 和向量检索并行执行。
- 用 `bge-reranker-v2-m3` 重排候选结果。
- 当最高得分过低时回退到 Tavily。

### 为什么芝加哥 VPS 很重要

- 地理位置靠近 UIUC 数据源，抓取速度快。
- 数据清洗、分块、向量化等 CPU 密集型任务留在本地，避免调用昂贵的 API。
- SQLite 让检索和原文查找在同一进程内完成。

### 运维简洁性

- `knowledge.db` 易于备份和迁移。
- FTS5 + 向量检索与源文本共存，无需额外基础设施。

### 技术栈汇总

- **Supabase：** 鉴权、Postgres、RLS。
- **Cloudflare Workers / Argo Tunnel：** 边缘网关、路由、安全回传。
- **Python FastAPI：** 核心后端服务。
- **SQLite 3 + FTS5 + sqlite-vec：** 本地知识库存储和检索索引。
- **ONNX Runtime：** 本地 embedding 和重排推理。
- **httpx + Trafilatura：** 抓取和清洗。
- **Tavily API：** 网络搜索备选。
