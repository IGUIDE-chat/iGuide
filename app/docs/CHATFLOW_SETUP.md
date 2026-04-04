# 🌊 Dify Chatflow Setup Guide | Dify Chatflow 搭建指南

English Summary | [中文版本](#中文版本-chinese-version)

---

## English Summary

This guide maps out the setup of the basic dual-retrieval Chatflow within Dify.

### Architecture Flow:

1. **Knowledge Retrieval**: Searches the `UIUC Campus Guide` knowledge base first.
2. **Condition Branch (If/Else)**: Checks if the knowledge base yielded non-empty results.
   - **True**: Pipes context into an LLM (e.g. DeepSeek-Chat) to formulate the answer directly.
   - **False**: Triggers a web search Tool (like Tavily) using the user's query, pipes results to an LLM, and answers using live web data.

This fallback design minimizes API/Search costs while maximizing the precision of domain-specific documentation.

---

## 中文版本 (Chinese Version)

# 🌊 Dify Chatflow 搭建指南 (知识库 + 联网搜索)

Chatflow 允许你通过拖拽节点来控制 AI 的思考过程。我们的目标是建立这样一个流程：
👉 **用户提问** -> **查知识库** -> **如果有这方面知识?** -> **用知识库回答** -> **没查到?** -> **联网搜索** -> **整合回答**

## 🛠️ 第一步：创建应用

1. 在 Dify 主页点击 **"创建空白应用"**。
2. 类型选择：**Chatflow (工作流编排)**。
3. 名称：`IlliniGuide Pro`。

## 🧩 第二步：编排节点 (只需 4 步)

进入画布后，你会看到 `开始 (Start)` 和 `直接回复 (Answer)`。我们需要在中间加入逻辑。

### 1. 添加 "知识库检索" (Knowledge Retrieval)

- 点击 `开始` 节点右侧的 `+` 号，选择 **"知识库检索"**。
- **设置**:
  - **查询变量**: 选择 `sys.query` (用户的输入)。
  - **知识库**: 点击 `+` 添加你的 `UIUC Campus Guide` 知识库。
  - **召回策略**: 保持默认 (N选1召回)。

### 2. 添加 "条件分支" (If/Else) —— _关键步骤_

- 在 `知识库检索` 后添加一个 **"条件分支"** 节点。
- **目的**: 判断到底有没有查到东西。
- **条件设置**:
  - 点击 `+` 添加条件。
  - 变量选择: `知识库检索` -> `result` (结果)。
  - 操作符: **"不为空" (is not empty)**。
  - 这代表：**"如果知识库里查到了内容"**。

### 3. 分支 A：有知识 (走上方路径)

- 在条件分支的 **"IS TRUE" (真)** 后面添加一个 **"LLM" (大模型)** 节点。
- **模型**: 选择 `deepseek-chat`。
- **提示词 (System Prompt)**:

  ```markdown
  你是一个 UIUC 校园助手。请根据以下检索到的上下文回答用户问题。

  ### 上下文

  {{#context#}}

  ### 用户问题

  {{#query#}}
  ```

- **变量关联**:
  - `context` -> 选择 `知识库检索` 的 `result`。
  - `query` -> 选择 `开始` 的 `sys.query`。

### 4. 分支 B：没知识，去搜索 (走下方路径)

- 在条件分支的 **"IS FALSE" (假)** 后面添加一个 **"工具" (Tool)** 节点。
- **选择工具**: 搜索 `Google` 或 `Tavily` (Dify 内置了很多搜索工具，推荐 Tavily，它是免费且专为 AI 搜索设计的)。
- **输入**: 关联 `sys.query`。
- **搜索后**: 在工具节点后面，再连一个 **"LLM"** 节点。
  - **提示词**: "你是一个 UIUC 助手。知识库里没有相关信息，通过搜索结果回答..."
  - **变量关联**: 把搜索工具的 `text` 结果喂给它。

### 5. 汇总输出

- 最后，把两个 `LLM` 节点的输出，都连接到最后的 **"直接回复" (Answer)** 节点。

---

## 🚀 第三步：配置搜索工具 (API Key)

要使用搜索功能，你需要配置一个搜索服务商：

1. 不需要搜索？如果你只想在知识库没有时告诉用户 "我不知道"，那就不需要搜素工具，直接在 False 分支写死回复即可。
2. **推荐方案**:
   - 注册 [Tavily AI](https://tavily.com/) (有免费额度)。
   - 在 Dify 右上角头像 -> **"工具"** -> **"Tavily"** -> 填入 API Key。

## ✅ 总结

这样你就得到了一个智能系统：

1. **省钱**: 优先查本地库，不消耗搜索额度。
2. **准确**: 优先用学校官方文档。
3. **兜底**: 实在不懂的问题，再去网上海搜，保证有问必答。
