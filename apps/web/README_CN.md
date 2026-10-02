# @iguide/web

[English](README.md) | 中文

IlliniGuide（iGuide）网页应用，线上地址 <https://iguide.chat>：一个 React SPA 加一个 Cloudflare
Worker，Worker 负责托管 SPA，并在同源下处理所有 `/api/*` 路由。产品介绍和整体架构见仓库根目录的
[README](../../README_CN.md)。代码放置规则见 [AGENTS.md](AGENTS.md)（本包规则）和根目录的
[AGENTS.md](../../AGENTS.md)（全仓库规则）。

## 包内内容

- `src/`：React SPA。入口 `src/index.tsx`，组合入口 `src/App.tsx`，路由 `src/app/routes.tsx`。
- `worker/`：Worker，入口 `worker/index.ts`，配置在 `cloudflare.config.ts`。它提供 `/api/chat`
  （tool-use 智能体，唯一的检索来源是 Tavily 网页搜索）、各模型服务代理、`/api/health` 和
  `/api/integrations*`。
- `src/pages/dorms/DormRoute.tsx`：唯一接触宿舍功能的文件。功能本身（UI、状态、宿舍 SQL、数据脚本）在
  [`packages/dorm`](../../packages/dorm) 中，在 `/dorms/*` 懒加载。
- `scripts/`：聊天人设和记忆的 SQL（`scripts/migrations/add_soul_and_memory.sql`），以及 RLS 修复脚本
  `scripts/optimize_rls_policies.sql` 和 `scripts/fix_function_security.sql`。
  这里还留着两个已移除的 QMD 知识库的遗留文件，均未被使用：`scripts/qmd-server.mjs`（原
  `/api/search` 路由背后的搜索服务）和 `scripts/generate-handbook-ocr.py`（为 QMD 内容生成 OCR
  文本的脚本）。没有任何地方引用它们。

## 环境配置

先在仓库根目录执行一次 `pnpm install` 安装整个 workspace。然后在 `apps/web/` 中复制两个环境变量模板。
两个实际文件都已被 Git 忽略。

- `.env.local.example` → `.env.local`：由 Vite 构建读取并打包进浏览器端。其中只用到
  `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 和 `VITE_MAPBOX_TOKEN`。
- `.dev.vars.example` → `.dev.vars`：`pnpm run dev` 时 Worker 使用的密钥。`Env` 要求必须有
  `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`。模板把其余的标为可选，但没有 `DEEPSEEK_API_KEY` 时
  `/api/chat` 不会给出回答，网页搜索需要 `TAVILY_API_KEY`。`GOOGLE_API_KEY` 只供没有任何调用方的
  `/api/gemini` 代理使用。生产环境在 `apps/web/` 中用
  `pnpm exec cf workers secrets update <NAME> --worker uiuc` 设置。

## 命令（在 `apps/web/` 中运行）

| 命令                      | 作用                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm run dev`            | `vp dev`：启动 Vite，Worker 在其后运行。根目录等价命令：`pnpm run dev:web`。       |
| `pnpm run build`          | `vp build`：构建 SPA 和 Worker。                                                   |
| `pnpm run deploy`         | `cf deploy --prebuilt`：直接部署已有构建产物，不会重新构建，请先 build。           |
| `pnpm run build:preview`  | `vp build --mode preview`。需带上 `CLOUDFLARE_PREVIEW_BUILD=true` 运行（见下文）。 |
| `pnpm run deploy:preview` | `cf previews deploy --prebuilt`：部署上面的预览构建。                              |

`cf previews deploy --prebuilt` 只接受标记为预览构建（Preview build）的构建产物，而构建只有在环境中
有 `CLOUDFLARE_PREVIEW_BUILD=true` 时才会打上这个标记。否则部署会报错 "Build Output was not created
by a Preview build"。所以请运行 `CLOUDFLARE_PREVIEW_BUILD=true pnpm run build:preview`（PowerShell
中先执行 `$env:CLOUDFLARE_PREVIEW_BUILD = "true"`），或者直接运行不带 `--prebuilt` 的
`pnpm exec cf previews deploy`，它会带着该标记构建并一步完成部署。

用 `pnpm run lint` 做 lint，用 `pnpm exec vp fmt --check` 只检查格式（`fmt` 脚本会直接改写文件）。
在仓库根目录，`pnpm exec vp check` 会运行格式、lint 和类型检查（`pnpm run check` 做同样的检查并自动修复）。

## 数据库

在 Supabase SQL 编辑器中手动执行 SQL。宿舍表、存储桶和种子数据按
[`packages/dorm`](../../packages/dorm/README_CN.md#宿舍数据库) 中的步骤设置，请先执行那条迁移链。

仓库里的 SQL 并不会创建应用用到的所有表。`conversations`、`messages`、`reading_history`、
`user_profiles` 和 `mailing_list` 需要自行创建。然后执行引用了 `conversations` 的
`scripts/migrations/add_soul_and_memory.sql`。`scripts/optimize_rls_policies.sql` 和
`scripts/fix_function_security.sql` 假定其中部分表已存在。
