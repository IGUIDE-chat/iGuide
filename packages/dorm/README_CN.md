# @iguide/dorm

[English](README.md)

宿舍（住房）领域：面向 Worker 的 Hono 接口，覆盖 `dorms`、宿舍评论、收藏和浏览记录这几张表，
外加 SPA 与接口共用的数据模型。它是 workspace 包，因此宿舍数据的读写都在 Worker 里、在 RLS
之下完成，而不在浏览器里。

React UI 在 `apps/web/src/components/housing/`。`@iguide/dorm` 既是 Worker 的运行时依赖，也是
SPA 的运行时依赖：宿舍 UI 从本包导入领域模型和它的归一化函数，Worker 则挂载下面的子应用。
本包不含 React，也不单独部署或构建。

## 边界

宿主只导入 `src/index.ts` 导出的内容，本包不从任何应用导入东西。

```ts
import { createDormApi, asDormSupabase, dormDeps } from "@iguide/dorm"

app.use("/api/dorms/*", async (c, next) => {
  c.set(dormDeps, {
    supabase: asDormSupabase(clientForThisRequest(c.req.raw)),
    resolveIdentity: (request) => resolveIdentity(request, c.env),
  })
  await next()
})
app.route("/api/dorms", createDormApi())
```

- 宿主按请求注入一个转发调用方 `Authorization: Bearer` token 的 Supabase 客户端，以及一个解析
  调用者身份的函数。子应用本身不捕获任何环境变量。
- anon 客户端加 RLS 是唯一权威；这里没有 service-role 通道，Worker 不会因此获得额外的权限。
- 失败统一返回 `{ error, code }`。数据库报错只在 Worker 里记录，不会返回给调用方。

- 访问权限按请求解析，来源是调用方自己的 Supabase 用户文档：宿舍列表、单个宿舍、它的评论和评论统计
  游客可读；`/favorites` 与 `/history` 需要登录（否则 `401`）；编辑历史、宿舍更新、还原、图片上传和
  评论管理需要管理员（未登录 `401`，已登录但不是管理员 `403`），管理员即 `user_metadata.is_admin`
  恰好为 `true`。完整清单见 [AGENTS.md](AGENTS.md)。

`src/index.ts` 同时导出领域模型 —— `src/types.ts` 里的 `Dorm` 类型，以及 `src/utils/` 里的
行与房型归一化 —— 因为 Worker 的写入路径需要它们，而 SPA 直接从这里导入，而不是再复制一份。

## 目录

- `src/worker/`：Hono 子应用和仓储层。
- `src/types.ts` 与 `src/utils/`：领域模型和它的归一化规则，由 Worker 的写入路径和 SPA 共用。
- `test/`：接口测试套件；它注入假的 Supabase，无需联网。
- `scripts/`：宿舍数据库 SQL。
- `scrapers/`：独立的 Puppeteer/Bun 评论爬虫，不属于 workspace（见其 README）。

`src/index.ts` 是全部对外接口 —— 子应用、`asDormSupabase` 与 `dormDeps`、仓储类型，以及上面
那份领域模型。它使用显式的 `.ts` 导入后缀，因此 `node -e 'import("./packages/dorm/src/index.ts")'`
可以在类型擦除下直接加载它，验证每个导出都绑定到真实的运行时值。

数据脚本和它导入的数据集放在一起，位于 `apps/web/scripts/`；运行方式（包括 seed 从 shell 读取的
`SUPABASE_SERVICE_KEY`）见
[apps/web/AGENTS.md](../../apps/web/AGENTS.md#database)。Worker 从不使用这个 key。

## 数据库和数据脚本

SQL 执行顺序、已知冲突和接口清单见 [AGENTS.md](AGENTS.md)。
