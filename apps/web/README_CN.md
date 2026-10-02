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
- `scripts/`：宿舍数据库 SQL（`scripts/migrations/*.sql`、`scripts/*.sql`）以及下文的宿舍数据脚本。
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

## 宿舍数据库

在 Supabase SQL 编辑器中手动执行 SQL。宿舍核心表结构，按以下顺序：

1. `scripts/migrations/create_dorms_table.sql`。在全新项目上，请先删掉它的最后一行：它给一张仓库里没有任何
   SQL 创建的 `dorm_overrides` 表加注释，SQL 编辑器会因此回滚整个文件。
2. `scripts/migrations/add_categorized_tags.sql`（可重复执行）
3. `scripts/migrations/add_dorm_address.sql` 和 `scripts/migrations/add_dorm_website.sql`，它们添加
   seed 脚本会写入的 `address`、`address_zh` 和 `website` 列

功能相关 SQL，在核心表结构之后执行：

- `scripts/migrations/create_storage_bucket.sql`：`dorm-images` 存储桶。
- `add_dorm_edit_history.sql`，然后 `fix_dorm_edit_history_rls.sql`；`add_dorm_comments.sql`，然后
  `add_dorm_comment_hidden.sql`；`add_floor_plan_bed_size.sql`；`add_soul_and_memory.sql`（都在
  `scripts/migrations/` 下）。
- `scripts/create_dorm_user_features.sql`：宿舍收藏和浏览记录。

仓库里的 SQL 并不会创建应用用到的所有表。`conversations`、`messages`、`reading_history`、
`user_profiles` 和 `mailing_list` 需要自行创建。`scripts/optimize_rls_policies.sql` 和
`scripts/fix_function_security.sql` 假定其中部分表已存在。已知冲突：`add_categorized_tags.sql` 把
`bathroom_type` 限定为 `communal`、`semi-private` 和 `private`，但 seed 脚本会为四栋宿舍写入
`individual-use`。在该约束修改之前，只用这些 SQL 建出的数据库会导致 seed 失败。

## 宿舍数据脚本

`tsx` 不是依赖项，所以在 `apps/web/` 中用 `pnpm dlx tsx` 运行这些脚本：

```sh
pnpm dlx tsx scripts/validate-dorm-data.ts   # 离线校验内置数据集
pnpm dlx tsx scripts/audit-dorm-media.ts     # 对可疑的媒体 URL 发送 HEAD 请求
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> pnpm dlx tsx scripts/seed-dorms-table.ts
```

seed 脚本从 shell 环境读取这两个变量，不读取 env 文件（PowerShell 中先用 `$env:NAME = "..."`
设置）。`SUPABASE_SERVICE_KEY` 是会绕过 RLS 的 service-role 密钥。seed 脚本按 `id` 把内置的
`UIUC_DORMS` upsert 到 `dorms` 表。它保留已存储的图片、图集和户型图媒体，把标签与已存储的标签合并，
且从不删除行。它不会读取已归档的 `dorm_overrides`。
