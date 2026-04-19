# 关于 source-layer 升级到 object-layer，以及 extractor / projector 的分工

## 这份文档想回答什么

在新的双层数据模型里，我们已经基本确定：

- `source-layer` 是底座
- `object-layer` 是在底座之上的高价值结构化投影

因此对爬虫同学真正关键的问题不是“要不要重写 crawler”，而是：

1. source-layer 和 object-layer 到底是什么关系
2. 我们应该默认让 source-layer **升级为** object-layer，还是直接为 object-layer 写专有爬虫
3. 如果走升级路线，`extractor / projector` 分别做什么

这份文档主要就是回答这三个问题。

---

## 先说结论

默认策略应该是：

> **先进入 source-layer，再从 source-layer 升级到 object-layer。**

也就是说：

- 默认不要把 crawler 直接写成“课程爬虫”“宿舍爬虫”“calendar 爬虫”这种 object-first 形态
- 默认应该先把信息接入 `sources -> source_snapshots -> artifacts -> chunks`
- 然后再通过 **extractor / projector** 把一部分高价值、可结构化的信息升级成 object

更短一点说：

> **优先写共享抓取器和共享 source 接入，不优先写 object 专有爬虫。**

这是默认路线，不是绝对规则。后面会讲例外。

---

## 为什么默认不建议写 object 专有爬虫

### 1. 因为 source-layer 才是事实底座

在 A1 模型里，source-layer 负责：

- 来源身份
- 抓取/同步版本
- 原始或规范化内容产物
- 检索切片
- freshness / archive / currentness 语义

这些东西无论最后有没有 object 化，都是系统需要长期保留的事实基础。

如果直接为了 `course`、`housing`、`calendar` 写 object 专有爬虫，通常会发生一件事：

- object 有了
- 但 source 证据链变弱了
- snapshot/version 语义丢了
- 后面想回看原始来源、解释字段冲突、追踪更新时间时会比较麻烦

对校园 AI 助手来说，这种代价通常不值得。

### 2. 因为 object 需求会变，但 source 采集更稳定

今天你可能只想抽：

- `course`
- `academic_calendar_item`
- `location_or_service`

明天又可能想增加：

- 某类 policy object
- 某类 event object
- 某类 housing facet

如果 crawler 一开始就和 object schema 绑死，那么 object 设计一变，crawler 往往也要跟着改。

但如果先沉淀到 source-layer，那么 object 只是上层投影，变化成本会小很多。

### 3. 因为跨学校扩展时，source 差异远大于 object 想象

不同学校的 object 不一致，这件事大家都容易想到。

但实际更大的问题通常是：

- upstream 页面结构差异很大
- 官方信息颗粒度不一样
- 有的学校有 feed / API，有的没有
- 有的学校 calendar 很规范，有的只是公告页面
- 有的服务点在官网有目录，有的只能从地图和零散页面拼

这意味着跨学校时最需要复用的，往往不是“课程专有爬虫”，而是：

- 抓取器
- 清洗器
- source 接入流程
- artifact 规范化流程
- 再往上的 extractor / projector

### 4. 因为长尾信息仍然主要停留在 source-layer

object-layer 只适合高价值、可稳定结构化、对精确索引要求高的业务。

大量信息仍然会长期停留在 source-layer，例如：

- guide
- FAQ
- announcement
- policy update
- narrative 页面
- 解释性文本

如果系统默认思维变成“先为 object 写专有爬虫”，很容易把 source-layer误看成临时中间层。但在这个系统里，source-layer 不是中间层，而是长期保留层。

---

## 更准确的说法：不是 object 专有爬虫，而是 object 专有 projector

如果用一句最值得记住的话来概括，我会建议写成：

> **默认写共享 fetcher / normalizer，再写 domain-specific extractor / projector。**

也就是说，我们更鼓励这三层分工：

### 1. fetcher / crawler
负责：

- 抓页面
- 拉 feed
- 调 API
- 记录抓取状态

这一层的目标是“拿到东西”，不是直接产出 object。

### 2. normalizer / artifact builder
负责：

- 清洗正文
- 生成规范化文本
- 生成结构化 artifact
- 把内容落到 `artifact` 这一层

这一层的目标是“把内容变成可消费的标准输入”。

### 3. extractor / projector
负责：

- 从 artifact 中识别 object candidate
- 抽取字段
- 做 object 粒度上的规范化
- 发布或刷新 object-layer 记录

这一层才真正和 object-first 业务相关。

所以从工程分工看，真正应该 domain-specific 的，往往不是 crawler，而是 **extractor / projector**。

---

## 推荐的数据流

建议维护者优先按下面这条链路理解系统：

```text
source ingest
-> source_snapshot
-> artifacts
-> chunks
-> extractor
-> object candidate
-> canonicalize / resolve
-> object publish
```

这里面最关键的是两步：

### extractor
从 artifact 中提取“可能成为 object 的结构化候选”。

例如：

- 从课程目录 artifact 提取一个 `course` candidate
- 从 academic calendar artifact 提取一个 `academic_calendar_item` candidate
- 从地图/目录 artifact 提取一个 `location_or_service` candidate

### projector
把 candidate 投影成 object-layer 里的正式记录。

这里通常会顺带做：

