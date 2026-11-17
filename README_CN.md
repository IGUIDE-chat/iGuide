<p align="center">
  <a href="https://iguide.chat"><img alt="线上：iguide.chat" src="https://img.shields.io/badge/live-iguide.chat-E84A27.svg?style=for-the-badge&labelColor=000000" /></a>
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare%20Workers-F38020.svg?style=for-the-badge&logo=cloudflareworkers&logoColor=white&labelColor=000000" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white&labelColor=000000" />
  <img alt="DeepSeek" src="https://img.shields.io/badge/DeepSeek-4D6BFE.svg?style=for-the-badge&logo=deepseek&logoColor=white&labelColor=000000" />
</p>

<p align="center"><a href="./README.md">English</a> · <b>中文</b></p>

# iGuide

**IlliniGuide** 🌽 是为伊利诺伊大学厄巴纳-香槟分校（UIUC）学生打造的中英双语校园助手，主要面向新生：
[iguide.chat](https://iguide.chat)。流式聊天可以问住宿、课程、公交和校园服务，指南库提供中英双语的校园指南，
宿舍浏览器支持地图、筛选、逐项对比和收藏。React 应用和所有 `/api/*` 路由作为同一个 Cloudflare Worker 发布，
Supabase 负责账号、已保存的聊天和宿舍数据。

聊天 agent 唯一的检索工具是只搜官方 `illinois.edu` 页面的 Tavily 搜索；除此之外，它依靠通用知识作答，并在不确定时明确说明。
每次运行都有上限：最多 3 轮 agent 迭代、5 次工具调用，每次调用 10 秒。搜索本身是这样写的：

```ts
// apps/web/worker/tools/web-search.ts
const response = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    api_key: apiKey,
    query,
    max_results: limit,
    include_domains: ["illinois.edu", "housing.illinois.edu"],
  }),
})
```

无需登录：访客的聊天和收藏保存在浏览器中，登录用户则保存在 Supabase。尚未上线：Courses 和 Resume 是候补名单页面，
宿舍评论处于关闭状态（`SHOW_COMMENTS = false`），Profile 页面上的人设和记忆也传不到模型，因为应用不会给 `/api/chat` 发送 token。

## 快速开始

```bash
vp install
cp apps/web/.env.local.example apps/web/.env.local   # SPA 使用的公开 VITE_ 变量
cp apps/web/.dev.vars.example apps/web/.dev.vars     # Worker secrets，见下文
vp dev                                               # SPA + Worker 同源运行 → http://localhost:5173
```

需要 Node 22.18+ 或 24.11+，以及全局 [`vp`](https://viteplus.dev/guide/install) CLI，它会调用仓库锁定的 pnpm（`pnpm@12.7.0`）；
直接用 `npm install` 不行。在 `.dev.vars` 中填写 `DEEPSEEK_API_KEY`（没有它聊天得不到回答）和 `TAVILY_API_KEY`（没有它每次搜索都会报错），
其他占位符留空；[AGENTS.md](AGENTS.md#secrets) 列出了每个变量的作用。用 `curl http://localhost:5173/api/health` 检查 Worker。

## 测试

| 命令                                                                  | 检查什么                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `vp check --fix`                                                      | Oxfmt、type-aware 的 Oxlint 和类型检查，并自动修复。`vp install` 还会把它装成暂存文件的 pre-commit hook。                 |
| `cd apps/web && node --test "worker/**/*.test.ts" "src/**/*.test.ts"` | Worker 和 SPA 的 `node:test` 测试：agent 循环、工具注册表、MCP、SSE 解析。其中两个 agent 循环文件目前在纯 Node 下会失败。 |
| `vp build`                                                            | `apps/web` 的生产构建。                                                                                                   |

CI 不跑测试：唯一的 workflow [React Doctor](.github/workflows/react-doctor.yml) 只审查涉及 `apps/web` 的 pull request，
而且从不让检查失败。推送前请自己运行这三条命令；细节见 [AGENTS.md](AGENTS.md#verification)。

## 仓库结构

| 路径                                    | 内容                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`apps/web/src/`](apps/web/src)         | React 19 SPA：react-router 7、Tailwind CSS 4、assistant-ui 聊天、Mapbox GL 宿舍地图、supabase-js 负责登录和用户数据。 |
| [`apps/web/worker/`](apps/web/worker)   | Cloudflare Worker `uiuc`：用 Hono 路由 `/api/*`，并承载 tool-use agent、它的工具和技能，以及实验性的 MCP 客户端。     |
| [`apps/web/scripts/`](apps/web/scripts) | 手动运行的脚本，主要服务宿舍表：导入种子、审计媒体、校验数据。                                                        |
| [`packages/dorm/`](packages/dorm)       | `@iguide/dorm`：挂载在 `/api/dorms` 的宿舍 API、共享的宿舍模型、宿舍 SQL 和爬虫。                                     |
| [`packages/ui/`](packages/ui)           | `@iguide/ui`：应用和功能包共用的 UI 基础组件。                                                                        |
| [`apps/auth/`](apps/auth)               | Vite+ 起步模板（`@iguide/auth`），目前没有任何地方使用。                                                              |
| [`tools/vite-bin/`](tools/vite-bin)     | 给 `cf build` 提供一个转发到锁定版本 Vite+ 的 `vite` 可执行文件，构建时不会下载未锁定的 Vite。                        |
| [`tests/fixtures/`](tests/fixtures)     | 已删除的知识库 schema 留下的文件，没有任何代码读取。                                                                  |

## 部署

SPA 和整套 API 都由同一个 Worker 提供，所以它是唯一需要部署的东西，用 `cf` CLI 和
[`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts) 部署。在 `apps/web` 下运行：

| 目标                               | 命令                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [iguide.chat](https://iguide.chat) | `vp exec cf build`，然后 `vp exec cf deploy --prebuilt`                                               |
| 以当前 Git 分支命名的预览          | `CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview`，然后 `vp exec cf previews deploy --prebuilt` |

fork 必须先修改其中锁定的 `accountId`。上线顺序（建表、宿舍 SQL、导入种子、设置 secrets、预览、生产）和回滚命令见
[AGENTS.md](AGENTS.md#deploy)。

## 文档

- [AGENTS.md](AGENTS.md)：仓库规则、命令、secrets、架构、接口访问、验证和部署。
- [apps/web/AGENTS.md](apps/web/AGENTS.md)：React 应用和 Worker，包括仓库 SQL 从未创建的那些表。
- [packages/dorm/AGENTS.md](packages/dorm/AGENTS.md) · [packages/dorm/README_CN.md](packages/dorm/README_CN.md)：
  宿舍包的边界、接口和宿舍数据库。
- [apps/web/worker/tools](apps/web/worker/tools) · [apps/web/worker/skills](apps/web/worker/skills) ·
  [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts)：agent 的工具、技能和提示词。

## 数据库迁移

没有迁移工具。请把 [`packages/dorm/scripts/migrations/`](packages/dorm/scripts/migrations) 中的宿舍 SQL
手动粘贴到 Supabase SQL 编辑器执行，从 `create_dorms_table.sql` 开始。顺序和已知冲突见
[Dorm database](packages/dorm/AGENTS.md#dorm-database)。

## 安全

服务商密钥只放在 Worker secrets 里（本地是 `.dev.vars`），绝不放进 `src` 或 `VITE_` 变量：这两处都是公开的，
只有 Supabase URL、anon key 和 Mapbox token 使用它们。Worker 不持有 service-role key，它转发调用者自己的 token，
由 Supabase RLS 决定每一行能否访问。Worker 没有任何限流，所有访客共用同一个匿名身份。详见 [Endpoint access](AGENTS.md#endpoint-access)。

## 社区

在 [Issues](https://github.com/IGUIDE-chat/iGuide/issues) 中报告 bug 或提出功能需求。欢迎提交 pull request，
AI 辅助的也欢迎，只要 agent 遵守 [AGENTS.md](AGENTS.md)；提交前请先跑一遍[测试](#测试)。

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="贡献者" /></a>
