# IlliniGuide 🌽 — 你的 UIUC 校园向导，中英双语

<p align="center">
  <a href="https://iguide.chat"><img src="https://img.shields.io/badge/live-iguide.chat-E84A27?style=flat-square" alt="在线站点"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.18%2B%20%7C%2024.11%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 22.18+ 或 24.11+"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-12.7.0-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 12.7.0"></a>
</p>

IlliniGuide（iGuide）是为伊利诺伊大学厄巴纳-香槟分校（UIUC）学生打造的校园助手，主要面向新生，已在 [iguide.chat](https://iguide.chat) 上线。你可以在流式聊天里询问住宿、课程、公交或校园服务，阅读中英双语的校园指南库，也可以在地图上浏览宿舍楼并逐项对比。React 应用和所有 `/api/*` 端点作为同一个 Cloudflare Worker 一起发布，Supabase 负责账号、已保存的聊天、收藏和宿舍数据。

**有据可查，不靠猜测。** 聊天 agent 唯一的检索工具是仅限官方 `illinois.edu` 页面的 Tavily 网页搜索；除此之外，它依靠通用知识作答，并在不确定时明确说明。每次运行都有上限（最多 3 轮 agent 迭代、5 次工具调用，每次工具调用 10 秒），服务商密钥永远不会离开 Worker，而且无需登录：访客的聊天和收藏保存在浏览器中，登录用户则改存到 Supabase（登录时不会迁移访客数据）。

[English](README.md) · [网站](https://iguide.chat) · [AGENTS.md](AGENTS.md) · [Issues](https://github.com/IGUIDE-chat/iGuide/issues)

## 功能一览

- **聊天** — 回答以 Markdown 流式输出，附带可折叠的“思考”时间线（为每一步计时）、每次网页搜索对应的卡片以及复制按钮。历史聊天按日期分组显示在侧边栏，可置顶和删除。
- **指南库** — 10 篇指南，分为 6 个类别（住宿、学业、交通、饮食、社交生活、安全与健康），可按标题和标签搜索。登录用户还会有阅读历史。
- **宿舍** — 内置数据集收录 23 栋宿舍楼（19 栋 University Housing，4 栋 Private Certified Housing）。可按区域、类型、价格、床位、卫浴、空调、设施和生活方式搜索、排序与筛选；在标有校园分区和地标的 Mapbox 地图上浏览；最多同时对比 4 栋；收藏宿舍；查看图集和户型图。每个宿舍页面都有一个悬浮的宿舍助手随时答疑。
- **双语** — 每个页面、每篇文章和每个宿舍标签都有英文和简体中文版本。应用默认使用浏览器语言，也可以在侧边栏切换。
- **账号可选** — 通过 Supabase Auth 使用 Google、Microsoft 或邮箱登录。在 Profile 页面可以修改显示名称、AI 人设，以及 AI 对你的记忆。
- **管理员编辑** — 管理员（`user_metadata.is_admin`）可以直接在页面上编辑宿舍内容、标签和照片，并有可供恢复的编辑历史。

尚未上线：**Courses** 和 **Resume** 是附带邮件候补名单的“即将推出”页面；宿舍评论功能已开发但处于关闭状态（`SHOW_COMMENTS = false`）；Profile → Integrations 面板只是 UI 原型。你在 Profile 页面编辑的人设和记忆不会传给模型：应用不会把 Supabase token 发送给 `/api/chat`，所以 agent 会把每次聊天都当作访客处理。记忆目前只单向流动：模型仍会标记它了解到的关于你的信息，应用也会为登录用户保存这些笔记，但没有任何地方会把它们读回来。聊天界面仍可显示最多三个追问建议标签，但 `/api/chat` 已不再让模型生成它们，所以它们很少出现。

## 快速开始

你需要 Node 22.18+ 或 24.11+（`vite-plus` 和 `cf` CLI 都接受的版本），以及全局 `vp` CLI（[安装说明](https://viteplus.dev/guide/install)：`curl -fsSL https://vite.plus | bash`）。本 README 中的命令都通过 `vp` 执行，它会调用仓库在 `packageManager` 中锁定的 pnpm 版本（`pnpm@12.7.0`）。

```bash
git clone https://github.com/IGUIDE-chat/iGuide.git
cd iGuide
vp install
cp apps/web/.env.local.example apps/web/.env.local   # SPA 使用的公开 VITE_ 变量
cp apps/web/.dev.vars.example apps/web/.dev.vars     # 本地运行用的 Worker secrets
```

启动服务器之前，先在 `.dev.vars` 中取消注释并设置 `DEEPSEEK_API_KEY`。DeepSeek 是唯一的模型服务商，虽然模板把这个密钥标为可选，但没有它，聊天就得不到回答。也请在那里设置 `TAVILY_API_KEY`，否则每次网页搜索都会向模型返回错误，模型就只能依靠通用知识作答。`.env.local` 中服务端用的 `DEEPSEEK_API_KEY`、`TAVILY_API_KEY`、`SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 条目不会被仓库中的任何代码读取；Worker 读取的是 `.dev.vars`。其他你没有的值请留空，不要保留占位符：没有 Supabase URL 和 key 时，登录和同步功能关闭，宿舍从内置数据加载；没有 `VITE_MAPBOX_TOKEN` 时，地图会显示一条提示。

```bash
vp dev
```

`vp dev` 会在 Vite 开发服务器后面运行真实的 Worker，因此 SPA 和 `/api/*` 共用同一个 origin，与生产环境一致。在另一个终端里检查 Worker（5173 是 Vite 的默认端口；请以 `vp dev` 打印的 URL 为准）：

```bash
curl http://localhost:5173/api/health
```

## 整体架构

- [`apps/web/src`](apps/web/src) 是 React 19 SPA 外壳：react-router 7、Tailwind CSS 4、负责聊天的 assistant-ui，以及负责鉴权和用户数据的 supabase-js。
- [`packages/dorm`](packages/dorm) 是独立成 workspace 包的宿舍功能：列表、Mapbox GL 地图、详情、对比和评论，以及宿舍 SQL 迁移链、数据脚本和评论爬虫。Web 应用通过一个适配文件在 `/dorms/*` 懒加载它，其他页面不会加载宿舍代码，也不会查询宿舍表。共享的 UI 基础组件在 [`packages/ui`](packages/ui) 中。
- [`apps/web/worker`](apps/web/worker) 是 Cloudflare Worker（名为 `uiuc`）。它负责路由 `/api/*`，其他所有路径都返回 SPA 的静态资源。它还承载 tool-use [agent 循环](apps/web/worker/agent)、配套的[工具](apps/web/worker/tools)和[技能](apps/web/worker/skills)，以及一个面向用户自行注册服务器的实验性 [MCP 客户端](apps/web/worker/mcp)（仅存于内存，暂无 UI）。
- SQL 需要在 Supabase SQL 编辑器中手动执行：先执行 [`packages/dorm/scripts`](packages/dorm/README_CN.md#宿舍数据库) 中的宿舍迁移链（宿舍、编辑历史、照片 bucket、收藏和浏览历史），再执行 [`apps/web/scripts/migrations`](apps/web/scripts/migrations) 中的人设和记忆表。
- [`tools/vite-bin`](tools/vite-bin) 为 `cf build` 提供一个转发到已锁定版本 Vite+ 的 `vite` bin，这样构建时就不会下载未锁定版本的 Vite。

```text
Browser ──same origin──> Worker "uiuc" (apps/web/worker)
                           ├─ /api/chat         基于 DeepSeek 的 tool-use agent，
                           │                    ≤3 轮迭代，≤5 次工具调用
                           │                      ├─ web_search ─> Tavily（仅限 illinois.edu）
                           │                      └─ custom_skills、MCP 工具（实验性）
                           ├─ /api/deepseek     已关闭的评论翻译按钮所用的 DeepSeek 代理
                           ├─ /api/tavily       没有任何客户端调用的 Tavily 代理
                           ├─ /api/gemini       没有任何客户端调用的 Gemini 代理
                           ├─ /api/health, /api/integrations/*
                           ├─ 其他任何 /api/*   返回列出可用端点的 404 JSON
                           └─ 其他所有路径 ─> 静态资源（SPA）
```

`/api/chat` 是唯一的聊天路径：聊天页面和悬浮宿舍助手都向它发送 POST 请求，并读取返回的 SSE 流。问候、致谢和其他闲聊不使用工具。某轮 agent 迭代失败时，它会先用最多一个工具重试一次，然后不使用工具直接作答。

检索无需预先导入任何数据：agent 唯一的来源是提问时进行的 Tavily 搜索。[`tests/fixtures/`](tests/fixtures) 中仍保留着已移除的知识库 schema 留下的 `seed-data.sql` 和 `golden-queries.json`；没有任何代码读取它们。

## 安全

- 所有带 `VITE_` 前缀或通过 Vite `define` 注入的内容都是公开的浏览器数据（[Vite 环境变量](https://vite.dev/guide/env-and-mode)），`apps/web/src` 下的所有内容也一样。在 SPA 中，只有 Supabase URL 和 anon key 以及 Mapbox token 使用这个前缀；绝不要把服务商密钥放进 `src`，也不要放进 `.env.local` 中的 `VITE_` 变量。旧版的 `VITE_DEEPSEEK_API_KEY` 只作为 `/api/deepseek` 的回退（不作用于 `/api/chat`），请改为设置 `DEEPSEEK_API_KEY`。
- 服务商密钥（DeepSeek、Tavily、Google）以及 Worker 使用的 Supabase URL 和 anon key 都属于 Worker secrets。本地放在 `apps/web/.dev.vars` 中；生产环境在 `apps/web` 目录下用 `vp exec cf workers secrets update <NAME> --worker uiuc` 设置（CLI 随后会询问 secret 的类型和值）。Git 会忽略 `.env*` 和 `.dev.vars*`，只有 `.example` 模板纳入版本控制。
- 允许访客使用。`/api/chat` 和 `/api/integrations` 接受不带 token 的请求，但 Bearer token 若被 Supabase 拒绝，会返回 401。所有不带 token 的调用方共用同一个 `anonymous` 身份，因此不带 token 注册的 MCP 服务器会被加载到每一个访客聊天中。目前还没有 `KV` 绑定，所以 MCP 注册表存放在 Worker isolate 的内存里，注册信息不会持久保存。
- `/api/deepseek`、`/api/tavily` 和 `/api/gemini` 完全不做鉴权，会用 Worker 自己的密钥转发任何请求；`/api/deepseek` 会原样转发调用方提供的 `messages`，而 `/api/tavily` 和 `/api/gemini` 会发送 `Access-Control-Allow-Origin: *`，因此任何网站都能调用这两个接口。密钥本身不会暴露，但任何人都能消耗它们的额度。
- Worker 没有对任何端点做限流。
- Supabase RLS 已开启，写入宿舍数据需要 `user_metadata.is_admin`。

## 文档

| 目标                           | 从这里开始                                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 了解仓库规则、命令和数据模型   | [AGENTS.md](AGENTS.md)                                                                                                                                                                 |
| 开发 React 应用或 Worker       | [apps/web/AGENTS.md](apps/web/AGENTS.md)                                                                                                                                               |
| 修改 agent 的提示词或循环      | [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts) · [apps/web/worker/agent](apps/web/worker/agent)                                                          |
| 添加 agent 工具或技能          | [apps/web/worker/tools](apps/web/worker/tools) · [apps/web/worker/skills](apps/web/worker/skills)                                                                                      |
| 配置 secrets 和 Worker         | [apps/web/.dev.vars.example](apps/web/.dev.vars.example) · [apps/web/.env.local.example](apps/web/.env.local.example) · [apps/web/cloudflare.config.ts](apps/web/cloudflare.config.ts) |
| 修改宿舍页面、SQL 或种子数据   | [packages/dorm](packages/dorm/README_CN.md)                                                                                                                                            |
| 查看 pull request 上会运行什么 | [.github/workflows/react-doctor.yml](.github/workflows/react-doctor.yml)                                                                                                               |

## 开发

本仓库是一个由 [Vite+](https://viteplus.dev)（`vp`）驱动的 pnpm workspace，`vp` 是安装、检查、构建和部署的唯一入口：`package.json` 不再为这些命令保留包装脚本，请直接运行下面的 `vp` 内置命令。`pnpm-workspace.yaml` 声明了 [workspace](https://viteplus.dev/guide/monorepo) 和 [catalog](https://pnpm.io/catalogs)，目前对应 `@iguide/web`（`apps/web`）和 `@iguide/vite-bin`（`tools/vite-bin`）两个包，因此不支持直接用 `npm install`。`vp install` 还会装好一个 pre-commit hook，对暂存的文件运行 `vp check --fix`。

```bash
vp dev           # Vite 开发服务器，Worker 运行在其后
vp check --fix   # 格式化、lint 和类型检查，并自动修复
vp fmt           # Oxfmt，直接改写文件
vp lint          # Oxlint，type-aware 且带类型检查
vp build         # apps/web 的生产构建
vp preview       # 在本地运行生产构建
```

仓库里没有 `test` 或 `typecheck` 脚本或任务：类型检查在 `vp check` 中完成；`vp test`（Vitest）在本应用中无法启动，因为 Cloudflare Vite 插件会拒绝 Vitest 的 `ssr` 环境。Worker 和 SPA 的测试是 `node:test` 文件，请在 `apps/web` 下用 Node 运行它们：

```bash
cd apps/web
node --test "worker/**/*.test.ts" "src/**/*.test.ts"
```

其中 `worker/agent/loop.test.ts` 和 `worker/agent/loop.baseline.test.ts` 这两个文件目前在纯 Node 下会失败，因为 agent 循环以文本模块的形式导入它的 `.txt` 提示词；其余文件都能通过。

仓库没有 CI 测试工作流。[React Doctor](https://www.react.doctor/ci) 会审查涉及 `apps/web` 的 pull request 和推送到 `main` 的提交，只报告结果，不会让检查失败（[workflow](.github/workflows/react-doctor.yml)）。推送前请自己运行 `vp check --fix`、上面的测试和 `vp build`。

## 部署

SPA 和整套 API 都由同一个 Worker 提供，所以它是唯一需要部署的东西。它在 [`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts) 中配置，使用 `cf` CLI 部署，而 `cf` 只是 `apps/web` 的开发依赖。该配置锁定了一个 Cloudflare `accountId` 和自定义域名 `iguide.chat`，所以 fork 必须先修改 `accountId` 和 `domains`；`cf` 本身见 [Get started with Workers](https://developers.cloudflare.com/workers/get-started/guide/)。

手动部署：

```bash
cd apps/web
vp exec cf build             # 把 Worker + SPA 静态资源构建为 Build Output
vp exec cf deploy --prebuilt # 部署上面的构建产物，不会重新构建
```

如果想先试一个分支，可以改为部署 Worker Preview：`cf previews deploy` 会以当前 Git 分支为预览命名。`--prebuilt` 只接受标记为 Preview 构建的 Build Output，而 `vp build` 只有在环境中有 `CLOUDFLARE_PREVIEW_BUILD=true` 时才会设置这个标记（在 PowerShell 中，先运行 `$env:CLOUDFLARE_PREVIEW_BUILD = "true"`）；没有它，部署会中止并报错“Build Output was not created by a Preview build”。参见 [preview deployments](https://developers.cloudflare.com/workers/configuration/previews/)：

```bash
cd apps/web
CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview
vp exec cf previews deploy --prebuilt
```

也可以运行 `vp exec cf previews deploy`（不带 `--prebuilt`），它会带着该标记构建，并一步完成部署。

按以下顺序上线：

1. 自己创建 `conversations`、`messages`、`reading_history`、`user_profiles` 和 `mailing_list` 表：仓库中的 SQL 不会创建它们，而 `apps/web/scripts/migrations/add_soul_and_memory.sql` 会引用 `conversations`。从 `create_dorms_table.sql` 开始执行 `packages/dorm/scripts/migrations/` 中的宿舍迁移链，并执行 `packages/dorm/scripts/create_dorm_user_features.sql`（收藏和浏览历史），然后执行 `add_soul_and_memory.sql`。在全新项目上，请先删掉 `create_dorms_table.sql` 的最后一行：它给一张仓库里没有任何 SQL 创建的 `dorm_overrides` 表加注释，这个错误会让 SQL 编辑器回滚整个文件。
2. 为宿舍表导入种子数据。该脚本从 shell 读取 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`，而不是从 `.env` 文件读取。

   ```bash
   cd packages/dorm && vp dlx tsx scripts/seed-dorms-table.ts
   ```

   如果数据库只由仓库中的 SQL 建成，导入种子数据会失败：`add_categorized_tags.sql` 添加的 `chk_bathroom_type` 只允许 `communal`、`semi-private` 和 `private`，但种子脚本会为四栋宿舍写入 `individual-use`，而只要有一行被拒绝，整个 upsert 就会失败。导入前请先放宽这个约束：

   ```sql
   ALTER TABLE public.dorms DROP CONSTRAINT chk_bathroom_type;
   ALTER TABLE public.dorms ADD CONSTRAINT chk_bathroom_type
     CHECK (bathroom_type IN ('communal', 'individual-use', 'semi-private', 'private'));
   ```

3. 设置 Worker secrets。[`worker/types.ts`](apps/web/worker/types.ts) 中的 `Env` 只要求 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`（`ASSETS` 由 Cloudflare 绑定），但聊天需要 `DEEPSEEK_API_KEY`，搜索需要 `TAVILY_API_KEY`。
4. 部署一个预览（见上文），在预览上检查 `/api/health`，并验证流式输出、工具调用和回退行为。
5. 部署到生产环境（先 `vp exec cf build`，再 `vp exec cf deploy --prebuilt`），然后在 `iguide.chat` 上检查 `/api/health`。

**回滚。** 没有第二条聊天路径可供回退，所以要回滚 Worker 本身。无需重新构建、直接把流量指回之前上传过的某个版本（参见 [deployments](https://developers.cloudflare.com/workers/configuration/deployments/)）：

```bash
cd apps/web
vp exec cf workers versions list --worker-id uiuc
vp exec cf workers deployments create --worker uiuc --strategy percentage \
  --versions '[{"version_id":"<last good version id>","percentage":100}]'
```

如果需要重新构建，就 check out 最后一个正常的 commit，然后按上文运行 `vp exec cf build` 和 `vp exec cf deploy --prebuilt`。这样也会重新部署该 commit 的 `cloudflare.config.ts`。

## 社区

在 [GitHub Issues](https://github.com/IGUIDE-chat/iGuide/issues) 中报告 bug 或提出功能需求。欢迎提交 pull request；提交前请先运行 `vp check` 和[开发](#开发)一节中的测试。也欢迎 AI 辅助的 PR，只要 agent 遵守 [AGENTS.md](AGENTS.md)（在 `apps/web` 内还要遵守 [apps/web/AGENTS.md](apps/web/AGENTS.md)）。

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="贡献者"></a>
