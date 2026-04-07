# IlliniGuide - UIUC知识库

专为UIUC新生打造的知识库，采用零成本架构，支持静态内容分发和AI校园助手。

## 环境配置

Coze配置说明请参见 [docs/CHATFLOW_SETUP.md](docs/CHATFLOW_SETUP.md)。

## 目录结构

```text
app/
|-- docs/
|   `-- diagrams/
|-- functions/
|   `-- api/
|-- public/
|-- scripts/
|   `-- migrations/
|-- src/
|   |-- app/
|   |-- components/
|   |   |-- ui/
|   |   |   `-- branding/
|   |   |-- chat/
|   |   |-- housing/
|   |   |   |-- constants/
|   |   |   |-- dorm-detail/
|   |   |   |   `-- sections/
|   |   |   |-- dorm-list/
|   |   |   |-- dorm-map/
|   |   |   |-- edit-panel/
|   |   |   |-- filter-modal/
|   |   |   |-- hooks/
|   |   |   |-- i18n/
|   |   |   |-- store/
|   |   |   `-- types/
|   |   `-- layout/
|   |-- constants/
|   |-- contexts/
|   |-- data/
|   |   `-- articles/
|   |-- hooks/
|   |-- i18n/
|   |-- pages/
|   |   |-- chat/
|   |   |-- courses/
|   |   |-- dorms/
|   |   |-- library/
|   |   |-- profile/
|   |   `-- resume/
|   |-- legacy/
|   |   |-- auth/
|   |   `-- components/
|   |-- scripts/
|   |-- services/
|   |-- App.tsx
|   |-- constants.ts
|   |-- index.css
|   |-- index.tsx
|   |-- utils/
|   `-- types.ts
`-- tests/
    `-- artifacts/
```

## 架构规范

- `src/App.tsx` 是本项目的唯一应用入口。
- 路由层级的编排逻辑放在 `src/pages/**` 及其页面级 hooks 中。
- `src/components/**` 保持以展示为主，功能内聚。
- `src/components/ui/**` 仅存放与业务无关的通用 UI 组件。
- `src/legacy/**` 存放已废弃的参考代码，活跃的运行时模块不得从此处引入。
- 少量活跃的展示组件可暂时放在 `src/components/` 根目录下，待形成稳定的文档化子树后再迁移。
- 活跃的运行时代码不得从以下保留的废弃边界引入：
  - `src/legacy/**`
  - `src/components/housing/legacy/**`
  - `legacy/projects/**`
- 新增页面须在 `src/app/pageRegistry.ts` 中注册。
- 路由变更须在 `src/app/routes.tsx` 中进行。

参考文档：`docs/FILE_RULES.md`

## 数据库与数据管理

本项目使用 Supabase 作为数据库和存储服务。初始化或更新住宿数据请按以下步骤操作：

1. 创建 `dorms` 表并执行必要的迁移：`scripts/migrations/create_dorms_table.sql` 和 `scripts/migrations/add_categorized_tags.sql`。第二次迁移还会添加管理员编辑器字段（`application_fee`、`dining_nearby_detail`、分类标签字段），可安全地在全新、部分迁移或已迁移的数据库上重复执行。

2. 使用提供的脚本填充数据库（需设置环境变量 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`）：

```bash
npx tsx scripts/seed-dorms-table.ts
```

*该脚本会将本地静态数据与数据库中已有的覆盖数据合并，统一写入 `dorms` 表。*

## 常用命令

```bash
pnpm install      # 安装依赖
pnpm run dev      # 启动开发服务器
pnpm run typecheck  # 类型检查
pnpm run build    # 构建生产环境
```
