# Architecture Boundaries

## Layers

1. Entry Layer
- `src/index.tsx`
- Mounts providers and router entry only.

2. App Composition Layer
- `src/App.tsx`
- Owns global state composition and top-level providers/layout wiring.

3. Route Layer
- `src/app/routes.tsx`
- Declares routes only.
- No feature business logic should live here.

4. Page Layer
- `src/pages/**`
- Page-level orchestration.
- Uses components/services/context but avoids deep shared mutable logic.

5. Feature/Component Layer
- `src/components/**`
- Reusable UI pieces and feature-specific presentation.

6. Data/Config Layer
- `src/constants/**`, `src/i18n/**`, `src/config/**`, `src/data/**`
- Static config/text/data only.

7. Service Layer
- `src/services/**`
- API and persistence integration.

## Legacy Policy

- Legacy code is stored in `src/legacy/**` and `src/components/housing/legacy/**`.
- Legacy code is not part of runtime flow.
- Active modules must not import from `src/legacy/**`.

## Enforced Checks

- `npm run verify:architecture` checks:
  - no active imports from legacy
  - route and page registry parity
  - single active App/Auth source
  - only one active root Vite config



---

## 中文版本 (Chinese Version)

# 架构边界 (Architecture Boundaries)

## 各层级 (Layers)

1. 入口层 (Entry Layer)
- \src/index.tsx- 仅负责挂载 Providers 和路由入口。

2. 应用组合层 (App Composition Layer)
- \src/App.tsx- 负责全局状态组合及顶层 Provider/布局的连接。

3. 路由层 (Route Layer)
- \src/app/routes.tsx- 仅声明路由。
- 不应包含任何具体功能的业务逻辑。

4. 页面层 (Page Layer)
- \src/pages/**- 页面级别的编排。
- 使用组件/服务/上下文，但避免深层共享的可变逻辑。

5. 功能/组件层 (Feature/Component Layer)
- \src/components/**- 可复用的 UI 组件及特定功能的展示层。

6. 数据/配置层 (Data/Config Layer)
- \src/constants/**\, \src/i18n/**\, \src/config/**\, \src/data/**- 仅包含静态配置、文本和数据。

7. 服务层 (Service Layer)
- \src/services/**- API 接口与持久化集成（包括 Supabase 数​​据库操作）。

## 遗留代码策略 (Legacy Policy)

- 遗留代码存放在 \src/legacy/**\ 和 \src/components/housing/legacy/**\。
- 遗留代码不参与运行时流程。
- 活跃的模块严禁从 \src/legacy/**\ 导入。

## 强制检查 (Enforced Checks)

- pm run verify:architecture\ 会检查：
  - 是否存在对遗留代码的活跃导入
  - 路由和页面注册表的一致性
  - 是否有唯一的 App/Auth 来源
  - 是否只有一个活跃的根 Vite 配置

