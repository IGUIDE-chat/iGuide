# Project File Organization Rules

This document defines the canonical folder structure for IlliniGuide and keeps the
same structure contract as:

- `Ask/README.md`
- `Ask/illiniguide---uiuc-knowledge-base/README.md`

---

## 1) Repository-Level Scope (Business Directories)

At repository root (`Ask/`), business-facing directories are:

- `api-gateway/`
- `backend/`
- `data_collection/`
- `illiniguide---uiuc-knowledge-base/`
- `qa/`

Do not document or expand tooling-only hidden folders here (for example `.agent/`,
`.claude/`, `.gemini/`) in business structure sections.

---

## 2) Main Application Structure (`illiniguide---uiuc-knowledge-base/`)

Canonical active structure:

```text
illiniguide---uiuc-knowledge-base/
|-- docs/
|   `-- diagrams/
|-- functions/
|   `-- api/
|-- legacy/
|   `-- projects/
|       `-- illiniguide---housing-selection/   [Legacy - Not Mounted]
|-- scripts/
|-- src/
|   |-- app/
|   |-- components/
|   |   `-- housing/
|   |       |-- dorm-detail/
|   |       |   `-- sections/
|   |       |-- dorm-list/
|   |       |-- dorm-map/
|   |       |-- filter-modal/
|   |       |-- i18n/
|   |       `-- legacy/                        [Legacy - Not Mounted]
|   |-- config/
|   |-- constants/
|   |   `-- housing/
|   |-- contexts/
|   |-- data/
|   |   `-- articles/
|   |-- hooks/
|   |-- i18n/
|   |-- legacy/
|   |   |-- components/
|   |   |-- config/
|   |   `-- contexts/
|   |-- pages/
|   |   |-- chat/
|   |   |-- courses/
|   |   |-- dorms/
|   |   |-- library/
|   |   |-- profile/
|   |   `-- resume/
|   |-- services/
|   |-- types/
|   `-- utils/
|-- supabase-migrations/
`-- tests/
```

---

## 3) Directory Contract (Responsibilities)

| Path | Responsibility | Runtime Critical | State |
| :--- | :--- | :--- | :--- |
| `docs/` | Project docs and setup specs. | No | Active |
| `functions/api/` | Cloudflare Pages API handlers. | Yes | Active |
| `scripts/` | Utility and maintenance scripts. | No | Active |
| `src/app/` | Route composition and page registry wiring. | Yes | Active |
| `src/components/` | Shared UI components. | Yes | Active |
| `src/components/housing/legacy/` | Archived housing UI references. | No | Legacy |
| `src/config/` | Runtime/app config modules. | Yes | Active |
| `src/constants/` | Shared constants. | Yes | Active |
| `src/constants/housing/` | Housing constants and datasets. | Yes | Active |
| `src/contexts/` | React context providers. | Yes | Active |
| `src/data/articles/` | Library content source files. | Yes | Active |
| `src/hooks/` | Shared hooks. | Yes | Active |
| `src/i18n/` | i18n texts and config. | Yes | Active |
| `src/legacy/` | Archived code, not mounted at runtime. | No | Legacy |
| `src/pages/` | Route-level pages. | Yes | Active |
| `src/services/` | API/domain service layer. | Yes | Active |
| `src/types/` | Shared TypeScript types/interfaces. | Yes | Active |
| `src/utils/` | Utilities/helpers. | No | Active |
| `supabase-migrations/` | SQL migrations and policy updates. | Yes | Active |
| `tests/` | Test scripts and validation artifacts. | No | Active |
| `legacy/projects/illiniguide---housing-selection/` | Historical prototype archive. | No | Legacy |

---

## 4) Architecture Contracts (Must Follow)

1. **Route source of truth**  
   Define route declarations in `src/app/routes.tsx`.

2. **Page registry source of truth**  
   Register route/page metadata in `src/app/pageRegistry.ts`.

3. **Page registry documentation sync**  
   Keep route docs in sync with `docs/PAGE_REGISTRY.md`.

4. **Legacy boundary**  
   Legacy code must stay under one of:
   - `src/legacy/**`
   - `src/components/housing/legacy/**`
   - `legacy/projects/**`
   
   Active runtime code must not mount or depend on legacy paths.

---

## 5) Exclusions for Structure Docs

Do not include generated/dependency/cache directories in structure documentation:

- `node_modules/`
- `dist/`
- `__pycache__/`

---

## 6) Verification and Update Checklist

For structural changes:

1. Run `npm run verify:architecture`.
2. Run `npm run check:all` before merge.
3. Update all structure docs together:
   - `README.md` (repo root)
   - `illiniguide---uiuc-knowledge-base/README.md`
   - `illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md`
4. Preserve explicit legacy markers:
   - `[Legacy - Not Mounted]`
   - `【历史归档-不参与运行时挂载】` (when using Chinese docs)


---

## 中文版本 (Chinese Version)

# 项目文件组织规则

本文档定义了 IlliniGuide 的规范文件夹结构，并与以下文件保持结构契约：

- \Ask/README.md- \Ask/illiniguide---uiuc-knowledge-base/README.md
---

## 1) 仓库级作用域 (业务目录)

在仓库根目录 (\Ask/\) 下，面向业务的目录有：

- \pi-gateway/- \ackend/- \data_collection/- \illiniguide---uiuc-knowledge-base/- \qa/
请勿在此处的业务结构部分记录或展开仅用于工具的隐藏文件夹（例如 \.agent/\, \.claude/\, \.gemini/\）。

---

## 2) 主应用程序结构 (\illiniguide---uiuc-knowledge-base/\)

规范的活动结构与英文版一致（见上方结构树）。

---

## 3) 目录契约 (职责划分)

| 路径 | 职责 | 运行时关键 | 状态 |
| :--- | :--- | :--- | :--- |
| \docs/\ | 项目文档和设置规范。 | 否 | 活跃 |
| \unctions/api/\ | Cloudflare Pages API 处理程序。 | 是 | 活跃 |
| \scripts/\ | 实用程序和维护脚本。 | 否 | 活跃 |
| \src/app/\ | 路由组合和页面注册表连接。 | 是 | 活跃 |
| \src/components/\ | 共享 UI 组件。 | 是 | 活跃 |
| \src/components/housing/legacy/\ | 归档的房屋 UI 参考。 | 否 | 遗留 |
| \src/config/\ | 运行时/应用配置模块。 | 是 | 活跃 |
| \src/constants/\ | 共享常量。 | 是 | 活跃 |
| \src/constants/housing/\ | 房屋常量和数据集。 | 是 | 活跃 |
| \src/contexts/\ | React context 提供者。 | 是 | 活跃 |
| \src/data/articles/\ | 库内容源文件。 | 是 | 活跃 |
| \src/hooks/\ | 共享 hooks。 | 是 | 活跃 |
| \src/i18n/\ | 国际化文本和配置。 | 是 | 活跃 |
| \src/legacy/\ | 归档代码，不在运行时挂载。 | 否 | 遗留 |
| \src/pages/\ | 路由级页面。 | 是 | 活跃 |
| \src/services/\ | API/领域服务层。 | 是 | 活跃 |
| \src/types/\ | 共享 TypeScript 类型/接口。 | 是 | 活跃 |
| \src/utils/\ | 实用程序/辅助函数。 | 否 | 活跃 |
| \supabase-migrations/\ | SQL 迁移和策略更新。 | 是 | 活跃 |
| \	ests/\ | 测试脚本和验证工件。 | 否 | 活跃 |
| \legacy/projects/illiniguide---housing-selection/\ | 历史原型归档。 | 否 | 遗留 |

---

## 4) 架构契约 (必须遵守)

1. **路由的单一事实来源**  
   在 \src/app/routes.tsx\ 中定义路由声明。

2. **页面注册表的单一事实来源**  
   在 \src/app/pageRegistry.ts\ 中注册路由/页面元数据。

3. **页面注册表文档同步**  
   保持路由文档与 \docs/PAGE_REGISTRY.md\ 同步。

4. **遗留代码边界**  
   遗留代码必须保留在以下路径之一：
   - \src/legacy/**   - \src/components/housing/legacy/**   - \legacy/projects/**   
   活动的运行时代码不得挂载或依赖这些遗留路径。

---

## 5) 结构文档排除项

不要在结构文档中包含生成的/依赖项/缓存目录：

- ode_modules/- \dist/- \__pycache__/
---

## 6) 验证和更新清单

对于结构性更改：

1. 运行 pm run verify:architecture\。
2. 在合并之前运行 pm run check:all\。
3. 一起更新所有结构文档：
   - \README.md\ (仓库根目录)
   - \illiniguide---uiuc-knowledge-base/README.md   - \illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md4. 保留明确的遗留标记：
   - \[Legacy - Not Mounted]   - \【历史归档-不参与运行时挂载】\ (使用中文文档时)
