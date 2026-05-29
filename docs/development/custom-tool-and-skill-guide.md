# 如何新增自定义 Tool Call，并注册对应 Skill

这份文档面向本仓库当前的 **Cloudflare Worker + Tool Registry + JSON Skill** 实现，说明两件事：

1. **如何新增一个可被模型调用的自定义 tool call**
2. **如何为它补一个可复用的 skill，并挂到 `custom_skills` 工具下**

## 一、先理解：Tool 和 Skill 在这里分别是什么

在当前架构里，这两个概念不要混在一起：

### Tool

Tool 是 **模型可以直接调用的函数接口**。

它需要满足这些条件：

- 有唯一的 `name`
- 有给模型看的 `description`
- 有一份 JSON Schema 风格的 `parameters`
- 有真正执行逻辑的 `execute(args, ctx)`

在代码里，tool 的统一接口定义在：

- `gateway/src/tools/types.ts`

核心类型是：

```ts
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (
    args: Record<string, unknown>,
    ctx: RequestContext
  ) => Promise<ToolResult>
}
```

### Skill

Skill 不是一段可执行代码，而是一个**结构化的任务模板**。

它的作用是：

- 把常见高层任务抽象成一个稳定入口
- 约束模型该怎么组织请求
- 告诉系统这个任务依赖哪些底层工具

当前 skill 以 JSON 文件存在于：

- `gateway/src/skills/*.json`

并通过：

- `gateway/src/tools/custom-skills.ts`

统一暴露给模型，模型调用的是 `custom_skills` 这个 tool，而不是直接“执行 JSON”。

## 二、当前注册链路长什么样

当前 Worker 会在聊天入口里创建一个 `ToolRegistry`，然后把所有工具注册进去。

实际位置：

- `gateway/src/index.ts`

当前注册方式：

```ts
const registry = new ToolRegistry()
createSearchKnowledgeBaseTool(registry)
createWebSearchTool(registry)
createGrepDocsTool(registry)
createCustomSkillsTool(registry)
```

也就是说，**新增 tool 的最低要求**是：

1. 写一个新的 tool 文件
2. 导出 `createXxxTool(registry)`
3. 在 `gateway/src/index.ts` 中注册它

如果你还希望这个 tool 能被某些高层任务复用，那么再继续：

1. 写一个新的 skill JSON
2. 在 `gateway/src/tools/custom-skills.ts` 中导入并纳入 skill 列表

## 三、什么时候该新增 Tool，什么时候只需要新增 Skill

先做这个判断，能避免过度设计。

### 适合新增 Tool 的情况

当你要接入一种**新的底层能力**时，应该新增 tool，比如：

- 查新的数据源
- 调新的外部 API
- 新增一种结构化检索方式
- 新增一种模型需要“直接调用”的能力

例子：

- `search_knowledge_base`
- `web_search`
- `grep_docs`

### 适合新增 Skill 的情况

当你不是在增加底层能力，而是在**复用已有工具完成一个更稳定的业务任务**时，通常只需要新增 skill。

例子：

- 比较两个宿舍
- 按条件筛选宿舍
- 生成校园导航查询

这些都不是新底层能力，而是对现有 tool 的组织与约束。

### 简单判断原则

- **新增能力** → 新增 tool
- **复用能力** → 新增 skill

## 四、如何新增一个自定义 Tool Call

下面用一个假设例子来说明：新增一个 `search_deadlines` 工具，用来查询重要日期或截止时间。

### 第 1 步：新增 tool 文件

建议放在：

- `gateway/src/tools/search-deadlines.ts`

结构建议和现有工具保持一致，参考：

- `gateway/src/tools/search-knowledge-base.ts`
- `gateway/src/tools/web-search.ts`
- `gateway/src/tools/grep-docs.ts`

基础模板可以是：

```ts
import { ToolRegistry } from "./registry"
import type { RequestContext, ToolDefinition, ToolResult } from "./types"

interface SearchDeadlinesArgs {
  query: string
  limit?: number
}

function parseArgs(
  args: Record<string, unknown>
): SearchDeadlinesArgs | ToolResult {
  const { query, limit } = args

  if (typeof query !== "string" || query.trim().length === 0) {
    return {
      content: JSON.stringify({
        error: "invalid_query",
        message: "query must be a non-empty string",
      }),
      metadata: { error: true },
    }
  }

  return {
    query: query.trim(),
    limit:
      typeof limit === "number"
        ? Math.min(Math.max(Math.floor(limit), 1), 10)
        : 5,
  }
}

export function createSearchDeadlinesTool(
  registry: ToolRegistry
): ToolDefinition {
  const tool: ToolDefinition = {
    name: "search_deadlines",
    description:
      "Search important deadlines, dates, and time-sensitive campus milestones.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Deadline-related query",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results",
          default: 5,
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["query"],
    },
    execute: async (
      args: Record<string, unknown>,
      ctx: RequestContext
    ): Promise<ToolResult> => {
      const parsed = parseArgs(args)
      if ("content" in parsed) {
        return parsed
      }

      const { query, limit } = parsed

      // TODO: 在这里接入真实的数据源或检索逻辑
      return {
        content: JSON.stringify(
          {
            query,
            limit,
            results: [],
          },
          null,
          2
        ),
      }
    },
  }

  registry.register(tool)
  return tool
}
```

