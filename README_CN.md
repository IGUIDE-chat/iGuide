## 中文版本 (Chinese Version)

欢迎来到 IlliniGuide 项目仓库。这是一个专为 UIUC 学生设计的综合知识库和对话式 AI 助手。

### 📂 仓库结构 (Repository Structure)

本仓库分为两个主要目录，将应用程序代码与数据处理脚本分开。

- **`app/`**: 核心 Web 应用程序代码库。包含 React 前端、Cloudflare Pages 函数以及相关文档。
- **`data_collection/`**: 包含用于抓取、清理和汇总 UIUC 相关信息的 Python 脚本和原始数据文件，用于构建知识库。

### 🚀 主应用程序 (`app/`)

主应用程序是一个基于 React 19、TypeScript、Vite 和 Tailwind CSS 构建的现代 Web 应用。它使用 Supabase 作为后端服务，并使用 Cloudflare Pages 进行部署和无服务器函数支持。

#### 快速开始 (Quick Start)

在本地运行应用程序：

1. **进入项目目录：**

   ```bash
   cd app
   ```
2. **安装依赖：**

   ```bash
   pnpm install
   ```
3. **启动开发服务器：**

   ```bash
   pnpm run dev
   ```

   应用现在应该运行在 `http://localhost:5173`。

### 🏗️ 架构与文件组织 (Architecture & File Organization)

**架构图 (Architecture Diagram)**

![架构图](./app/docs/diagrams/architecture_v3.jpg)

我们遵循严格的文件结构以保持代码库的可维护性。所有源代码都位于 `src/` 目录下。

| 目录                         | 描述                                                                     |
|:-----------------------------|:-------------------------------------------------------------------------|
| `src/`                       | **核心应用程序源代码**                                                   |
| &nbsp;&nbsp;├─ `app/`        | 全局应用配置和路由。                                                     |
| &nbsp;&nbsp;├─ `components/` | 可复用的 React UI 组件 (例如 `ChatScreen.tsx`, `Sidebar.tsx`)。          |
| &nbsp;&nbsp;├─ `services/`   | API 客户端和业务逻辑 (例如 `conversationService.ts`, `supabase.ts`)。    |
| &nbsp;&nbsp;├─ `contexts/`   | 全局 React Context 提供者 (例如 `AuthContext.tsx`, `ThemeContext.tsx`)。 |
| &nbsp;&nbsp;├─ `pages/`      | 顶级页面组件 (如果在项目中使用)。                                        |
| &nbsp;&nbsp;├─ `hooks/`      | 自定义 React Hooks。                                                     |
| &nbsp;&nbsp;├─ `utils/`      | 工具函数。                                                               |
| &nbsp;&nbsp;├─ `constants/`  | 常量值和配置。                                                           |
| &nbsp;&nbsp;├─ `i18n/`       | 国际化资源。                                                             |
| &nbsp;&nbsp;├─ `data/`       | 静态数据文件。                                                           |
| &nbsp;&nbsp;└─ `types/`      | TypeScript 类型定义和接口。                                              |
| `functions/`                 | Cloudflare Pages Functions (无服务器后端)。                              |
| `tests/`                     | 自动化测试 (Python/JS)。                                                 |
| `docs/`                      | 详细的项目文档。                                                         |
| `scripts/`                   | 实用程序/维护脚本。                                                      |

### 🛠️ 开发者指南 (Guide for Developers)

#### 如何进行更改

- **UI/组件：** 请查看 `src/components/`。我们使用函数式组件和 Tailwind CSS。
- **业务逻辑：** API 调用和核心逻辑应位于 `src/services/`。
- **全局状态：** 如果你需要访问 Auth 或用户设置，请检查 `src/contexts/`。

#### 规则与最佳实践

1. **严格的 TypeScript：** 不要使用 `any`。为 props 和 state 定义接口。
2. **CSS：** 使用 Tailwind 工具类。避免内联样式。
3. **新文件：** 将新组件放在 `src/components/`，服务放在 `src/services/`。

有关详细的文件规则，请参阅 `app/docs/FILE_RULES.md`（如果有）或严格遵守上述文件夹结构。

### 🗄️ 数据库与数据管理 (Database & Data Management)

该应用程序使用 Supabase 进行数据库和存储。
要初始化或更新宿舍数据：

1. 在 Supabase SQL Editor 中创建 `dorms` 总表并运行必要的迁移：`scripts/migrations/create_dorms_table.sql`
2. 使用提供的脚本填充数据库（需要配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 环境变量）：

   ```bash
   npx tsx scripts/seed-dorms-table.ts
   ```

   *注意：此脚本会将所有本地静态数据与数据库中现有的管理员修改记录智能合并，并推送到统一的 `dorms` 总表中。*

### 📊 数据收集 (`data_collection/`)

用于填充知识库的脚本。

- `get_data.py`: 数据获取的主脚本或入口点。
- `clean_domians.py`: 用于清理和标准化域名数据的工具。
- `*.json` / `*.txt`: 原始和处理后的数据文件。

### 📚 Documentation

详细文档可以在 `app/docs/` 文件夹中找到，包括：

- `CHATFLOW_SETUP.md`: 配置 Coze/Chat 工作流的指南。
- `Setup Guides`: 详细的环境设置指南。
