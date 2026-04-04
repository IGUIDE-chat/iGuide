# IlliniGuide RepositoryMonorepo

English | [中文](#中文版本-chinese-version)

---

## English Version

Welcome to the IlliniGuide project repository. This project is a comprehensive knowledge base and conversational AI assistant designed for UIUC students.

### 📂 Repository Structure

This repository is structured into two primary directories, separating the application code from data processing scripts.

- **`app/`**: The core web application codebase. This contains the React frontend, Cloudflare Pages functions, and associated documentation.
- **`data_collection/`**: Contains Python scripts and raw data files used for scraping, cleaning, and aggregating UIUC-related information for the knowledge base.

### 🚀 Main Application (`app/`)

The main application is a modern web app built with React 19, TypeScript, Vite, and Tailwind CSS. It uses Supabase for backend services and Cloudflare Pages for deployment and serverless functions.

#### Quick Start

To run the application locally:

1. **Navigate to the project directory:**

   ```bash
   cd app
   ```
2. **Install dependencies:**

   ```bash
   pnpm install
   ```
3. **Start the development server:**

   ```bash
   pnpm run dev
   ```

   The app should now be running at `http://localhost:5173`.

### 🏗️ Architecture & File Organization

**Architecture Diagram**

![Architecture Diagram](./app/docs/diagrams/architecture_v3.jpg)

We follow a strict file structure to keep the codebase maintainable. All source code resides in the `src/` directory.

| Directory                    | Description                                                                    |
|:-----------------------------|:-------------------------------------------------------------------------------|
| `src/`                       | **Core Application Source Code**                                               |
| &nbsp;&nbsp;├─ `app/`        | Global app configuration and routes.                                           |
| &nbsp;&nbsp;├─ `components/` | Reusable React UI components (e.g.,`ChatScreen.tsx`, `Sidebar.tsx`).           |
| &nbsp;&nbsp;├─ `services/`   | API clients and business logic (e.g.,`conversationService.ts`, `supabase.ts`). |
| &nbsp;&nbsp;├─ `contexts/`   | Global React Context providers (e.g.,`AuthContext.tsx`, `ThemeContext.tsx`).   |
| &nbsp;&nbsp;├─ `pages/`      | Top-level page components (if applicable).                                     |
| &nbsp;&nbsp;├─ `hooks/`      | Custom React hooks.                                                            |
| &nbsp;&nbsp;├─ `utils/`      | Utility functions.                                                             |
| &nbsp;&nbsp;├─ `constants/`  | Constant values and configuration.                                             |
| &nbsp;&nbsp;├─ `i18n/`       | Internationalization resources.                                                |
| &nbsp;&nbsp;├─ `data/`       | Static data files.                                                             |
| &nbsp;&nbsp;└─ `types/`      | TypeScript type definitions and interfaces.                                    |
| `functions/`                 | Cloudflare Pages Functions (Serverless backend).                               |
| `tests/`                     | Automated tests (Python/JS).                                                   |
| `docs/`                      | Detailed project documentation.                                                |
| `scripts/`                   | Utility/Maintenance scripts.                                                   |

### 🛠️ Guide for Developers

#### Making Changes

- **UI/Components:** Look into `src/components/`. We use functional components and Tailwind CSS.
- **Business Logic:** API calls and core logic should be in `src/services/`.
- **Global State:** If you need to access Auth or User settings, check `src/contexts/`.

#### Rules & Best Practices

1. **Strict TypeScript:** Do not use `any`. Define interfaces for props and state.
2. **CSS:** Use Tailwind utility classes. Avoid inline styles.
3. **New Files:** Place new components in `src/components/` and services in `src/services/`.

For detailed file rules, refer to `app/docs/FILE_RULES.md` (if available) or strict adherence to the folders above.

### 📊 Data Collection (`data_collection/`)

Scripts for populating the knowledge base.

- `get_data.py`: Main script or entry point for data fetching.
- `clean_domians.py`: Utilities for cleaning and normalizing domain data.
- `*.json` / `*.txt`: Raw and processed data files.

### 📚 Documentation

Detailed documentation can be found in the `app/docs/` folder, including:

- `CHATFLOW_SETUP.md`: Guide for configuring the Coze/Chat workflow.
- `Setup Guides`: Detailed environment setup.

---

## 中文版本 (Chinese Version)

欢迎来到 IlliniGuide 项目仓库。这是一个专为 UIUC 学生设计的综合知识库和对话式 AI 助手。

### 📂 仓库结构 (Repository Structure)

本仓库分为两个主要目录，将应用程序代码与数据处理脚本分开。

- **`app/`**: 核心 Web 应用程序代码库。包含 React 前端、Cloudflare Pages 函数以及相关文档。
- **`data_collection/`**: 包含用于抓取、清理和汇总 UIUC 相关信息的 Python 脚本和原始数据文件，用于构建知识库。

### 🚀 主应用程序 (`app/`)

主应用程序是一个基于 React 19、TypeScript、Vite 和 Tailwind CSS 构建的现代 Web 应用。它使用 Supabase 作为后端服务，并使用 Cloudflare Pages 进行部署和无服务器函数支持。

#### 快速开始 (Quick Start)

在本地运行应用程序：

1. **进入项目目录：**

   ```bash
   cd app
   ```
2. **安装依赖：**

   ```bash
   pnpm install
   ```
3. **启动开发服务器：**

   ```bash
   pnpm run dev
   ```

   应用现在应该运行在 `http://localhost:5173`。

### 🏗️ 架构与文件组织 (Architecture & File Organization)

**架构图 (Architecture Diagram)**

![架构图](./app/docs/diagrams/architecture_v3.jpg)

我们遵循严格的文件结构以保持代码库的可维护性。所有源代码都位于 `src/` 目录下。

| 目录                         | 描述                                                                     |
|:-----------------------------|:-------------------------------------------------------------------------|
| `src/`                       | **核心应用程序源代码**                                                   |
| &nbsp;&nbsp;├─ `app/`        | 全局应用配置和路由。                                                     |
| &nbsp;&nbsp;├─ `components/` | 可复用的 React UI 组件 (例如 `ChatScreen.tsx`, `Sidebar.tsx`)。          |
| &nbsp;&nbsp;├─ `services/`   | API 客户端和业务逻辑 (例如 `conversationService.ts`, `supabase.ts`)。    |
| &nbsp;&nbsp;├─ `contexts/`   | 全局 React Context 提供者 (例如 `AuthContext.tsx`, `ThemeContext.tsx`)。 |
| &nbsp;&nbsp;├─ `pages/`      | 顶级页面组件 (如果在项目中使用)。                                        |
| &nbsp;&nbsp;├─ `hooks/`      | 自定义 React Hooks。                                                     |
| &nbsp;&nbsp;├─ `utils/`      | 工具函数。                                                               |
| &nbsp;&nbsp;├─ `constants/`  | 常量值和配置。                                                           |
| &nbsp;&nbsp;├─ `i18n/`       | 国际化资源。                                                             |
| &nbsp;&nbsp;├─ `data/`       | 静态数据文件。                                                           |
| &nbsp;&nbsp;└─ `types/`      | TypeScript 类型定义和接口。                                              |
| `functions/`                 | Cloudflare Pages Functions (无服务器后端)。                              |
| `tests/`                     | 自动化测试 (Python/JS)。                                                 |
| `docs/`                      | 详细的项目文档。                                                         |
| `scripts/`                   | 实用程序/维护脚本。                                                      |

### 🛠️ 开发者指南 (Guide for Developers)

#### 如何进行更改

- **UI/组件：** 请查看 `src/components/`。我们使用函数式组件和 Tailwind CSS。
- **业务逻辑：** API 调用和核心逻辑应位于 `src/services/`。
- **全局状态：** 如果你需要访问 Auth 或用户设置，请检查 `src/contexts/`。

#### 规则与最佳实践

1. **严格的 TypeScript：** 不要使用 `any`。为 props 和 state 定义接口。
2. **CSS：** 使用 Tailwind 工具类。避免内联样式。
3. **新文件：** 将新组件放在 `src/components/`，服务放在 `src/services/`。

有关详细的文件规则，请参阅 `app/docs/FILE_RULES.md`（如果有）或严格遵守上述文件夹结构。

### 🗄️ 数据库与数据管理 (Database & Data Management)

该应用程序使用 Supabase 进行数据库和存储。
要初始化或更新宿舍数据：

1. 在 Supabase SQL Editor 中创建 `dorms` 总表并运行必要的迁移：`scripts/migrations/create_dorms_table.sql`
2. 使用提供的脚本填充数据库（需要配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 环境变量）：

   ```bash
   npx tsx scripts/seed-dorms-table.ts
   ```

   *注意：此脚本会将所有本地静态数据与数据库中现有的管理员修改记录智能合并，并推送到统一的 `dorms` 总表中。*

### 📊 数据收集 (`data_collection/`)

用于填充知识库的脚本。

- `get_data.py`: 数据获取的主脚本或入口点。
- `clean_domians.py`: 用于清理和标准化域名数据的工具。
- `*.json` / `*.txt`: 原始和处理后的数据文件。

### 📚 Documentation

详细文档可以在 `app/docs/` 文件夹中找到，包括：

- `CHATFLOW_SETUP.md`: 配置 Coze/Chat 工作流的指南。
- `Setup Guides`: 详细的环境设置指南。

---

# UIUC Knowledge Chatbot Architecture Document

## Edge-Core Hybrid RAG Architecture

### 0. One-liner

一个基于 Cloudflare 边缘层 + Supabase 用户数据层 + 芝加哥 VPS 核心智能层 的三层架构 RAG 系统，通过 Geo Split-Brain 路由解决中国访问慢问题，并用 **本地混合检索（FTS + Vector + Rerank）**实现高精度问答，缺失内容时自动触发 Web Fallback。

### 1) System Goals & Constraints

**Goals**

- 全球可用：中国访问不慢、海外体验稳定
- 强安全：统一鉴权、最小暴露面、用户数据隔离
- 低成本：1200 网页日检，但只处理更新的 5%
- 低运维：核心知识库单文件 knowledge.db 可一键备份/迁移
- 低幻觉：通过元数据注入、RLS、Rerank 降低张冠李戴

**Constraints**

- 中国网络环境复杂，需要 CN/Global 双 LLM 端点
- UIUC 数据源本地化访问优势明显（芝加哥/伊州延迟极低）
- 需要前端/爬虫/QA 可拆分协作

### 2) High-Level Architecture (3 Layers)

#### Layer 1 — EDGE LAYER（边缘层 | 蓝色）

**定位：系统前台 + 安全入口 + 全球路由枢纽（Cloudflare）**

- **Cloudflare Workers（Edge Runtime）**
  - 承载边缘逻辑，Serverless，启动快
- **Auth Proxy（JWT Validation）**
  - Worker 首先校验请求头 Token
  - 验证 Token 是否为 Supabase 签发的合法 JWT
  - 通过后才允许访问后续服务
- **Split-Brain Routing（Geo-IP）**
  - 判断用户 IP 地理位置
  - 中国用户 → CN Route
  - 海外用户 → Global Route
- **Argo Smart Routing / Tunnel（回源专线）**
  - Edge ↔ 芝加哥 VPS 之间加密、优化的隧道
  - 目的：降低公网波动导致的回源失败；VPS 不暴露真实 IP
- **Inference Endpoints（推理层路由目标）**
  - SiliconFlow（CN Route）：面向中国用户的 LLM API，速度快、无墙
  - DeepSeek US（Global Route）：海外官方 DeepSeek API，服务全球用户

#### Layer 2 — USER DATA LAYER（用户数据层 | 绿色）

**定位：身份中心 + 系统记忆（Supabase 托管）**

- **Supabase Auth（GoTrue）**
  - 注册/登录、第三方 OAuth（Google/GitHub）、找回密码等
- **PostgreSQL（Chat History）**
  - 存储用户对话历史
- **RLS（Row Level Security）**
  - 行级安全：确保用户只能访问自己的数据（“张三只能看张三”）
- **Async Log（异步写入）**
  - 对话结束后由边缘层或核心层异步写入聊天记录到 Postgres
  - 避免影响主链路延迟

#### Layer 3 — CORE INTELLIGENCE LAYER（核心智能层 | 橙色）

**定位：系统大脑 + 数据工厂（芝加哥 VPS）**

- **Chicago VPS（Vultr 高频）**
  - 全部 Python 核心服务运行于此（建议 FastAPI）
  - 贴近 UIUC 数据源：低延迟爬取（<5ms 的现实可能性）

### 3) Advanced ETL Pipeline（网页 → 知识库）

#### 3.1 Extract（Crawler + MD5 Fingerprint）

**目标：每天检查 1200 网页，只处理真正变化的 ~5%**

- 下载 HTML（httpx）
- 计算 MD5：`md5(html_content)`
- 查询本地元数据库（knowledge.db documents 表）
  - Match（未变）：丢弃（省 CPU / 省后续成本）
  - Mismatch（变更）：标记为“脏数据”，进入 Transform，并更新哈希

#### 3.2 Transform（Smart Cleaning + Semantic Chunking + Metadata Injection）

**目标：把“给浏览器看的 HTML”变成“给 AI 用的高质量知识块”**

- **A) Smart Cleaning（Trafilatura）**
  - 去掉导航栏、版权、侧边栏、广告等噪音
  - 输出干净正文（Markdown/Plain text）