### 第 2 步：遵守当前 Tool Registry 的约束

`gateway/src/tools/registry.ts` 已经定义了统一运行时行为。新增 tool 时要主动适配这些约束：

- 默认最多 **5 次调用**
- 单次工具超时 **10 秒**
- 返回内容最大 **4096 bytes**
- 重名注册会直接抛错
- 工具错误建议以结构化 JSON 文本返回

因此你写 tool 时要注意：

1. `content` 最好是结构化、可读的文本或 JSON 字符串
2. 参数校验不要依赖模型“总会传对”
3. 错误尽量用稳定字段，比如：

```json
{
  "error": "invalid_query",
  "message": "query must be a non-empty string"
}
```

而不是只返回一句模糊的英文报错。

### 第 3 步：在 Worker 入口注册新工具

修改：

- `gateway/src/index.ts`

先导入：

```ts
import { createSearchDeadlinesTool } from "./tools/search-deadlines"
```

再注册：

```ts
const registry = new ToolRegistry()
createSearchKnowledgeBaseTool(registry)
createWebSearchTool(registry)
createGrepDocsTool(registry)
createSearchDeadlinesTool(registry)
createCustomSkillsTool(registry)
```

建议把注册顺序按“基础工具在前，高层工具在后”来保持清晰。

### 第 4 步：确认模型能看到这个工具

模型实际看到的是 `ToolRegistry.toOpenAITools()` 转出来的 OpenAI-compatible tool schema。

所以你要重点检查：

- `name` 是否清晰、稳定
- `description` 是否让模型知道**什么时候该用它**
- `parameters` 是否足够明确

这是工具被“正确调用”的关键，不是装饰。

一个差的 `description` 会让模型根本想不到要用它。

## 五、如何为这个 Tool 注册对应 Skill

新增 tool 后，如果你希望模型能通过一个更高层、更稳定的入口来使用它，就继续新增 skill。

比如你新增了 `search_deadlines` 这个 tool，那么可以再补一个 skill：

- `deadline_lookup`

作用是把“帮我查学校某类截止时间”这种任务包装成固定模式。

### 第 1 步：新增 skill JSON

放到：

- `gateway/src/skills/deadline_lookup.json`

参考当前已有的：

- `gateway/src/skills/compare_dorms.json`
- `gateway/src/skills/find_by_criteria.json`
- `gateway/src/skills/campus_navigation.json`

示例：

```json
{
  "id": "deadline_lookup",
  "name": "Deadline Lookup",
  "description": "Find important campus deadlines for a given topic",
  "prompt_template": "Find the most important deadlines related to {{topic}}. Include date, scope, and source.",
  "required_tools": ["search_deadlines"],
  "output_format": "deadline_list",
  "parameters": {
    "topic": {
      "type": "string",
      "description": "The topic to search deadlines for",
      "required": true
    }
  }
}
```

### 第 2 步：在 `custom-skills.ts` 中导入并注册

修改：

- `gateway/src/tools/custom-skills.ts`

先导入：

```ts
import deadlineLookupSkill from "../skills/deadline_lookup.json"
```

再加入 `SKILL_CONFIGS`：

```ts
const SKILL_CONFIGS: SkillConfig[] = [
  parseSkillConfig(compareDormsSkill),
  parseSkillConfig(findByCriteriaSkill),
  parseSkillConfig(campusNavigationSkill),
  parseSkillConfig(deadlineLookupSkill),
]
```

这样它就会自动进入：

- `SKILL_MAP`
- `available_skills`
- `custom_skills` tool 的执行路径

### 第 3 步：理解 skill 实际上返回了什么

当前 `custom_skills` 工具不会直接执行你的业务逻辑，它做的是：

1. 验证 `skill_id`
2. 验证参数
3. 展开 `prompt_template`
4. 返回一段结构化 JSON，包括：

- `skill_id`
- `name`
- `description`
- `expanded_prompt`
- `tool_sequence`
- `output_format`
- `parameters`

也就是说，skill 的价值在于：

- 提供稳定任务入口
- 告诉模型建议用哪些工具
- 限制输出形式

