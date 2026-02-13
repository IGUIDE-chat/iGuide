# IlliniGuide Monorepo

Main repository for UIUC student tools and knowledge products.

## Active Directories

- `illiniguide---uiuc-knowledge-base/` - Main web app (active runtime)
- `api-gateway/` - API gateway and backend integration layer
- `data_collection/` - Crawlers and data processing scripts

## Legacy and Archives

- `illiniguide---uiuc-knowledge-base/legacy/projects/illiniguide---housing-selection/` - Archived historical project (not mounted)
- `illiniguide---uiuc-knowledge-base/src/legacy/` - Archived source modules (not mounted)

## Structure Contract

All directory rules and runtime boundaries are defined in:

- `illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md`

When adding or moving pages in the main app:

1. Update `src/app/pageRegistry.ts`.
2. Keep routing in `src/app/routes.tsx`.
3. Keep structure docs in sync (`README.md` and `docs/FILE_RULES.md`).

## Local Development

```bash
cd illiniguide---uiuc-knowledge-base
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run build
npm run verify:architecture
```

---

# IlliniGuide 仓库说明

这是 UIUC 学生工具与知识库项目的主仓库。

## 当前运行目录

- `illiniguide---uiuc-knowledge-base/`：主应用（运行链路）
- `api-gateway/`：接口网关与后端接入层
- `data_collection/`：数据采集与处理脚本

## 归档目录

- `illiniguide---uiuc-knowledge-base/legacy/projects/illiniguide---housing-selection/`：历史项目归档（不挂载）
- `illiniguide---uiuc-knowledge-base/src/legacy/`：历史源码归档（不挂载）

新增页面时，请同步更新：

1. `src/app/pageRegistry.ts`
2. `src/app/routes.tsx`
3. `docs/FILE_RULES.md`