- **B) Markdown Header Splitting**
  - 按 `# / ## / ###` 标题切分，不按字数硬切
  - 让每个 Chunk 对应一个完整语义单元（如“评分标准”整节）
- **C) Metadata Injection（防幻觉关键）**
  - 问题：切片被剥离上下文后，会导致课程混淆（CS440 vs CS225）
  - 做法：每个 chunk 强制前置注入来源信息，例如： `[课程: CS 440 Artificial Intelligence] [来源: syllabus.html] ...`

#### 3.3 Load（Dual-Index Indexing）

**目标：既能精确搜“CS440”，也能语义搜“水课/心理医生”**

- **载体：** `knowledge.db`（SQLite 单文件）
- **索引系统**
  - **Index A — FTS5（关键词猎手）：** 强项是精确匹配（课程号、人名、教室号），防止 CS440 搜成 CS540
  - **Index B — Vector（sqlite-vec + ONNX Embedding）：** 强项是语义匹配（模糊意图/同义表达）

### 4) Local Hybrid Retrieval（本地混合检索：RAG 核心）

#### 4.1 Parallel Search（双路并行召回）

对用户问题同时发起：

- **FTS5 Search（BM25）：** 抓“硬关键词”
- **Vector Search（bge-m3 ONNX embedding + sqlite-vec）：** 抓“语义相关”
- 候选集合通常 50~60 个 chunk。

