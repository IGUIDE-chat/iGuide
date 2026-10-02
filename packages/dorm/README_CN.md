# @iguide/dorm

[English](README.md)

宿舍（住房）功能：列表、地图、详情、对比、评论、收藏和管理员编辑，以及它的数据库 SQL、数据脚本和评论爬虫。
它是一个 workspace 包，宿舍代码、依赖（Mapbox GL、rc-slider、Headless UI）和状态都不会进入应用的其他部分。

## 边界

宿主应用只导入 `src/index.ts` 导出的内容，本包不从宿主导入任何东西。

```tsx
import { configureDormServices, DormRoutes } from "@iguide/dorm"

configureDormServices({ supabase, streamChatResponse }) // 在 DormRoutes 渲染前调用一次

<Route path="/dorms/*" element={<DormRoutes language={language} user={user} requestLogin={requestLogin} layout={layout} />} />
```

- `configureDormServices` 借用宿主的 Supabase 客户端（宿舍查询因此共用同一个登录会话），以及住房助手使用的聊天流。
- `DormRoutes` 负责 `/dorms` 下的一切。宿舍数据、筛选、对比和收藏都挂在它内部，其他页面不会加载宿舍代码，也不会查询宿舍表。
- `layout` 是宿舍 UI 需要操作的那部分宿主外壳：飞心动画的目标 ref 和两个插槽 setter。宿舍侧边栏和宿舍列表的移动端头部通过
  portal 渲染进这些插槽，因此在外壳中渲染时仍能拿到宿舍的 context。

在 `apps/web` 中，唯一接触本包的文件是 `src/pages/dorms/DormRoute.tsx`，由 `/dorms/*` 路由懒加载。

宿主还必须让 Tailwind 扫描本包的源码（`apps/web/src/index.css` 中的 `@source`），并定义组件用到的 `illini-*` 主题色。

## 目录

- `src/`：功能代码。目录结构与它在 `apps/web/src` 时一致，所以移动过来的文件保留了相对导入和 git 历史。
- `scripts/`：宿舍数据库 SQL 和数据脚本。
- `scrapers/`：独立的 Puppeteer/Bun 评论爬虫，不属于 workspace（见其 README）。

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
  `add_dorm_comment_hidden.sql`；`add_floor_plan_bed_size.sql`（都在 `scripts/migrations/` 下）。
- `scripts/create_dorm_user_features.sql`：宿舍收藏和浏览记录。

已知冲突：`add_categorized_tags.sql` 把 `bathroom_type` 限定为 `communal`、`semi-private` 和 `private`，
但 seed 脚本会为四栋宿舍写入 `individual-use`。在该约束修改之前，只用这些 SQL 建出的数据库会导致 seed 失败。

## 宿舍数据脚本

`tsx` 不是依赖项，所以在 `packages/dorm/` 中用 `vp dlx tsx` 运行这些脚本：

```sh
vp dlx tsx scripts/validate-dorm-data.ts   # 离线校验内置数据集
vp dlx tsx scripts/audit-dorm-media.ts     # 对可疑的媒体 URL 发送 HEAD 请求
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-role-key> vp dlx tsx scripts/seed-dorms-table.ts
```

seed 脚本从 shell 环境读取这两个变量，不读取 env 文件（PowerShell 中先用 `$env:NAME = "..."`
设置）。`SUPABASE_SERVICE_KEY` 是会绕过 RLS 的 service-role 密钥。seed 脚本按 `id` 把内置的
`UIUC_DORMS` upsert 到 `dorms` 表。它保留已存储的图片、图集和户型图媒体，把标签与已存储的标签合并，
且从不删除行。它不会读取已归档的 `dorm_overrides`。
