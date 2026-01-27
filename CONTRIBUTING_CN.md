# 贡献给 IlliniGuide

欢迎！很高兴你能来到这里。本文档将帮助你开始为 IlliniGuide 项目做贡献。

## 🚀 快速开始

1.  **克隆仓库：**
    ```bash
    git clone https://github.com/a2751012962/Ask.git
    cd Ask
    ```

2.  **安装依赖：**
    主应用程序代码位于 `illiniguide---uiuc-knowledge-base/` 目录中。
    ```bash
    cd illiniguide---uiuc-knowledge-base
    npm install
    ```

3.  **启动开发服务器：**
    ```bash
    npm run dev
    ```

## 🛠️ 开发工作流

我们使用标准的特性分支 (Feature Branch) 工作流。

1.  **创建分支**：
    始终为你的工作创建一个新分支。不要直接推送到 `main` 分支。
    ```bash
    git checkout -b feature/your-feature-name
    ```
    *(使用前缀，如 `fix/`, `feat/`, `docs/`, `refactor/`)*

2.  **进行更改**：
    - 遵循 `illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md` 中的文件结构规则（如果有）或参考 `README.md`。
    - 组件放入 `src/components`。
    - 服务放入 `src/services`。

3.  **提交**：
    编写清晰、描述性的提交信息。

4.  **推送和拉取请求 (Pull Request)**：
    推送你的分支并在 GitHub 上开启一个 PR。
    ```bash
    git push origin feature/your-feature-name
    ```
    - 请求团队成员进行代码审查。
    - 仅在批准后合并。

## 📋 团队角色与任务

查阅 [TEAM_ROLES.md](./TEAM_ROLES.md) 以查看：
- 每个人的职责。
- "待分配任务 (Pending Assignments)" 池中的可用任务。
- 翻译任务分配。

## ⚠️ 重要规则

- **禁止 `any`**：我们严格使用 TypeScript。
- **Tailwind CSS**：使用工具类进行样式设计。
- **环境变量**：永远不要提交 `.env` 文件。

祝编码愉快！