#### 4.2 Rerank（Cross-Encoder 重排序）

- **模型：** bge-reranker-v2-m3
- Cross-Encoder 会把 “问题 + chunk” 拼接精读打分（0~1）
- 取 Top 5 最相关 chunk 供生成使用

#### 4.3 Web Fallback（Tavily API）

当最高分过低（例如 < 0.4）：

- 判定本地缺资料
- 触发 Tavily 联网搜索
- 抓取并清洗前 3 个网页内容
- 作为额外 Context 注入给 LLM

### 5) Why Chicago VPS Matters（物理与成本优势）

- **物理距离：** 靠近 UIUC 数据源，爬虫延迟低
- **算力本地化：** 清洗/切分/向量化 CPU 密集，放本地跑避免昂贵 API
- **零网络延迟检索：** SQLite 内部完成 FTS + Vector + 原文读取

### 6) Operational Simplicity（knowledge.db 单文件哲学）

- **备份极简：** `cp knowledge.db backup.db`
- **查询极快：** 同进程内 FTS + Vector，无需外部向量库（Pinecone/ES）
- **运维低门槛：** 部署、迁移、回滚都简单

### 7) Tech Stack Summary

- **Supabase:** Auth + Postgres + RLS
- **Cloudflare Workers / Argo Tunnel:** Edge + 安全回源 + 分流
- **Python FastAPI:** 核心后端
- **SQLite 3 + FTS5 + sqlite-vec:** 本地知识库与索引
- **ONNX Runtime:** 本地 embedding / rerank 推理
- **httpx + Trafilatura:** 爬取与正文清洗
- **Tavily API:** 联网兜底
