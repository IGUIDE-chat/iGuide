# 关于爬虫接入 Source-First 数据模型

## TL;DR

- **不需要重写现有爬虫。**
- 现阶段应把 `raw_crawl.jsonl` 视为接入 source-first 基础模型的**主入口**。
- `uiuc_knowledge_base/**/*.md` 应视为**派生 artifact**，而不是主事实源。
- `crawl_state.json`、`pending_queue.json`、`blacklist.txt` 继续作为爬虫运行状态或 snapshot 元数据存在，不进入核心检索模型。
- **PageRank 不再进入新核心模型。**我们不是搜索引擎，PageRank 不适合作为 AI 助手检索的核心信号。
- `category` 可以暂时保留，但只能作为**弱 metadata 标签**，后续需要 review。
- 当前 `priority` 只是 PageRank 阈值推导出来的字段，**不应继续进入新核心模型**。

---

## 当前状态

当前爬虫链路大致是：

```text
抓取 HTML
-> 提取清洗后的正文
-> 写入 raw_crawl.jsonl
-> 运行 pagerank
-> log_resolver 生成分类 Markdown
-> 可选 AI reorganize
```

其中最重要的事实是：

1. `raw_crawl.jsonl` 是当前最稳定、最接近原始抽取结果的输出。
2. Markdown 目录 `uiuc_knowledge_base/` 是下游整理产物，不是最原始的数据入口。
3. PageRank 只在旧的 `pagerank -> log_resolver -> markdown frontmatter` 这条链路里有用。
4. 现有 AI 助手检索链路并不依赖 crawler 产出的 `pagerank_score` 或 `priority`。

---

## 在 source-first 基础模型下应该如何理解这些输出

在四层 source-first 基础层里，我们建议把现有爬虫输出理解成下面四层：

### 1. source

表示稳定的信息来源定义，例如：

- UIUC Housing 官网
- UIUC Student Affairs News
- UIUC Buildings / Services 页面集合
- 某个官方栏目或子域名

这里关心的是“来源是谁”，不是某一条页面内容。

### 2. source_snapshot

表示某个 source 在某次抓取时刻得到的一次版本。

这里承载：

- 抓取时间
- 抓取状态
- hash / last_crawled 一类状态信息
- 是否过期 / 是否存档 / 是否需要重新验证

### 3. artifact

表示从某次 snapshot 派生出的具体内容载体。

对于现有爬虫，最自然的 artifact 有两类：

- `clean_markdown_jsonl`：来自 `raw_crawl.jsonl.content`
- `clean_markdown_file`：来自 `uiuc_knowledge_base/**/*.md`

如果后面要扩展，也可以再加入：

- `raw_html`
- `normalized_json`
- `object_payload`

但这不是第一阶段必须做的事。

### 4. chunk

表示给检索系统使用的切片。

注意：

> `chunk` 是检索派生物，不是事实源，不应该反过来定义 source 或 artifact 的业务语义。

---

## 旧输出到新模型的映射

| 现有产物 | 在 source-first 基础模型中的定位 | 建议 |
|---|---|---|
| `raw_crawl.jsonl` | 主 artifact 输入锚点 | **保留并作为主入口** |
| `raw_crawl.jsonl.url/title/content/links/timestamp` | artifact + snapshot 基础字段 | **保留** |
| `crawl_state.json` | snapshot/runtime metadata | **保留，但不进检索正文** |
| `pending_queue.json` | crawler runtime state | **保留，但不进入核心模型** |
| `blacklist.txt` | crawler runtime policy/state | **保留，但不进入核心模型** |
| `uiuc_knowledge_base/**/*.md` | derived artifact | **可保留，但降级为派生产物** |
| `pagerank_results.txt` | legacy byproduct | **不再作为新模型核心输入** |
| markdown frontmatter `pagerank_score` | legacy metadata | **不再依赖** |
| markdown frontmatter `priority` | legacy metadata | **不再依赖** |
| `category` | weak metadata label | **保留但降级，后续 review** |

---

## 什么保持不变

以下内容在第一阶段可以尽量不动：

1. **抓取与调度流程不变**
   - 继续抓取 HTML
   - 继续清洗正文
   - 继续写出 JSONL

2. **运行状态文件不变**
   - `crawl_state.json`
   - `pending_queue.json`
   - `blacklist.txt`

3. **Markdown 生成流程可以继续保留**
   - 如果当前团队还有人工检查、调试、目录浏览需求，`uiuc_knowledge_base/**/*.md` 仍然有价值
   - 但在新模型里它不再是“主入口”，只是派生产物

