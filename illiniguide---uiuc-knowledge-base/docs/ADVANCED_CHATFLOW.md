# 🧠 高级 Chatflow 架构设计 (Advanced RAG)

这个工作流实现了：**意图识别 -> 问题优化 -> 混合检索 (知识库+搜索) -> 重排序 -> 深度回答 -> 自动追问**。

## 📊 整体流程图 (Node Graph)

```mermaid
graph TD
    Start[开始] --> Classifier[1. 问题分类器 (LLM)]
    
    Classifier -- complex/ambiguous --> Refiner[2. 问题优化/拆解 (LLM)]
    Classifier -- simple --> Merger{合并路径}
    Refiner --> Merger
    
    Merger --> KB_Retrieval[3. 知识库检索 (Recall & Rerank)]
    Merger --> Web_Search[4. 联网搜索 (Date Enhanced)]
    
    KB_Retrieval --> Context_Process[数据清洗]
    Web_Search --> Context_Process
    
    Context_Process --> Synthesis[5. 最终回答 (LLM)]
    
    Synthesis --> Suggestion[6. 追问生成器 (LLM)]
    
    Suggestion --> End[直接回复]
```

---

## 🛠️ 节点配置详解

### 1. 问题分类器 (Question Classifier)
*   **类型**: `LLM` 节点 或 `问题分类` 节点
*   **功能**: 判断问题复杂度。
*   **Prompt**:
    ```markdown
    分析用户问题 "{{#sys.query#}}"。
    - 如果涉及最新新闻、具体日期、或知识库可能没有的外部信息，输出 "search_needed"。
    - 如果问题模糊或复杂（如"对比A和B"），输出 "complex"。
    - 否则输出 "simple"。
    ```

### 2. 问题优化 (Propose Question)
*   **类型**: `LLM` 节点
*   **功能**: 将复杂问题拆解为更适合检索的关键词。
*   **输入**: 用户原始问题。
*   **输出**: 优化后的查询字符串 (Query String)。
*   **Prompt**: "请将用户的问题转化为更精准的搜索关键词..."

### 3. 知识库检索 (Recall & Ranking)
*   **类型**: `知识库检索` 节点
*   **Input**: 优化后的 Query 或 原始 Query。
*   **设置**:
    *   **检索模式**: `混合检索` (Hybrid) —— 同时使用关键词和向量。
    *   **Rerank 模型 (关键)**: 开启 `Rerank` (重排序)。需要配置 Cohere Rerank 或 BGE Rerank 模型 API。这能大幅提升检索准确率！
    *   **Top K**: 建议设为 5-10。

### 4. 联网搜索 (Search Date Enhanced)
*   **类型**: `工具` 节点 (Tavily Search / Serper)
*   **功能**: 搜索外部信息。
*   **日期增强**:
    *   在 Dify 中，系统会自动注入 `sys.date` 变量。
    *   在传递给搜索工具的 Query 中，加上 `{{#sys.date#}}`。
    *   例如搜索词设为：`{{#sys.query#}} (Current Date: {{#sys.date#}})`。

### 5. 最终回答 (Model Call)
*   **类型**: `LLM` 节点 (DeepSeek)
*   **输入**: `KB_Result` 和 `Search_Result`。
*   **Prompt**:
    ```markdown
    你是一个 UIUC 专家。基于以下上下文回答：
    
    [知识库结果]
    {{#KB_Retrieval.result#}}
    
    [搜索结果]
    {{#Web_Search.text#}}
    
    要求：
    1. 优先引用知识库。
    2. 如果用了搜索结果，请标注。
    3. 必须列出 "Sources" (来源)。
    ```

### 6. 返回结果与追问 (Return & Follow-up)
*   **方案 A (Dify 原生功能)**:
    *   在应用设置里直接开启 **"下一步问题建议" (Suggested Questions)**。这是 UI 级别的，效果最好，不消耗 Workflow Token。
*   **方案 B (节点生成)**:
    *   添加一个 `LLM` 节点，专门生成 JSON 格式的 3 个问题。
    *   拼接到最终回复的末尾。

---

## ⚠️ 关键配置提示

1.  **Rerank (重排序)**: 
    *   这是 "高级检索" 的核心。在 Dify 的 `模型供应商` -> `Rerank` 模型里配置 (推荐 **Cohere** 或 **Jina**)。
    *   如果没有 Rerank，检索精准度会下降很多。

2.  **Date Search**:
    *   一定要利用 `sys.date` 变量。并没有一个专门的 "Date Search" 节点，而是通过 Prompt Engineering把日期传给搜索工具。

按这个架构搭建，你的 AI 助手将达到企业级的水准！🚀
