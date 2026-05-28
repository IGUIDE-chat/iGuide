# Team Roles & Assignments / 团队职责与任务分配

This document tracks the responsibilities and assignments for the team.
本文档用于跟踪团队的职责和任务分配。

## 👥 Core Team (核心团队)

| Team Member (团队成员) | Role & Responsibilities (职责与任务) | Note (备注) |
| --- | --- | --- |
| **George** | **Web Crawler / Data Acquisition**<br>负责爬虫 / 数据采集 | **Team Core / 团队核心** |

## 📋 Translation Assignments (翻译任务分配)

| Team Member (团队成员) | Assigned Tasks (分配任务) |
| --- | --- |
| **Amber** & **Weilai** | **Knowledge Base & Course/Dorm Selection Agent**<br>翻译知识库和选课选宿舍 Agent |
| **Xieqinyue** | **Freshman Handbook**<br>翻译新生手册 |
| **Diana** | **Freshman Handbook**<br>翻译新生手册 |

---

## 🚀 Pending Assignments / 待认领任务 (劳动力池)

To claim a task, please add your name to the **Assignee** column.
认领任务请在 **Assignee** 列填上名字。

### A. Frontend (Next.js) - 聊天界面开发

**Context**: Implement a modern, responsive chat interface similar to ChatGPT/Coze.
**Tech Stack**: React 19, Tailwind CSS, Framer Motion.

| Task ID | Task Description (任务描述) | Check | Assignee (认领人) |
| --- | --- | --- | --- |
| **FE-01** | **Chat Bubble Component (气泡组件)**<br>设计美观的对话气泡组件，区分用户(User)和AI样式，支持 Markdown 渲染。 | `[ ]` | |
| **FE-02** | **Streaming Response Handler (流式响应)**<br>前端流式接收后端 SSE 响应，实现平滑输出，避免等待长加载。 | `[ ]` | |
| **FE-03** | **Typewriter Effect (打字机效果)**<br>实现打字机效果（光标闪烁、逐字显示），显著提升交互真实感。 | `[ ]` | |
| **FE-04** | **Code Highlighting (代码高亮)**<br>集成 `react-syntax-highlighter`，支持代码块语法高亮及“一键复制”按钮。 | `[ ]` | |
| **FE-05** | **Agent Card UI (Agent 卡片)**<br>设计“课程卡片”和“宿舍卡片”组件 (Props: GPA, 标题, 图片)，用于 Agent 的结构化结果展示。 | `[ ]` | |
| **FE-06** | **Action Confirmation Modal (行动确认弹窗)**<br>设计一个安全弹窗，显示“AI即将提交以下数据...”，必须用户点击“确认”后才发送请求。 | `[ ]` | |

### B. Crawler Parsers - 数据清洗规则优化

**Context**: Write Python functions to extract clean text from special/messy HTML structures.
**File**: `clean_html_special_case(html) -> text`

| Task ID | Task Description (任务描述) | Check | Assignee (认领人) |
| --- | --- | --- | --- |
| **CR-01** | **Course Catalog Parser (课表解析)**<br>编写针对 UIUC Course Explorer 网页的清洗规则，精准提取课程名、学分、描述。 | `[ ]` | |
| **CR-02** | **Department Page Parser (院系页解析)**<br>编写针对学院/系主页的规则，提取教职员工列表或重要公告区域。 | `[ ]` | |
| **CR-03** | **General Layout Cleaner (通用清洗)**<br>优化通用的“去除导航栏 / Footer / 侧边栏”与广告位的逻辑。 | `[ ]` | |
| **CR-04** | **Structured Data Scraper (结构化爬虫)**<br>编写专门脚本爬取 [GPA 数据集, 宿舍价格表] 并存入 SQLite `courses`/`dorms` 表。 | `[ ]` | |

### C. Prompt & QA - 提示词工程与测试

**Context**: Optimize the System Prompt and ensure RAG quality.

| Task ID | Task Description (任务描述) | Check | Assignee (认领人) |
| --- | --- | --- | --- |
| **QA-01** | **System Prompt A/B Test (提示词测试)**<br>设计 3 版不同的 System Prompt，对比回复质量（语气、准确度、幻觉率）。 | `[ ]` | |
| **QA-02** | **Bad Case Collection (错题集 50题)**<br>收集 50 个容易让 AI 产生幻觉或回答失败的“刁钻问题”，整理成 Excel 反哺优化。 | `[ ]` | |
| **QA-03** | **RAG Retrieval Verification (检索核对)**<br>人工核对 RAG 检索到的 Chunk 是否真正包含回答问题所需的关键事实信息。 | `[ ]` | |
| **QA-04** | **Agent Function Call Testing (工具调用测试)**<br>测试选课/选宿舍 Agent 是否能正确识别意图并调用工具 (准确率需 > 90%)。 | `[ ]` | |

### D. Automation Engineering (Action Agents) - 自动化工程

**Context**: Implement Playwright scripts for form submission.

| Task ID | Task Description (任务描述) | Check | Assignee (认领人) |
| --- | --- | --- | --- |
| **AUTO-01** | **Playwright Env Setup (环境搭建)**<br>在 Docker 或服务器上配置 Headless Browser 环境，确保中文字体正常渲染。 | `[ ]` | |
| **AUTO-02** | **Form Selector Mapping (表单映射)**<br>分析目标网站（如 Housing Interest Form），找出 Input 框的 CSS Selector 或 XPath。 | `[ ]` | |
| **AUTO-03** | **Safety Guardrail Logic (安全护栏)**<br>编写中间件，拦截所有 POST 请求，确保只有在获得用户 Token 授权后才执行提交。 | `[ ]` | |

---

### 📝 Notes (备注)

- **George**: Core infrastructure and data pipeline.
- **Knowledge Base**: The core content for the AI.
- **Freshman Handbook**: The guide for new students.
- **Course/Dorm Selection Agent**: The specific AI modules for sorting courses and housing.