---

## 什么不应该再继续依赖

### 1. 不再依赖 PageRank

原因很简单：

- PageRank 是传统搜索引擎排序信号
- 它适合网页重要性估计，不适合 AI 助手的信息检索与回答质量控制
- 当前 repo 里没有实际下游检索链路依赖 crawler 生成的 `pagerank_score`
- 它目前只被 `log_resolver.cpp` 用来写 Markdown frontmatter

因此：

> 在新模型里，PageRank 应被视为旧流水线遗留物，而不是核心信号。

### 2. 不再依赖当前 `priority`

当前 `priority` 的真实来源非常简单：

- `log_resolver.cpp` 根据 PageRank 阈值生成
- `pr_score > 5.0` -> `high`
- 否则 -> `normal`

所以它不是一个独立、有业务意义的字段，而只是 PageRank 的阉割版本。

当前也没有下游系统真正依赖它。

因此：

> `priority` 不应进入核心 source-first 基础模型。

---

## `category` 的新定位

`category` 和 PageRank / priority 不完全一样，因为它确实还有一些下游用途：

- JSONL/Markdown 导入时会带上 `category`
- API 层的检索工具也有 category filter 概念

但它现在的问题也很明显：

1. 生成方式是 keyword-based heuristic，不稳定。
2. `reorganize_ai.py` 会移动文件目录，但**不会重写 frontmatter category**。
3. 这意味着“文件夹位置”和“frontmatter category”可能漂移。
4. 当前 category 也不是面向新模型设计的标准 taxonomy。

所以更合适的定位是：

> `category` 可以暂时保留，但只能作为弱 metadata 标签，用于辅助筛选、调试和人工 review，不能被当成强语义真相或最终 ontology。

这也意味着后续值得单独 review 两件事：

- category 是否还需要继续由 keyword scoring 生成
- `reorganize_ai.py` 未来是继续做文件夹整理，还是演进成更稳定的语义标注步骤

---

## 建议的最小接入路径

### Phase 1：先接入，不重写爬虫

建议第一阶段只做最小变更：

1. 保持 crawler 现状
2. 以 `raw_crawl.jsonl` 作为主入口
3. 将其映射到：
   - `sources`
   - `source_snapshots`
   - `artifacts(clean_markdown_jsonl)`
   - `chunks`
4. 把 `uiuc_knowledge_base/**/*.md` 当作 derived artifact
5. 不把 PageRank / current priority 纳入新核心模型
6. category 只保留为弱 metadata

### Phase 2：后续可选增强

如果后面确实需要，再考虑：

1. 保留 `raw_html`，让 artifact 层更完整
2. 重做 category 逻辑
3. 让 `reorganize_ai.py` 从“目录整理”升级成“可审计的语义标注”
4. 重新评估 Markdown 是否还需要长期保留

但这些都不是第一阶段的阻塞项。

---

## 对维护者来说，思维上需要切换什么

以前的思维更像：

- 我们在维护一个 corpus
- JSONL 和 Markdown 是最终可检索结果
- PageRank / priority 是内容质量或重要性信号

现在建议切换成：

- 我们在维护一条 **source -> snapshot -> artifact -> chunk** 的数据链路
- `raw_crawl.jsonl` 是主 artifact 输入，不是“临时中间物”
- Markdown 是派生产物，不是唯一真相
- chunk 只是检索派生物
- category 是弱标签，不是稳定 taxonomy
- PageRank 和 current priority 是旧流水线遗留物

---

## 非目标

这份说明**不**打算解决以下问题：

- 最终 category taxonomy 应该长什么样
- object-first 业务（course / housing / location_service / calendar）如何抽取
- Supabase 侧最终排序策略
- chunk 粒度与 hybrid retrieval 细节
- 是否必须立即保存 raw HTML

这份文档只负责一件事：

> 帮维护爬虫的同学理解：现有 crawler 在 source-first 基础模型下应该如何被重新解释，以及哪些旧字段不应再继续作为核心设计前提。

---

## 一句话结论

请优先把 `raw_crawl.jsonl` 维护成稳定、可信的主入口；把 Markdown 当成派生 artifact；把 `crawl_state.json` 等状态文件当成 snapshot/runtime metadata；停止把 PageRank 和当前 `priority` 视为新系统核心字段；`category` 只保留为弱标签并准备后续 review。