- 字段填充
- ID/主键规则
- 冲突处理
- canonicalization
- source evidence 绑定

也就是说，projector 更接近“发布 object”的步骤，而不是“从网页抓内容”的步骤。

---

## source-layer 升级为 object-layer，大致怎么做

这里不写太细实现，只给建议性的阶段划分。

### Phase 1：先把内容稳定接入 source-layer

这一步的目标不是立刻产出 object，而是保证：

- source 定义稳定
- snapshot 语义清楚
- artifact 有统一落点
- chunks 能正常用于检索

对 crawler 同学来说，这一步最重要的是：

- 不要为了 object 先把 source 入口做碎
- 优先保证 source 输入和 artifact 质量

### Phase 2：在 artifact 之上增加 extractor

当某个领域确认值得 object-first 化时，再在现有 artifact 之上加 extractor。

这一步的目标是：

- 从 artifact 中识别 object candidate
- 提取必须字段
- 补充 optional searchable facets
- 保留 source/snapshot/artifact 的引用关系

### Phase 3：做 canonicalize / resolve

如果同一个 object 可能来自多个 source，通常需要一个轻量的统一步骤，例如：

- 哪个 source 更权威
- 哪些字段以哪个 source 为准
- 哪些字段可以 merge
- 哪些冲突需要保守处理

这一步不一定要一开始就做得很复杂，但理念上要留出来。

### Phase 4：发布 object-layer

最终 object-layer 记录不应该变成“无根对象”，而应该带着来源关系进入数据库，例如：

- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

这样 future debugging / explainability / refresh 都会容易很多。

---

## 什么情况下可以例外：允许更专门的 source adapter

上面说“不默认写 object 专有爬虫”，不是说任何情况下都不许针对 object 做定制化接入。

有一种例外是合理的：

> **当 upstream 本身已经是高质量、强结构化接口时，可以写更专门的 source adapter。**

例如：

- 官方课程 API
- 官方 calendar feed / ICS
- 高质量 campus map / Google Maps place feed
- 官方 housing structured data

这种情况下，确实可以比“先抓网页再抽取”更直接一些。

但即使如此，我仍然建议遵守一个规则：

> **专门 adapter 依然先进入 source-layer，再进入 object-layer。**

也就是说：

- 可以专门接一个课程 API
- 但它应该成为一种 `source` + `snapshot` + `artifact(normalized_json/object_payload)` 的来源
- 然后再由 projector 发布成 `course` / `course_offering`

而不是直接绕过 source-layer 往 object 表写。

这是为了保住：

- versioning
- evidence
- archive/currentness
- explainability

---

## 对 crawler 维护者来说，最值得接受的职责变化

如果只讲工作边界变化，可以理解成下面这几点：

### 以前更像
- 抓内容
- 整理 corpus
- 产出 Markdown/JSONL 供检索或人工浏览

### 现在更像
- 维护 source ingest 的稳定性
- 维护 snapshot/artifact 的质量
- 为 extractor / projector 提供可信输入
- 必要时提供更结构化的 artifact，而不是直接负责 object 发布

所以 crawler 侧未来最有价值的增强，通常不是“再多做几个 object-specific crawler”，而是：

- 更好的 source 边界定义
- 更稳定的 normalized artifact
- 更完整的 source metadata
- 更明确的 snapshot/version 语义

这些能力会同时服务：

- source-first 检索
- object-first 投影
- freshness / archive 策略
- 后续多学校扩展

---

## 几个典型例子

### 1. `course`

推荐路径不是“直接写课程爬虫，把数据塞进 course 表”，而是：

- 课程目录页面/API 先进入 source-layer
- 形成 artifact
- extractor 提取 `course` / `course_offering` candidate
- projector 发布 object

如果以后某学校有更好的课程 API，也更适合把它当 **专门 source adapter**，而不是直接写 object bypass。

### 2. `academic_calendar_item`

推荐路径也是一样：

- 先接入官方 calendar 页面/feed
- 形成 snapshot + artifact
- 再抽 calendar item candidate
- 再发布单表 `academic_calendar_item`

这能保证时间更新、版本替换、过期状态都还能追溯到 source-layer。

### 3. `location_or_service`

地图和目录类数据也一样。

- Google Maps / 学校目录页 / 服务页
- 先作为 source/artifact
- 再决定哪些内容值得投影成 `location_or_service`

而不是把地图 provider 当成直接 object 数据库。

---

## 一句话原则

如果要把这份文档再压缩成一句话，我建议维护者记住下面这句：

> **默认让 source-layer 升级成 object-layer；默认写共享抓取和标准化流程，再写 domain-specific extractor / projector；只有在 upstream 本身已经高度结构化时，才增加更专门的 source adapter。**

---

## 这份文档的边界

这份文档**不**打算展开以下内容：

- 各个 object 的详细字段设计
- canonicalization / merge rule 的具体算法
- extractor / projector 的具体代码结构
- Supabase 检索层和 RAG 排序细节
- crawler 调度策略的具体改造步骤

这些后续可以由对应负责人继续细化。

这份文档只负责帮助 crawler 维护者统一一件事：

> 我们不是在从 source-layer 过渡到 object-layer 后就抛弃 source-layer；我们是在把 source-layer作为长期底座，再把其中一部分高价值信息升级成 object-layer。
