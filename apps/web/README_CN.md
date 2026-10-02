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
- `scripts/`：宿舍数据库 SQL 和宿舍数据脚本。

代码放置规则、重要的环境变量，以及宿舍数据库和 seed 脚本都写在 [AGENTS.md](AGENTS.md) 中。

## 环境配置

先在仓库根目录执行一次 `vp install` 安装整个 workspace，然后在 `apps/web/` 中复制两个环境变量模板；
两个实际文件都已被 Git 忽略。[AGENTS.md](AGENTS.md#environment-and-secrets) 说明了每个模板需要哪些变量。

## 命令（在 `apps/web/` 中运行）

| 命令                                    | 作用                                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| `vp dev`                                | 启动 Vite，Worker 在其后运行。在仓库根目录运行同一条命令也可以。  |
| `vp build`                              | 构建 SPA 和 Worker。                                              |
| `vp exec cf deploy --prebuilt`          | 直接部署已有构建产物，不会重新构建，请先 build。                  |
| `vp build --mode preview`               | 预览构建。需带上 `CLOUDFLARE_PREVIEW_BUILD=true` 运行（见下文）。 |
| `vp exec cf previews deploy --prebuilt` | 部署上面的预览构建。                                              |

`cf previews deploy --prebuilt` 只接受标记为预览构建（Preview build）的构建产物，所以请先运行
`CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview`，或者直接运行不带 `--prebuilt` 的
`vp exec cf previews deploy`，它会带着该标记构建并一步完成部署（[细节](https://developers.cloudflare.com/workers/configuration/previews/)）。

用 `vp lint` 做 lint，用 `vp fmt --check` 只检查格式（`vp fmt` 会直接改写文件）。在仓库根目录，
`vp check` 会运行格式、lint 和类型检查（`vp check --fix` 做同样的检查并自动修复）。
