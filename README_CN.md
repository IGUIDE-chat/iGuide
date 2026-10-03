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

启动服务器之前，请在 `.dev.vars` 中填写 `DEEPSEEK_API_KEY` 和 `TAVILY_API_KEY`：没有前者聊天就得不到回答，没有后者每次网页搜索都会报错。其他占位符请留空。[AGENTS.md](AGENTS.md#secrets) 列出了每个变量的作用。

```bash
vp dev
```

`vp dev` 会在 Vite 开发服务器后面运行真实的 Worker，因此 SPA 和 `/api/*` 共用同一个 origin，与生产环境一致。在另一个终端里检查 Worker（5173 是 Vite 的默认端口；请以 `vp dev` 打印的 URL 为准）：

```bash
curl http://localhost:5173/api/health
```

## 文档

| 目标                           | 从这里开始                                                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 了解仓库规则、命令和数据模型   | [AGENTS.md](AGENTS.md)                                                                                                                                                                                                 |
| 了解运行时、接口和访问模型     | [AGENTS.md](AGENTS.md#architecture) · [AGENTS.md](AGENTS.md#endpoint-access)                                                                                                                                           |
| 在 React 应用或 Worker 上开发  | [apps/web/AGENTS.md](apps/web/AGENTS.md)                                                                                                                                                                               |
| 修改 agent 的提示词或循环      | [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts) · [apps/web/worker/agent](apps/web/worker/agent)                                                                                          |
| 添加 agent 工具或技能          | [apps/web/worker/tools](apps/web/worker/tools) · [apps/web/worker/skills](apps/web/worker/skills)                                                                                                                      |
| 配置 secrets 和 Worker         | [apps/web/.dev.vars.example](apps/web/.dev.vars.example) · [apps/web/.env.local.example](apps/web/.env.local.example) · [apps/web/cloudflare.config.ts](apps/web/cloudflare.config.ts)                                 |
| 开发宿舍功能                   | [packages/dorm/AGENTS.md](packages/dorm/AGENTS.md) · [packages/dorm/README_CN.md](packages/dorm/README_CN.md) · [apps/web/src/components/housing](apps/web/src/components/housing)                                     |
| 创建宿舍表并导入种子数据       | [packages/dorm/AGENTS.md](packages/dorm/AGENTS.md#dorm-database) · [packages/dorm/scripts/migrations](packages/dorm/scripts/migrations) · [apps/web/scripts/seed-dorms-table.ts](apps/web/scripts/seed-dorms-table.ts) |
| 部署与回滚                     | [AGENTS.md](AGENTS.md#deploy)                                                                                                                                                                                          |
| 查看 pull request 上会运行什么 | [.github/workflows/react-doctor.yml](.github/workflows/react-doctor.yml)                                                                                                                                               |

## 开发

本仓库是一个由 [Vite+](https://viteplus.dev)（`vp`）驱动的 pnpm workspace，`vp` 是安装、检查、构建和部署的唯一入口：`package.json` 不再为这些命令保留包装脚本，请直接运行下面的 `vp` 内置命令。`pnpm-workspace.yaml` 声明了 [workspace](https://viteplus.dev/guide/monorepo) 和 [catalog](https://pnpm.io/catalogs)，目前对应 `@iguide/web`（`apps/web`）、`@iguide/dorm` 与 `@iguide/ui`（`packages/*`）以及 `@iguide/vite-bin`（`tools/vite-bin`），因此不支持直接用 `npm install`。`vp install` 还会装好一个 pre-commit hook，对暂存的文件运行 `vp check --fix`。

```bash
vp dev           # Vite 开发服务器，Worker 运行在其后
vp check --fix   # 格式化、lint 和类型检查，并自动修复
vp fmt           # Oxfmt，直接改写文件
vp lint          # Oxlint，type-aware 且带类型检查
vp build         # apps/web 的生产构建
vp preview       # 在本地运行生产构建
```

仓库里没有 `test` 或 `typecheck` 脚本：类型检查在 `vp check` 中完成。Worker 和 SPA 的测试是 `node:test` 文件，请在 `apps/web` 下运行：

```bash
cd apps/web
node --test "worker/**/*.test.ts" "src/**/*.test.ts"
```

其中两个测试文件目前在纯 Node 下会失败，而且 CI 根本不跑测试；细节见 [AGENTS.md](AGENTS.md#verification)。推送前请自己运行 `vp check --fix`、上面的测试和 `vp build`。

## 部署

SPA 和整套 API 都由同一个 Worker 提供，所以它是唯一需要部署的东西。它在 [`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts) 中配置，使用 `cf` CLI 部署（见 [Get started with Workers](https://developers.cloudflare.com/workers/get-started/guide/)）；fork 必须先修改其中锁定的 `accountId` 和 `domains`。

手动部署：

```bash
cd apps/web
vp exec cf build             # 把 Worker + SPA 静态资源构建为 Build Output
vp exec cf deploy --prebuilt # 部署上面的构建产物，不会重新构建
```

如果想先试一个分支，可以部署以当前 Git 分支命名的 Worker Preview：先运行 `CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview`，再运行 `vp exec cf previews deploy --prebuilt`（[细节](https://developers.cloudflare.com/workers/configuration/previews/)）。

上线顺序（创建仓库 SQL 遗漏的表、执行宿舍迁移链、导入种子、设置 secrets、部署预览，最后上生产）和回滚命令见 [AGENTS.md](AGENTS.md#deploy)。

## 社区

在 [GitHub Issues](https://github.com/IGUIDE-chat/iGuide/issues) 中报告 bug 或提出功能需求。欢迎提交 pull request；提交前请先运行 `vp check` 和[开发](#开发)一节中的测试。也欢迎 AI 辅助的 PR，只要 agent 遵守 [AGENTS.md](AGENTS.md)（在 `apps/web` 内还要遵守 [apps/web/AGENTS.md](apps/web/AGENTS.md)）。

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="贡献者"></a>