它本身不是独立的底层执行器。

## 六、推荐的开发顺序

为了减少返工，建议按这个顺序做：

### 情况 A：你需要一个新底层能力

顺序是：

1. 先新增 tool
2. 在 `gateway/src/index.ts` 注册
3. 本地验证它能被 registry 正常执行
4. 再决定是否需要 skill 封装

### 情况 B：你只是想把已有工具包装成一个更稳定的用户任务

顺序是：

1. 直接新增 skill JSON
2. 导入到 `gateway/src/tools/custom-skills.ts`
3. 验证 `custom_skills` 能识别这个新 `skill_id`

不要反过来：

- 明明只是组合已有工具，却先发明一个多余的新 tool

这样会让系统越来越重。

## 七、参数设计建议

### Tool 参数设计

Tool 的参数是给模型直接看的，所以要：

- 简洁
- 明确
- 边界稳定

建议：

- 参数名使用业务含义，不要过度技术化
- `description` 明确说明这个参数的用途
- 对枚举值用 `enum`
- 对数量限制给 `minimum` / `maximum`

### Skill 参数设计

Skill 参数主要服务于模板展开，所以要：

- 只保留高层业务参数
- 不要把底层检索细节暴露给 skill 调用者

例如：

- 好：`topic`, `dorm_names`, `destination`
- 差：`embedding_model`, `rpc_name`, `timeout_ms`

## 八、常见错误

### 1. 注册了 tool，但忘了在 `index.ts` 挂进去

结果：

- 文件存在
- 但模型永远看不到这个 tool

### 2. 新增了 skill JSON，但忘了在 `custom-skills.ts` 导入

结果：

- JSON 文件存在
- 但 `SKILL_MAP` 里没有它
- 最终会触发 `Unknown skill`

### 3. `required_tools` 写了不存在的 tool 名称

结果：

- skill 可以被识别
- 但模型收到的 tool sequence 不可执行或不可达

### 4. `description` 写得太泛

结果：

- 模型很难知道什么时候该用这个工具

### 5. 错误返回不结构化

结果：

- agent loop 难以稳定处理
- fallback 和调试都更痛苦

## 九、最小检查清单

新增 **tool** 后，至少检查：

- [ ] 文件已放入 `gateway/src/tools/`
- [ ] 导出 `createXxxTool(registry)`
- [ ] 使用 `ToolDefinition` 接口
- [ ] `name` / `description` / `parameters` 已定义
- [ ] `execute()` 有参数校验
- [ ] 在 `gateway/src/index.ts` 中注册
- [ ] 返回内容不会轻易超出 registry 的大小限制

新增 **skill** 后，至少检查：

- [ ] JSON 文件已放入 `gateway/src/skills/`
- [ ] `id` 唯一
- [ ] `required_tools` 指向真实已注册工具
- [ ] `parameters` 类型和必填约束正确
- [ ] 已在 `gateway/src/tools/custom-skills.ts` 导入
- [ ] 已加入 `SKILL_CONFIGS`

## 十、推荐验证方式

### 验证 tool 是否注册成功

最直接的方法是临时打印或断点检查 `registry.getTools()`，确认新工具名称出现。

你也可以验证模型侧是否能收到对应 schema。

### 验证 skill 是否注册成功

调用 `custom_skills` 时传入新 `skill_id`，预期应返回展开后的结构化结果，而不是：

```json
{
  "error": "Unknown skill"
}
```

### 验证 skill 和 tool 是否协同正常

重点看两件事：

1. `required_tools` 里列出的工具名是否真实存在
2. `expanded_prompt` 是否足够清晰，能驱动模型进入正确的工具调用路径

## 十一、推荐放置规则

如果你未来继续扩展，建议保持下面这个约定：

- 新底层能力 → `gateway/src/tools/<tool-name>.ts`
- 新高层任务模板 → `gateway/src/skills/<skill-id>.json`
- Worker 注册入口 → `gateway/src/index.ts`
- 通用运行时约束 → `gateway/src/tools/registry.ts`
- 类型接口 → `gateway/src/tools/types.ts`

## 十二、结论

这套系统里，新增能力的标准路径非常明确：

- **要增加新的底层能力，就新增 tool 并注册进 registry**
- **要把已有能力包装成稳定业务任务，就新增 skill JSON 并挂进 `custom_skills`**

记住这句最实用的话：

> **Tool 是执行接口，Skill 是任务模板。**

如果你接下来要真正落地一个新能力，建议先照着现有的：

- `gateway/src/tools/search-knowledge-base.ts`
- `gateway/src/tools/custom-skills.ts`
- `gateway/src/skills/compare_dorms.json`

各做一次“照猫画虎”，不要一开始就重新发明一套风格。
