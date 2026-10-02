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

## 数据库和数据脚本

SQL 执行顺序、seed 与数据脚本以及已知冲突见 [AGENTS.md](AGENTS.md#dorm-database)。
